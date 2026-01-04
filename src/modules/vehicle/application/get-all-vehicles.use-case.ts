import { VehicleRepository } from '../domain/vehicle.repository'
import { VehicleWithCustomer } from '../domain/vehicle.entity'

/**
 * Get All Vehicles Use Case
 * Retrieves all vehicles for the current tenant
 */
export class GetAllVehiclesUseCase {
  constructor(private readonly repository: VehicleRepository) {}

  async execute(): Promise<VehicleWithCustomer[]> {
    return this.repository.findAll()
  }
}

