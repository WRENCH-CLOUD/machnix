import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { UpdateVehicleUseCase } from '@/modules/vehicle/application/update-vehicle.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const body = await request.json()

    const supabase = await createClient()
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
