import { VehicleRepository } from '../domain/vehicle.repository'
import { Vehicle } from '../domain/vehicle.entity'

export interface UpdateVehicleDTO {
  make?: string
  model?: string
  year?: number
  vin?: string
  licensePlate?: string
  color?: string
  mileage?: number
}

/**
 * Update Vehicle Use Case
 * Updates an existing vehicle's information
 */
export class UpdateVehicleUseCase {
  constructor(private readonly repository: VehicleRepository) {}

  async execute(id: string, dto: UpdateVehicleDTO): Promise<Vehicle> {
    // Check if vehicle exists
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error('Vehicle not found')
    }

    return this.repository.update(id, dto)
  }
}
