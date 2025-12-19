import { InvoiceRepository } from '../domain/invoice.repository'
import { InvoiceWithRelations } from '../domain/invoice.entity'

/**
 * Get All Invoices Use Case
 * Retrieves all invoices for the current tenant
 */
export class GetAllInvoicesUseCase {
  constructor(private readonly repository: InvoiceRepository) {}

  async execute(): Promise<InvoiceWithRelations[]> {
    return this.repository.findAll()
  }
}

