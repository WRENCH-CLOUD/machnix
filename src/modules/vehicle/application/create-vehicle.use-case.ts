import { VehicleRepository } from '../domain/vehicle.repository'
import { Vehicle } from '../domain/vehicle.entity'

export interface CreateVehicleDTO {
  customerId: string
  makeId?: string       // FK to public.vehicle_make
  modelId?: string      // FK to public.vehicle_model
  make: string          // text for display
  model: string         // text for display
  year?: number
  vin?: string
  licensePlate?: string
  color?: string
  mileage?: number
}

/**
 * Create Vehicle Use Case
 * Creates a new vehicle in the system
 */
export class CreateVehicleUseCase {
  constructor(private readonly repository: VehicleRepository) {}

  async execute(dto: CreateVehicleDTO, tenantId: string): Promise<Vehicle> {
    // Validation
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required')
    }
    if (!dto.make || dto.make.trim().length === 0) {
      throw new Error('Vehicle make is required')
    }
    if (!dto.model || dto.model.trim().length === 0) {
      throw new Error('Vehicle model is required')
    }

    return this.repository.create({
      ...dto,
      tenantId,
      make: dto.make.trim(),
      model: dto.model.trim(),
    })
  }
}

