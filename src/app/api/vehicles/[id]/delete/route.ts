import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { DeleteVehicleUseCase } from '@/modules/vehicle/application/delete-vehicle.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function DELETE(
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
