import { CustomerRepository } from '../domain/customer.repository'
import { Customer } from '../domain/customer.entity'

export interface UpdateCustomerDTO {
  name?: string
  phone?: string
  email?: string
  address?: string
}

/**
 * Update Customer Use Case
 * Updates an existing customer's information
 */
export class UpdateCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) { }

  async execute(id: string, dto: UpdateCustomerDTO): Promise<Customer> {
    // Validation - only check if name is explicitly set to empty
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new Error('Customer name cannot be empty')
    }

    // Check if customer exists
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error('Customer not found')
    }

    return this.repository.update(id, {
      ...dto,
      name: dto.name ? dto.name.trim() : undefined,
    })
  }
}

