import { VehicleRepository } from '../domain/vehicle.repository'

/**
 * Delete Vehicle Use Case
 * Deletes a vehicle from the system
 */
export class DeleteVehicleUseCase {
  constructor(private readonly repository: VehicleRepository) {}

  async execute(id: string): Promise<void> {
    // Check if vehicle exists
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error('Vehicle not found')
    }

    await this.repository.delete(id)
  }
}
