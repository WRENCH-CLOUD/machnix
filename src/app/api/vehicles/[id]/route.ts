import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { GetVehicleByIdUseCase } from '@/modules/vehicle/application/get-vehicle-by-id.use-case'
import { apiGuardRead, validateRouteId } from '@/lib/auth/api-guard'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idError = validateRouteId(id, 'vehicle')
    if (idError) return idError

    const guard = await apiGuardRead(request)
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const repository = new SupabaseVehicleRepository(supabase, tenantId)
    const useCase = new GetVehicleByIdUseCase(repository)
    
    const vehicle = await useCase.execute(id)
    
    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(vehicle)
  } catch (error: unknown) {
    console.error('Error fetching vehicle:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch vehicle'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
