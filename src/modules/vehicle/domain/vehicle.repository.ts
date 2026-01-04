import { Vehicle, VehicleWithCustomer } from './vehicle.entity'

/**
 * Vehicle Repository Interface
 * Defines the contract for vehicle data operations
 */
export interface VehicleRepository {
  /**
   * Find all vehicles for the current tenant
   */
  findAll(): Promise<VehicleWithCustomer[]>

  /**
   * Find a vehicle by ID
   */
  findById(id: string): Promise<VehicleWithCustomer | null>

  /**
   * Find vehicles by customer ID
   */
  findByCustomerId(customerId: string): Promise<Vehicle[]>

  /**
   * Search vehicles by query (make, model, license plate)
   */
  search(query: string): Promise<VehicleWithCustomer[]>

  /**
   * Create a new vehicle
   */
  create(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle>

  /**
   * Update an existing vehicle
   */
  update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle>

  /**
   * Delete a vehicle (soft delete)
   */
  delete(id: string): Promise<void>
}

