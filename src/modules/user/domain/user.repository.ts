import { User, Mechanic, UserRole } from './user.entity'

/**
 * User Repository Interface
 * Defines the contract for user data operations
 */
export interface UserRepository {
  /**
   * Find all users for the current tenant
   */
  findAll(): Promise<User[]>

  /**
   * Find users by role
   */
  findByRole(role: UserRole): Promise<User[]>

  /**
   * Find all mechanics
   */
  findAllMechanics(): Promise<Mechanic[]>

  /**
   * Find a user by ID
   */
  findById(id: string): Promise<User | null>

  /**
   * Find a user by auth user ID
   */
  findByAuthUserId(authUserId: string): Promise<User | null>

  /**
   * Find a user by email
   */
  findByEmail(email: string): Promise<User | null>

  /**
   * Create a new user
   */
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>

  /**
   * Update an existing user
   */
  update(id: string, user: Partial<User>): Promise<User>

  /**
   * Update user's last login timestamp
   */
  updateLastLogin(id: string): Promise<User>

  /**
   * Deactivate a user
   */
  deactivate(id: string): Promise<User>

  /**
   * Activate a user
   */
  activate(id: string): Promise<User>

  /**
   * Delete a user (soft delete)
   */
  delete(id: string): Promise<void>
}

