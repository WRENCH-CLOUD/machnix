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
 * Result type for CreateCustomerUseCase
 */
export type CreateCustomerResult =
  | { success: true; customer: Customer }
  | { success: false; duplicatePhone: true; existingCustomer: Customer }

/**
 * Create Customer Use Case
 * Creates a new customer in the system
 */
export class CreateCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) { }

  async execute(dto: CreateCustomerDTO, tenantId: string): Promise<CreateCustomerResult> {
    // Validation
    if (!dto.name?.trim()) {
      throw new Error('Customer name is required')
    }

    // Check for duplicate phone if provided
    if (dto.phone) {
      const existing = await this.repository.searchByPhone(dto.phone)
      if (existing) {
        return {
          success: false,
          duplicatePhone: true,
          existingCustomer: existing,
        }
      }
    }

    const customer = await this.repository.create({
      ...dto,
      tenantId,
      name: dto.name.trim(),
    })

    return { success: true, customer }
  }
}

