import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { ensurePlatformAdmin } from '@/lib/auth/is-platform-admin'

/**
 * POST /api/admin/impersonate
 * 
 * Creates an impersonation session for a platform admin to access a tenant's dashboard.
 * This sets a temporary impersonation cookie that the middleware can use to switch context.
 * 
 * Security: Only platform admins can use this endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the requester is a platform admin
    const auth = await ensurePlatformAdmin()
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.message || 'Forbidden' },
        { status: auth.status ?? 403 }
      )
    }

    const { tenantId } = await request.json()
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Verify tenant exists
    const supabaseAdmin = getSupabaseAdmin()
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .schema('tenant')
      .from('tenants')
      .select('id, name, slug')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Create impersonation response with cookie
    const response = NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      redirectUrl: '/dashboard', // Redirect to tenant dashboard
    })

    // Audit log: Record impersonation start for security tracking
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'unknown'
    
    await supabaseAdmin
      .schema('tenant')
      .from('activities')
      .insert({
        tenant_id: tenantId,
        activity_type: 'admin_impersonation_started',
        user_id: auth.user!.id,
        description: `Platform admin ${auth.user!.email} started impersonating tenant`,
        metadata: { 
          admin_email: auth.user!.email,
          admin_id: auth.user!.id,
          ip_address: clientIp,
          tenant_name: tenant.name,
        }
      })

    // Set impersonation cookie (expires in 1 hour)
    response.cookies.set('impersonate_tenant_id', tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })

    return response
  } catch (error) {
    console.error('[IMPERSONATE] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to start impersonation',
        details: 'Please check server logs for more information',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/impersonate
 * 
 * Ends an impersonation session by clearing the impersonation cookie.
 */
export async function DELETE() {
  try {
    const auth = await ensurePlatformAdmin()
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.message || 'Forbidden' },
        { status: auth.status ?? 403 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: 'Impersonation ended',
    })

    // Clear impersonation cookie
    response.cookies.delete('impersonate_tenant_id')

    return response
  } catch (error) {
    console.error('[IMPERSONATE_END] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to end impersonation' },
      { status: 500 }
    )
  }
}
