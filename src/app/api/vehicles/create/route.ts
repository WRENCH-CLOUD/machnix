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

    // Validate registration number format (Indian standard)
    const regNo = (body.reg_no || body.regNo || body.licensePlate || "").toUpperCase()
    const regNoRegex = /^[A-Z]{2}[ \-]{0,1}[0-9]{2}[ \-]{0,1}[A-Z]{1,2}[ \-]{0,1}[0-9]{4}$/
    
    if (!regNo) {
      return NextResponse.json({ error: 'Registration number is required' }, { status: 400 })
    }
    
    if (!regNoRegex.test(regNo)) {
      return NextResponse.json(
        { error: 'Invalid vehicle registration format. Expected format like MH12AB1234' },
        { status: 400 }
      )
    }

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

    // Look up make name from makeId
    let makeName = body.make || ''
    let makeId = null
    if (body.makeId) {
      const { data: makeData } = await supabase
        .from('vehicle_make')
        .select('id, name')
        .eq('id', body.makeId)
        .single()
      if (makeData) {
        makeId = makeData.id
        makeName = makeData.name
      }
    }

    // Look up model name from modelId
    let modelName = body.model || ''
    let modelId = null
    if (body.modelId) {
      const { data: modelData } = await supabase
        .from('vehicle_model')
        .select('id, name')
        .eq('id', body.modelId)
        .single()
      if (modelData) {
        modelId = modelData.id
        modelName = modelData.name
      }
    }

    // Map form data to DTO
    const createDTO = {
      customerId,
      makeId,
      modelId,
      make: makeName,
      model: modelName,
      year: body.year ? parseInt(body.year) : undefined,
      licensePlate: regNo,
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
