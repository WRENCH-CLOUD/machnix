import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { ensurePlatformAdmin } from '@/lib/auth/is-platform-admin'
import { GetTenantWithStatsUseCase, UpdateTenantUseCase, DeleteTenantUseCase } from '@/modules/tenant'
import { AdminSupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.admin'

export async function GET(
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
    const usecase = new GetTenantWithStatsUseCase(repo)

    const tenant = await usecase.execute(tenantId)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, tenant })
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

export async function PATCH(
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
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    const body = await request.json()

    const supabaseAdmin = getSupabaseAdmin()
    const repo = new AdminSupabaseTenantRepository(supabaseAdmin)
    const usecase = new UpdateTenantUseCase(repo)

    const updated = await usecase.execute(tenantId, body)
    return NextResponse.json({ success: true, tenant: updated })
  } catch (error) {
    console.error('[TENANT_UPDATE] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Failed to update tenant'
    const status = message.includes('not found') ? 404 : message.includes('Slug is already in use') ? 409 : 500
    return NextResponse.json(
      {
        error: message,
        details: 'Please check server logs for more information',
      },
      { status }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
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
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const repo = new AdminSupabaseTenantRepository(supabaseAdmin)
    const usecase = new DeleteTenantUseCase(repo)

    await usecase.execute(tenantId)
    return NextResponse.json({ success: true, message: 'Tenant deleted successfully' })
  } catch (error) {
    console.error('[TENANT_DELETE] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete tenant'
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
