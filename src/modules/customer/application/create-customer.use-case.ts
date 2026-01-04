import { CustomerRepository } from '../domain/customer.repository'
import { Customer } from '../domain/customer.entity'

export interface CreateCustomerDTO {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

/**
 * Create Customer Use Case
 * Creates a new customer in the system
 */
export class CreateCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(dto: CreateCustomerDTO, tenantId: string): Promise<Customer> {
    // Validation
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Customer name is required')
    }

    // Check for duplicate phone if provided
    if (dto.phone) {
      const existing = await this.repository.searchByPhone(dto.phone)
      if (existing) {
        throw new Error('Customer with this phone number already exists')
      }
    }

    return this.repository.create({
      ...dto,
      tenantId,
      name: dto.name.trim(),
    })
  }
}

