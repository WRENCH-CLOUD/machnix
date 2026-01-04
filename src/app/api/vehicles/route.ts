import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { GetAllVehiclesUseCase } from '@/modules/vehicle/application/get-all-vehicles.use-case'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
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
    const useCase = new GetAllVehiclesUseCase(repository)
    
    const vehicles = await useCase.execute()
    
    return NextResponse.json(vehicles)
  } catch (error: any) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}
