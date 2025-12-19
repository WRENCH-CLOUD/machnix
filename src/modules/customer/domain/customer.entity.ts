/**
 * Customer Entity
 * Domain model representing a customer in the system
 */
export interface Customer {
  id: string
  tenantId: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}

/**
 * Customer with related vehicles
 */
export interface CustomerWithVehicles extends Customer {
  vehicles?: any[] // To avoid circular dependency, we use any here
}
