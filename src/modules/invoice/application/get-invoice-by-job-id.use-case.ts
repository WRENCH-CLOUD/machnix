import { InvoiceRepository } from '../domain/invoice.repository'
import { InvoiceWithRelations } from '../domain/invoice.entity'

export class GetInvoiceByJobIdUseCase {
  constructor(private readonly repository: InvoiceRepository) {}

  async execute(jobId: string): Promise<InvoiceWithRelations | null> {
    const invoices = await this.repository.findByJobcardId(jobId)
    
    if (invoices.length === 0) return null;
    
    const targetId = invoices[0].id;
    const detailedInvoice = await this.repository.findById(targetId);
    
    return detailedInvoice;
  }
}
