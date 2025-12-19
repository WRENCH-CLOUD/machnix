import { CustomerRepository } from '../domain/customer.repository'
import { CustomerWithVehicles } from '../domain/customer.entity'

/**
 * Get Customer By ID Use Case
 * Retrieves a specific customer by their ID
 */
export class GetCustomerByIdUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(id: string): Promise<CustomerWithVehicles | null> {
    return this.repository.findById(id)
  }
}

