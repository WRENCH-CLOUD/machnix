import { VehicleRepository } from '../domain/vehicle.repository'
import { VehicleWithCustomer } from '../domain/vehicle.entity'

/**
 * Get Vehicle By ID Use Case
 * Retrieves a specific vehicle by its ID with customer information
 */
export class GetVehicleByIdUseCase {
  constructor(private readonly repository: VehicleRepository) {}

  async execute(id: string): Promise<VehicleWithCustomer | null> {
    return this.repository.findById(id)
  }
}
