import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAdmin } from '@/lib/supabase/auth-helpers'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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
    const { id: tenantId } = await context.params

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

    // Extract metadata
    const metadata = tenant.metadata as Record<string, unknown> || {}

    const tenantWithStats = {
      ...tenant,
      customer_count: customerCount || 0,
      active_jobs: activeJobsCount || 0,
      completed_jobs: completedJobsCount || 0,
      mechanic_count: mechanicCount || 0,
      total_revenue: totalRevenue,
      status: (metadata.status as string) || 'active',
      subscription: (metadata.subscription as string) || 'pro',
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

interface UpdateTenantRequest {
  name?: string
  slug?: string
  status?: 'active' | 'suspended' | 'trial'
  subscription?: 'starter' | 'pro' | 'enterprise'
  notes?: string
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
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
    const { id: tenantId } = await context.params

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    const body: UpdateTenantRequest = await request.json()

    // Validate slug format if provided
    if (body.slug) {
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(body.slug)) {
        return NextResponse.json(
          { error: 'Invalid tenant slug. Use only lowercase letters, numbers, and hyphens.' },
          { status: 400 }
        )
      }

      // Check if slug is already taken by another tenant
      const { data: existingTenant } = await supabaseAdmin
        .schema('tenant')
        .from('tenants')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', tenantId)
        .single()

      if (existingTenant) {
        return NextResponse.json(
          { error: 'Tenant slug already exists. Please choose a different slug.' },
          { status: 409 }
        )
      }
    }

    // Fetch existing tenant to get current metadata
    const { data: existingTenant, error: fetchError } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (fetchError || !existingTenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Build update object
    const existingMetadata = existingTenant.metadata as Record<string, unknown> || {}
    const updateData: Record<string, unknown> = {}

    if (body.name) {
      updateData.name = body.name
    }

    if (body.slug) {
      updateData.slug = body.slug
    }

    // Update metadata fields
    const newMetadata = { ...existingMetadata }
    if (body.status) {
      newMetadata.status = body.status
    }
    if (body.subscription) {
      newMetadata.subscription = body.subscription
    }
    if (body.notes !== undefined) {
      newMetadata.notes = body.notes
    }
    newMetadata.updated_at = new Date().toISOString()
    newMetadata.updated_by = authResult.userId

    updateData.metadata = newMetadata

    // Update tenant
    const { data: updatedTenant, error: updateError } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId)
      .select()
      .single()

    if (updateError || !updatedTenant) {
      console.error('[TENANT_UPDATE] Error updating tenant:', updateError)
      throw new Error('Failed to update tenant')
    }

    console.log(`[TENANT_UPDATE] Tenant updated successfully: ${tenantId}`)

    return NextResponse.json({
      success: true,
      message: 'Tenant updated successfully',
      tenant: updatedTenant,
    })

  } catch (error) {
    console.error('[TENANT_UPDATE] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update tenant',
        details: 'Please check server logs for more information'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
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
    const { id: tenantId } = await context.params

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Fetch tenant to verify it exists
    const { data: existingTenant, error: fetchError } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (fetchError || !existingTenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get all users associated with this tenant
    const { data: tenantUsers } = await supabaseAdmin
      .schema('tenant')
      .from('users')
      .select('auth_user_id')
      .eq('tenant_id', tenantId)

    // Delete tenant users from tenant.users table
    const { error: usersDeleteError } = await supabaseAdmin
      .schema('tenant')
      .from('users')
      .delete()
      .eq('tenant_id', tenantId)

    if (usersDeleteError) {
      console.error('[TENANT_DELETE] Error deleting tenant users:', usersDeleteError)
      // Continue with deletion - users can be orphaned
    }

    // Delete auth users associated with this tenant
    if (tenantUsers && tenantUsers.length > 0) {
      for (const user of tenantUsers) {
        if (user.auth_user_id) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(user.auth_user_id)
          } catch (err) {
            console.error(`[TENANT_DELETE] Error deleting auth user ${user.auth_user_id}:`, err)
            // Continue with other deletions
          }
        }
      }
    }

    // Delete tenant record
    const { error: tenantDeleteError } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .delete()
      .eq('id', tenantId)

    if (tenantDeleteError) {
      console.error('[TENANT_DELETE] Error deleting tenant:', tenantDeleteError)
      throw new Error('Failed to delete tenant')
    }

    console.log(`[TENANT_DELETE] Tenant deleted successfully: ${tenantId}`)

    return NextResponse.json({
      success: true,
      message: 'Tenant deleted successfully',
    })

  } catch (error) {
    console.error('[TENANT_DELETE] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete tenant',
        details: 'Please check server logs for more information'
      },
      { status: 500 }
    )
  }
}
