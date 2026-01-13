/**
 * Vehicle Entity
 * Domain model representing a vehicle in the system
 */
export interface Vehicle {
  id: string
  tenantId: string
  customerId: string
  makeId?: string      // FK to public.vehicle_make
  modelId?: string     // FK to public.vehicle_model
  make: string         // text (denormalized for display)
  model: string        // text (denormalized for display)
  year?: number
  vin?: string
  licensePlate?: string
  color?: string
  mileage?: number
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}

/**
 * Vehicle with related customer information
 */
export interface VehicleWithCustomer extends Vehicle {
  customer?: any // To avoid circular dependency
}
