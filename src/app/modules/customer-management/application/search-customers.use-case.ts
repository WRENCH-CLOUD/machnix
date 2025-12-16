import { CustomerRepository } from '../domain/customer.repository'
import { Customer } from '../domain/customer.entity'

/**
 * Search Customers Use Case
 * Searches for customers by name, phone, or email
 */
export class SearchCustomersUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(query: string): Promise<Customer[]> {
    if (!query || query.trim().length === 0) {
      return []
    }
    return this.repository.search(query.trim())
  }
}

