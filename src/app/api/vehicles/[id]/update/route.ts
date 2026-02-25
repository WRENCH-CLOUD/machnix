import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { UpdateVehicleUseCase } from '@/modules/vehicle/application/update-vehicle.use-case'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const body = await request.json()
    
    const repository = new SupabaseVehicleRepository(supabase, tenantId)
    const useCase = new UpdateVehicleUseCase(repository)
    
    const vehicle = await useCase.execute(id, body)
    
    return NextResponse.json(vehicle)
  } catch (error: unknown) {
    console.error('Error updating vehicle:', error)
    const message = error instanceof Error ? error.message : 'Failed to update vehicle'
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
