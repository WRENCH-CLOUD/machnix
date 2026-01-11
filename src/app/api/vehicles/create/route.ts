import { NextRequest, NextResponse } from 'next/server'
import { SupabaseVehicleRepository } from '@/modules/vehicle/infrastructure/vehicle.repository.supabase'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { CreateVehicleUseCase } from '@/modules/vehicle/application/create-vehicle.use-case'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // If ownerPhone is provided, look up the customer
    let customerId = body.customerId
    if (!customerId && body.ownerPhone) {
      const customerRepository = new SupabaseCustomerRepository(supabase, tenantId)
      const customer = await customerRepository.searchByPhone(body.ownerPhone)
      if (customer) {
        customerId = customer.id
      } else {
        return NextResponse.json(
          { error: `No customer found with phone number: ${body.ownerPhone}. Please create the customer first.` },
          { status: 400 }
        )
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Either customer ID or owner phone is required to link the vehicle to a customer.' },
        { status: 400 }
      )
    }

    const vehicleRepository = new SupabaseVehicleRepository(supabase, tenantId)
    const useCase = new CreateVehicleUseCase(vehicleRepository)

    // Look up make name if makeId is a UUID
    let makeName = body.make || ''
    if (body.makeId && body.makeId.includes('-')) {
      // makeId looks like a UUID, look up the name
      const { data: makeData } = await supabase
        .from('vehicle_make')
        .select('name')
        .eq('id', body.makeId)
        .single()
      if (makeData?.name) {
        makeName = makeData.name
      }
    } else if (body.makeId) {
      // makeId is actually a name string
      makeName = body.makeId
    }

    // Map form data to DTO
    const createDTO = {
      customerId,
      make: makeName,
      model: body.model || '',
      year: body.year ? parseInt(body.year) : undefined,
      licensePlate: body.regNo || body.licensePlate,
      color: body.color,
      mileage: body.odometer ? parseInt(body.odometer) : undefined,
    }

    const vehicle = await useCase.execute(createDTO, tenantId)

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating vehicle:', error)
    const message = error instanceof Error ? error.message : 'Failed to create vehicle'
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
