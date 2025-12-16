import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/app/modules/vehicle-management/infrastructure/vehicle.repository.supabase'
import { CreateVehicleUseCase } from '@/app/modules/vehicle-management/application/create-vehicle.use-case'
import { ensureTenantContext } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const tenantId = ensureTenantContext()
    const body = await request.json()
    
    const repository = new SupabaseVehicleRepository()
    const useCase = new CreateVehicleUseCase(repository)
    
    const vehicle = await useCase.execute(body, tenantId)
    
    return NextResponse.json(vehicle, { status: 201 })
  } catch (error: any) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create vehicle' },
      { status: 400 }
    )
  }
}
