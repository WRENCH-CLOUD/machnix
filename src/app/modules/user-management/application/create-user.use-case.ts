import { UserRepository } from '../domain/user.repository'
import { User, UserRole } from '../domain/user.entity'

export interface CreateUserDTO {
  authUserId: string
  name: string
  email: string
  phone?: string
  role: UserRole
  specialty?: string
  avatarUrl?: string
}

/**
 * Create User Use Case
 * Creates a new user in the system
 */
export class CreateUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(dto: CreateUserDTO, tenantId: string): Promise<User> {
    // Validation
    if (!dto.authUserId || dto.authUserId.trim().length === 0) {
      throw new Error('Auth user ID is required')
    }
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('User name is required')
    }
    if (!dto.email || dto.email.trim().length === 0) {
      throw new Error('Email is required')
    }

    // Check if user already exists
    const existingByAuth = await this.repository.findByAuthUserId(dto.authUserId)
    if (existingByAuth) {
      throw new Error('User with this auth ID already exists')
    }

    const existingByEmail = await this.repository.findByEmail(dto.email)
    if (existingByEmail) {
      throw new Error('User with this email already exists')
    }

    return this.repository.create({
      tenantId,
      authUserId: dto.authUserId,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone,
      role: dto.role,
      avatarUrl: dto.avatarUrl,
      isActive: true,
    })
  }
}

