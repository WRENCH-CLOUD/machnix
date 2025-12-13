import { supabase, ensureTenantContext } from '../client'
import type { Database } from '../types'

type Payment = Database['tenant']['Tables']['payments']['Row']

export interface RevenueAnalytics {
  totalRevenue: number
  paidAmount: number
  pendingAmount: number
  partialAmount: number
  paymentCount: number
  averagePaymentValue: number
  revenueByMethod: {
    cash: number
    card: number
    upi: number
    bank_transfer: number
    cheque: number
  }
}

export interface RecentPayment extends Payment {
  invoice?: {
    invoice_number: string
    customer?: {
      name: string
    }
  }
}

export interface TenantAnalytics {
  revenue: RevenueAnalytics
  recentPayments: RecentPayment[]
  topPaymentMethod: string
  monthlyRevenue: number
  dailyRevenue: number
}

export interface GlobalAnalytics {
  totalRevenue: number
  totalPayments: number
  activeTenants: number
  revenueByTenant: Array<{
    tenant_id: string
    tenant_name: string
    revenue: number
    payment_count: number
  }>
  recentPayments: Array<RecentPayment & { tenant_name: string }>
  revenueByPaymentMethod: {
    cash: number
    card: number
    upi: number
    bank_transfer: number
    cheque: number
  }
}

export class AnalyticsService {
  /**
   * Get revenue analytics for current tenant
   */
  static async getTenantRevenueAnalytics(): Promise<RevenueAnalytics> {
    const tenantId = ensureTenantContext()

    // Get all payments
    const { data: payments, error: payError } = await supabase
      .schema('tenant')
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)

    if (payError) throw payError

    // Get all invoices
    const { data: invoices, error: invError } = await supabase
      .schema('tenant')
      .from('invoices')
      .select('total_amount, paid_amount, status')
      .eq('tenant_id', tenantId)

    if (invError) throw invError

    // Calculate totals
    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
    const paidAmount = invoices?.filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
    const partialAmount = invoices?.filter(inv => inv.status === 'partial')
      .reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0
    const pendingAmount = totalRevenue - paidAmount - partialAmount

    const paymentCount = payments?.length || 0
    const totalPaymentAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const averagePaymentValue = paymentCount > 0 ? totalPaymentAmount / paymentCount : 0

    // Calculate revenue by payment method
    const revenueByMethod = {
      cash: 0,
      card: 0,
      upi: 0,
      bank_transfer: 0,
      cheque: 0,
    }

    payments?.forEach(p => {
      const method = p.payment_method || 'cash'
      if (revenueByMethod.hasOwnProperty(method)) {
        revenueByMethod[method as keyof typeof revenueByMethod] += p.amount || 0
      }
    })

    return {
      totalRevenue,
      paidAmount: paidAmount + partialAmount,
      pendingAmount,
      partialAmount,
      paymentCount,
      averagePaymentValue,
      revenueByMethod,
    }
  }

  /**
   * Get recent payments for current tenant
   */
  static async getRecentPayments(limit: number = 10): Promise<RecentPayment[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('payments')
      .select(`
        *,
        invoice:invoices(
          invoice_number,
          customer:customers(name)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('payment_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as RecentPayment[]
  }

  /**
   * Get complete tenant analytics
   */
  static async getTenantAnalytics(): Promise<TenantAnalytics> {
    const revenue = await this.getTenantRevenueAnalytics()
    const recentPayments = await this.getRecentPayments(10)

    // Find top payment method
    const methods = Object.entries(revenue.revenueByMethod)
    const topPaymentMethod = methods.reduce((a, b) => a[1] > b[1] ? a : b)[0]

    // Calculate monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const monthlyPayments = recentPayments.filter(
      p => new Date(p.payment_date || p.paid_at || '') >= thirtyDaysAgo
    )
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

    // Calculate daily revenue (today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dailyPayments = recentPayments.filter(
      p => new Date(p.payment_date || p.paid_at || '') >= today
    )
    const dailyRevenue = dailyPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

    return {
      revenue,
      recentPayments,
      topPaymentMethod,
      monthlyRevenue,
      dailyRevenue,
    }
  }

  /**
   * Get global analytics across all tenants (Platform Admin only)
   */
  static async getGlobalAnalytics(): Promise<GlobalAnalytics> {
    // Get all payments with tenant info
    const { data: allPayments, error: payError } = await supabase
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

    if (payError) throw payError

    // Get all tenants
    const { data: tenants, error: tenantError } = await supabase
      .schema('tenant')
      .from('tenants')
      .select('id, name')

    if (tenantError) throw tenantError

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
      const method = p.payment_method || 'cash'
      if (revenueByPaymentMethod.hasOwnProperty(method)) {
        revenueByPaymentMethod[method as keyof typeof revenueByPaymentMethod] += p.amount || 0
      }
    })

    // Get recent payments with tenant names
    const recentPayments = allPayments?.slice(0, 20).map(p => {
      const tenant = tenants?.find(tn => tn.id === p.tenant_id)
      return {
        ...p,
        tenant_name: tenant?.name || 'Unknown',
      } as RecentPayment & { tenant_name: string }
    }) || []

    return {
      totalRevenue,
      totalPayments,
      activeTenants,
      revenueByTenant,
      recentPayments,
      revenueByPaymentMethod,
    }
  }

  /**
   * Get revenue trends for a tenant (daily/weekly/monthly)
   */
  static async getRevenueTrends(_period: 'daily' | 'weekly' | 'monthly' = 'daily', days: number = 7): Promise<Array<{ date: string; revenue: number; count: number }>> {
    const tenantId = ensureTenantContext()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: payments, error } = await supabase
      .schema('tenant')
      .from('payments')
      .select('payment_date, paid_at, amount')
      .eq('tenant_id', tenantId)
      .gte('payment_date', startDate.toISOString())
      .order('payment_date', { ascending: true })

    if (error) throw error

    // Group by date
    const trendsMap = new Map<string, { revenue: number; count: number }>()
    
    payments?.forEach(p => {
      const date = new Date(p.payment_date || p.paid_at || '').toISOString().split('T')[0]
      const current = trendsMap.get(date) || { revenue: 0, count: 0 }
      current.revenue += p.amount || 0
      current.count += 1
      trendsMap.set(date, current)
    })

    return Array.from(trendsMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }
}
