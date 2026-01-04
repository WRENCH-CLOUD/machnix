import { InvoiceRepository } from '../domain/invoice.repository'
import { InvoiceWithRelations } from '../domain/invoice.entity'

export class GetInvoiceByJobIdUseCase {
  constructor(private readonly repository: InvoiceRepository) {}

  async execute(jobId: string): Promise<InvoiceWithRelations | null> {
    const invoices = await this.repository.findByJobcardId(jobId)
    console.log('[DEBUG] UseCase - Invoices found in repo:', invoices.length);
    
    if (invoices.length === 0) return null;
    
    const targetId = invoices[0].id;
    console.log('[DEBUG] UseCase - Fetching full details for ID:', targetId);
    
    const detailedInvoice = await this.repository.findById(targetId);
    console.log('[DEBUG] UseCase - Detailed result:', detailedInvoice ? 'Found' : 'NULL');
    
    return detailedInvoice;
  }
}
