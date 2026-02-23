
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'
import { GetTenantSettingsUseCase } from '@/modules/tenant/application/get-tenant-settings.usecase'
import { UpdateTenantSettingsUseCase } from '@/modules/tenant/application/update-tenant-settings.usecase'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const supabase = await createClient()
    const repository = new SupabaseTenantRepository(supabase)
    const useCase = new GetTenantSettingsUseCase(repository)

    const result = await useCase.execute(tenantId)

    // Combine for frontend
    return NextResponse.json({
      name: result.name,
      ...(result.settings ?? {})
    })
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const body = await request.json()
    const supabase = await createClient()
    const repository = new SupabaseTenantRepository(supabase)
    const useCase = new UpdateTenantSettingsUseCase(repository)

    await useCase.execute(tenantId, body)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}
