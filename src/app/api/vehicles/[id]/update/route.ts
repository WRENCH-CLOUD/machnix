import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { UpdateVehicleUseCase } from '@/modules/vehicle/application/update-vehicle.use-case'
import { apiGuardWrite, validateRouteId } from '@/lib/auth/api-guard'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idError = validateRouteId(id, 'vehicle')
    if (idError) return idError

    const guard = await apiGuardWrite(request, 'update-vehicle')
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

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
