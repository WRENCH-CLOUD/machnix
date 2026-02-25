import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { TIER_PRICING, normalizeTier, type SubscriptionTier } from '@/config/plan-features'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // =============================================
    // 1. PLATFORM SUBSCRIPTION STATS
    // =============================================

    // Get all tenants with subscription info (only select columns guaranteed to exist)
    const { data: allTenants, error: tenantError } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .select('id, name, status, subscription, subscription_status, created_at')

    if (tenantError) {
      console.error('[ANALYTICS] Error fetching tenants:', tenantError)
      throw tenantError
    }

    // Count subscriptions by tier
    const activeSubscriptions = {
      basic: 0,
      pro: 0,
      enterprise: 0,
    }

    let totalSubscriptionsRevenue = 0

    allTenants?.forEach((t: any) => {
      const tier = normalizeTier(t.subscription)
      if (tier in activeSubscriptions) {
        activeSubscriptions[tier as keyof typeof activeSubscriptions] += 1
      }
      // Calculate MRR based on tier pricing
      if (t.status === 'active' || t.subscription_status === 'active') {
        const pricing = TIER_PRICING[tier]
        if (pricing) {
          totalSubscriptionsRevenue += pricing.monthly
        }
      }
    })

    // =============================================
    // 2. TENANT BENCHMARKS (from admin_tenant_overview)
    // =============================================

    const { data: tenantOverviews, error: overviewError } = await supabaseAdmin
      .schema('tenant')
      .from('admin_tenant_overview')
      .select('*')

    if (overviewError) {
      console.error('[ANALYTICS] Error fetching overviews:', overviewError)
      // Non-fatal: continue with empty data
    }

    let totalGarageRevenue = 0
    let totalJobsProcessed = 0
    let totalCustomers = 0
    let totalVehicles = 0

    const individualTenantUsage: Array<{
      tenant_id: string
      tenant_name: string
      tier: string
      subscription_status: string
      revenue: number
      jobs_count: number
      jobs_this_month: number
      customer_count: number
      vehicle_count: number
      staff_count: number
      whatsapp_sent: number
      last_job_date: string | null
      uses_inventory: boolean
      created_at: string
    }> = []

    tenantOverviews?.forEach((t: any) => {
      const revenue = Number(t.total_revenue) || 0
      // total_jobs may not exist in old view; fall back to completed + active
      const jobs = Number(t.total_jobs) || (Number(t.completed_jobs || 0) + Number(t.active_jobs || 0))
      const customers = Number(t.customer_count) || 0
      const vehicles = Number(t.vehicle_count) || 0

      totalGarageRevenue += revenue
      totalJobsProcessed += jobs
      totalCustomers += customers
      totalVehicles += vehicles

      // Get whatsapp count from usage_counters (only available after 0007 migration)
      const usageCounters = t.usage_counters || {}
      const whatsappSent = Number(usageCounters.whatsapp_count) || 0

      // Look up tenant subscription from allTenants since old view may not have it
      const tenantRecord = allTenants?.find((tt: any) => tt.id === t.id)

      individualTenantUsage.push({
        tenant_id: t.id,
        tenant_name: t.name,
        tier: t.subscription || tenantRecord?.subscription || 'basic',
        subscription_status: t.subscription_status || tenantRecord?.subscription_status || 'trial',
        revenue,
        jobs_count: jobs,
        jobs_this_month: Number(t.jobs_this_month) || 0,
        customer_count: customers,
        vehicle_count: vehicles,
        staff_count: Number(t.staff_count) || Number(t.mechanic_count) || 0,
        whatsapp_sent: whatsappSent,
        last_job_date: t.last_job_date || null,
        uses_inventory: Boolean(t.uses_inventory),
        created_at: t.created_at,
      })
    })

    // Sort by revenue descending
    individualTenantUsage.sort((a, b) => b.revenue - a.revenue)

    // =============================================
    // 3. AT-RISK / CHURN DETECTION
    // =============================================

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Idle tenants: no jobs in last 7 days
    const idleTenants = individualTenantUsage.filter(t => {
      if (!t.last_job_date) return true
      return new Date(t.last_job_date) < sevenDaysAgo
    })

    // Feature adoption: Pro users using inventory
    const proTenants = individualTenantUsage.filter(t => t.tier === 'pro')
    const proWithInventory = proTenants.filter(t => t.uses_inventory)
    const inventoryAdoptionRate = proTenants.length > 0
      ? Math.round((proWithInventory.length / proTenants.length) * 100)
      : 0

    // =============================================
    // 4. PAYMENT DATA (existing)
    // =============================================

    const { data: allPayments, error: payError } = await supabaseAdmin
      .schema('tenant')
      .from('payments')
      .select('id, tenant_id, amount, payment_method, payment_date, status')
      .order('payment_date', { ascending: false })
      .limit(100)

    if (payError) {
      console.error('[ANALYTICS] Error fetching payments:', payError)
      // Non-fatal
    }

    // Revenue by payment method
    const revenueByPaymentMethod = {
      cash: 0,
      card: 0,
      upi: 0,
      bank_transfer: 0,
      cheque: 0,
    }

    allPayments?.forEach((p: any) => {
      const method = (p.payment_method || 'cash') as keyof typeof revenueByPaymentMethod
      if (method in revenueByPaymentMethod) {
        revenueByPaymentMethod[method] += Number(p.amount) || 0
      }
    })

    // Revenue by tenant
    const revenueByTenantMap = new Map<string, { revenue: number; count: number }>()
    allPayments?.forEach((p: any) => {
      const current = revenueByTenantMap.get(p.tenant_id) || { revenue: 0, count: 0 }
      current.revenue += Number(p.amount) || 0
      current.count += 1
      revenueByTenantMap.set(p.tenant_id, current)
    })

    const revenueByTenant = Array.from(revenueByTenantMap.entries()).map(([tenant_id, stats]) => {
      const tenant = allTenants?.find((t: any) => t.id === tenant_id)
      return {
        tenant_id,
        tenant_name: tenant?.name || 'Unknown',
        revenue: stats.revenue,
        payment_count: stats.count,
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // Recent payments
    const recentPayments = allPayments?.slice(0, 10).map((p: any) => {
      const tenant = allTenants?.find((t: any) => t.id === p.tenant_id)
      return {
        ...p,
        tenant_name: tenant?.name || 'Unknown',
      }
    }) || []

    // =============================================
    // 5. BILLING / NET PROFIT CALCULATION
    // =============================================

    // Platform costs estimate (simplified)
    const totalActiveTenants = Object.values(activeSubscriptions).reduce((a, b) => a + b, 0)
    const estimatedMonthlyCost = totalActiveTenants * 200 // Estimated per-tenant cost in INR

    const netProfit = totalSubscriptionsRevenue - estimatedMonthlyCost

    // =============================================
    // RESPONSE
    // =============================================

    const analytics = {
      // Platform stats
      platform_stats: {
        total_subscriptions_revenue: totalSubscriptionsRevenue,
        active_subscriptions: activeSubscriptions,
        total_tenants: allTenants?.length || 0,
        mrr: totalSubscriptionsRevenue,
        net_profit: netProfit,
      },

      // Tenant benchmarks
      tenant_benchmarks: {
        total_garage_revenue: totalGarageRevenue,
        total_jobs_processed: totalJobsProcessed,
        total_customers: totalCustomers,
        total_vehicles: totalVehicles,
      },

      // Individual tenant usage
      individual_tenant_usage: individualTenantUsage,

      // Top performers (top 5 by revenue)
      top_performers: individualTenantUsage.slice(0, 5),

      // At-risk / churn detection
      churn_detection: {
        idle_tenants: idleTenants.slice(0, 10),
        idle_count: idleTenants.length,
        inventory_adoption_rate: inventoryAdoptionRate,
        pro_tenants_count: proTenants.length,
        pro_using_inventory: proWithInventory.length,
      },

      // Payment data (existing)
      totalRevenue: totalGarageRevenue,
      totalPayments: allPayments?.length || 0,
      activeTenants: totalActiveTenants,
      revenueByTenant,
      recentPayments,
      revenueByPaymentMethod,
    }

    return NextResponse.json({
      success: true,
      analytics,
    })

  } catch (error) {
    console.error('[ANALYTICS] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    )
  }
}
