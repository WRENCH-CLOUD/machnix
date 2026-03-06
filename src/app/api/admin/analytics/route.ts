import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { ensurePlatformAdmin } from '@/lib/auth/is-platform-admin'

export async function GET() {
  try {
    // SECURITY: This endpoint exposes cross-tenant financial data.
    // Must be restricted to platform admins only.
    const adminCheck = await ensurePlatformAdmin()
    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.message || 'Forbidden' },
        { status: adminCheck.status || 403 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get all payments with tenant info
    const { data: allPayments, error: payError } = await supabaseAdmin
      .schema('tenant')
      .from('payments')
      .select(`
        *,
        invoice:invoices(
          invoice_number,
          customer:customers(name)
        )
      `)
      .order('payment_date', { ascending: false })
      .limit(100)

    if (payError) {
      console.error('[ANALYTICS] Error fetching payments:', payError)
      throw payError
    }

    // Get all tenants
    const { data: tenants, error: tenantError } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .select('id, name')

    if (tenantError) {
      console.error('[ANALYTICS] Error fetching tenants:', tenantError)
      throw tenantError
    }

    // Calculate total revenue
    const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const totalPayments = allPayments?.length || 0

    // Count active tenants (those with at least one payment)
    const tenantsWithPayments = new Set(allPayments?.map(p => p.tenant_id))
    const activeTenants = tenantsWithPayments.size

    // Calculate revenue by tenant
    const revenueByTenantMap = new Map<string, { revenue: number; count: number }>()
    allPayments?.forEach(p => {
      const current = revenueByTenantMap.get(p.tenant_id) || { revenue: 0, count: 0 }
      current.revenue += p.amount || 0
      current.count += 1
      revenueByTenantMap.set(p.tenant_id, current)
    })

    const revenueByTenant = Array.from(revenueByTenantMap.entries()).map(([tenant_id, stats]) => {
      const tenant = tenants?.find(t => t.id === tenant_id)
      return {
        tenant_id,
        tenant_name: tenant?.name || 'Unknown',
        revenue: stats.revenue,
        payment_count: stats.count,
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // Calculate revenue by payment method
    const revenueByPaymentMethod = {
      cash: 0,
      card: 0,
      upi: 0,
      bank_transfer: 0,
      cheque: 0,
    }

    allPayments?.forEach(p => {
      const method = (p.payment_method || 'cash') as keyof typeof revenueByPaymentMethod
      if (method in revenueByPaymentMethod) {
        revenueByPaymentMethod[method] += p.amount || 0
      }
    })

    // Format recent payments with tenant names
    const recentPayments = allPayments?.slice(0, 10).map(p => {
      const tenant = tenants?.find(t => t.id === p.tenant_id)
      return {
        ...p,
        tenant_name: tenant?.name || 'Unknown',
      }
    }) || []

    const analytics = {
      totalRevenue,
      totalPayments,
      activeTenants,
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
  
