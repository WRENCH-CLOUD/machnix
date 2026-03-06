
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'
import { GetTenantSettingsUseCase } from '@/modules/tenant/application/get-tenant-settings.usecase'
import { UpdateTenantSettingsUseCase } from '@/modules/tenant/application/update-tenant-settings.usecase'
import { apiGuardRead, apiGuardAdmin } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuardRead(request)
    if (!guard.ok) return guard.response

    const { tenantId, supabase } = guard

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
    // SECURITY: Only tenant owners/admins can modify settings
    const guard = await apiGuardAdmin(request, 'update-settings')
    if (!guard.ok) return guard.response

    const { tenantId, supabase } = guard

    const body = await request.json()
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
