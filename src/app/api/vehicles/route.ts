import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { GetAllVehiclesUseCase } from '@/modules/vehicle/application/get-all-vehicles.use-case'
import { apiGuardRead } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuardRead(request)
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || undefined

    const repository = new SupabaseVehicleRepository(supabase, tenantId)
    const useCase = new GetAllVehiclesUseCase(repository)
    
    const vehicles = await useCase.execute(customerId)
    
    return NextResponse.json(vehicles)
  } catch (error: any) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}
