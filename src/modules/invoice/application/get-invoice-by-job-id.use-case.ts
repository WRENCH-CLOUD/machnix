import { InvoiceRepository } from '../domain/invoice.repository'
import { InvoiceWithRelations } from '../domain/invoice.entity'

export class GetInvoiceByJobIdUseCase {
  constructor(private readonly repository: InvoiceRepository) {}

  async execute(jobId: string): Promise<InvoiceWithRelations | null> {
    const invoices = await this.repository.findByJobcardId(jobId)
    return invoices.length > 0
      ? await this.repository.findById(invoices[0].id)
      : null
  }
}
