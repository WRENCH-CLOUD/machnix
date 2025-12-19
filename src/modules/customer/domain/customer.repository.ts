import { Customer, CustomerWithVehicles } from './customer.entity'

/**
 * Customer Repository Interface
 * Defines the contract for customer data operations
 */
export interface CustomerRepository {
  /**
   * Find all customers for the current tenant
   */
  findAll(): Promise<CustomerWithVehicles[]>

  /**
   * Find a customer by ID
   */
  findById(id: string): Promise<CustomerWithVehicles | null>

  /**
   * Search customers by query (name, phone, email)
   */
  search(query: string): Promise<Customer[]>

  /**
   * Search customer by phone number
   */
  searchByPhone(phone: string): Promise<Customer | null>

  /**
   * Create a new customer
   */
  create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>

  /**
   * Update an existing customer
   */
  update(id: string, customer: Partial<Customer>): Promise<Customer>

  /**
   * Delete a customer (soft delete)
   */
  delete(id: string): Promise<void>
}

