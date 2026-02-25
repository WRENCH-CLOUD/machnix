import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { DeleteVehicleUseCase } from '@/modules/vehicle/application/delete-vehicle.use-case'
import { apiGuardWrite, validateRouteId } from '@/lib/auth/api-guard'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idError = validateRouteId(id, 'vehicle')
    if (idError) return idError

    const guard = await apiGuardWrite(request, 'delete-vehicle')
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const repository = new SupabaseVehicleRepository(supabase, tenantId)
    const useCase = new DeleteVehicleUseCase(repository)
    
    await useCase.execute(id)
    
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting vehicle:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete vehicle'
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
