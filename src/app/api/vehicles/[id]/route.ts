import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { GetVehicleByIdUseCase } from '@/modules/vehicle/application/get-vehicle-by-id.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { tenantId } = auth

    const supabase = await createClient()
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
