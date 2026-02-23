import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { GetAllVehiclesUseCase } from '@/modules/vehicle/application/get-all-vehicles.use-case'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

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
