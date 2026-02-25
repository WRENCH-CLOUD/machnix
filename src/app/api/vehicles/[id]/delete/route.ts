import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { DeleteVehicleUseCase } from '@/modules/vehicle/application/delete-vehicle.use-case'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
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
