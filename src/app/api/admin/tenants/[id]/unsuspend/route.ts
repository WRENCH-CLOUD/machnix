import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { ensurePlatformAdmin } from '@/lib/auth/is-platform-admin'
import { UpdateTenantUseCase } from '@/modules/tenant'
import { AdminSupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await ensurePlatformAdmin()
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.message || 'Forbidden' },
        { status: auth.status ?? 403 }
      )
    }

    const { id: tenantId } = await params
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const repo = new AdminSupabaseTenantRepository(supabaseAdmin)
    const usecase = new UpdateTenantUseCase(repo)

    // Update tenant status back to active
    const updated = await usecase.execute(tenantId, { status: 'active' })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tenant un-suspended successfully',
      tenant: updated 
    })
  } catch (error) {
    console.error('[TENANT_UNSUSPEND] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Failed to un-suspend tenant'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json(
      {
        error: message,
        details: 'Please check server logs for more information',
      },
      { status }
    )
  }
}
