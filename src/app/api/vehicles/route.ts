import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/app/modules/vehicle-management/infrastructure/vehicle.repository.supabase'
import { GetAllVehiclesUseCase } from '@/app/modules/vehicle-management/application/get-all-vehicles.use-case'

export async function GET() {
  try {
    const repository = new SupabaseVehicleRepository()
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
