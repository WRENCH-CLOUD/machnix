import { CustomerRepository } from '../domain/customer.repository'

/**
 * Delete Customer Use Case
 * Soft deletes a customer from the system
 */
export class DeleteCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(id: string): Promise<void> {
    // Check if customer exists
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error('Customer not found')
    }

    await this.repository.delete(id)
  }
}

