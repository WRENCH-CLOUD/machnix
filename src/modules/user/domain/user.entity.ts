/**
 * User Role Types
 */
export type UserRole = 'admin' | 'tenant' | 'mechanic' | 'employee'

/**
 * User Entity
 * Domain model representing a user in the system
 */
export interface User {
  id: string
  tenantId: string
  authUserId: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatarUrl?: string
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}

/**
 * Mechanic Entity (extends User with mechanic-specific fields)
 */
export interface Mechanic extends User {
  specialty?: string
}
