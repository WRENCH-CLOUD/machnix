import { UserRepository } from '../domain/user.repository'
import { User } from '../domain/user.entity'

/**
 * Deactivate User Use Case
 * Deactivates a user account
 */
export class DeactivateUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(userId: string): Promise<User> {
    // Check if user exists
    const user = await this.repository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Check if already inactive
    if (!user.isActive) {
      throw new Error('User is already inactive')
    }

    return this.repository.deactivate(userId)
  }
}

