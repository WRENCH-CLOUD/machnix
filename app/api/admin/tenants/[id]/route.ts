import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const tenantId = params.id

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Fetch tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      console.error('[TENANT_DETAILS] Error fetching tenant:', tenantError)
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get customer count
    const { count: customerCount } = await supabaseAdmin
      .schema('tenant')
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    // Get active jobs count
    const { count: activeJobsCount } = await supabaseAdmin
      .schema('tenant')
      .from('jobcards')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'in_progress', 'on_hold'])

    // Get completed jobs count
    const { count: completedJobsCount } = await supabaseAdmin
      .schema('tenant')
      .from('jobcards')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')

    // Get mechanic count
    const { count: mechanicCount } = await supabaseAdmin
      .schema('tenant')
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('role', 'mechanic')
      .eq('is_active', true)

    // Get total revenue from invoices
    const { data: invoices } = await supabaseAdmin
      .schema('tenant')
      .from('invoices')
      .select('total_amount')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')

    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

    const tenantWithStats = {
      ...tenant,
      customer_count: customerCount || 0,
      active_jobs: activeJobsCount || 0,
      completed_jobs: completedJobsCount || 0,
      mechanic_count: mechanicCount || 0,
      total_revenue: totalRevenue,
    }

    return NextResponse.json({
      success: true,
      tenant: tenantWithStats,
    })

  } catch (error) {
    console.error('[TENANT_DETAILS] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch tenant details',
        details: 'Please check server logs for more information'
      },
      { status: 500 }
    )
  }
}
