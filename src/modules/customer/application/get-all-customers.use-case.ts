import { CustomerRepository } from '../domain/customer.repository'
import { CustomerWithVehicles } from '../domain/customer.entity'

/**
 * Get All Customers Use Case
 * Retrieves all customers for the current tenant
 */
export class GetAllCustomersUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(): Promise<CustomerWithVehicles[]> {
    return this.repository.findAll()
  }
}

