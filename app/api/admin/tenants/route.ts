import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAdmin } from '@/lib/supabase/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // Verify platform admin authorization
    const authResult = await verifyPlatformAdmin()
    if (!authResult.isAuthorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.userId ? 403 : 401 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch all tenants
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (tenantsError) {
      console.error('[TENANT_LIST] Error fetching tenants:', tenantsError)
      throw new Error('Failed to fetch tenants')
    }

    // Fetch stats for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        try {
          // Get customer count
          const { count: customerCount } = await supabaseAdmin
            .schema('tenant')
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)

          // Get active jobs count
          const { count: activeJobsCount } = await supabaseAdmin
            .schema('tenant')
            .from('jobcards')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .in('status', ['pending', 'in_progress', 'on_hold'])

          // Get completed jobs count
          const { count: completedJobsCount } = await supabaseAdmin
            .schema('tenant')
            .from('jobcards')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .eq('status', 'completed')

          // Get mechanic count
          const { count: mechanicCount } = await supabaseAdmin
            .schema('tenant')
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .eq('role', 'mechanic')
            .eq('is_active', true)

          // Get total revenue from invoices
          const { data: invoices } = await supabaseAdmin
            .schema('tenant')
            .from('invoices')
            .select('total_amount')
            .eq('tenant_id', tenant.id)
            .eq('status', 'paid')

          const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

          // Extract metadata
          const metadata = tenant.metadata as any || {}

          return {
            ...tenant,
            customer_count: customerCount || 0,
            active_jobs: activeJobsCount || 0,
            completed_jobs: completedJobsCount || 0,
            mechanic_count: mechanicCount || 0,
            total_revenue: totalRevenue,
            status: metadata.status || 'active',
            subscription: metadata.subscription || 'pro',
          }
        } catch (err) {
          console.error(`[TENANT_LIST] Error fetching stats for tenant ${tenant.id}:`, err)
          // Return tenant with default stats if there's an error
          return {
            ...tenant,
            customer_count: 0,
            active_jobs: 0,
            completed_jobs: 0,
            mechanic_count: 0,
            total_revenue: 0,
            status: 'active' as const,
            subscription: 'pro' as const,
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      tenants: tenantsWithStats,
    })

  } catch (error) {
    console.error('[TENANT_LIST] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch tenants',
        details: 'Please check server logs for more information'
      },
      { status: 500 }
    )
  }
}
