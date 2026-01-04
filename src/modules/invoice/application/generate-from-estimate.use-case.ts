import { InvoiceRepository } from '../domain/invoice.repository'
import { EstimateRepository } from '@/modules/estimate/domain/estimate.repository'
import { Invoice } from '../domain/invoice.entity'

export class GenerateInvoiceFromEstimateUseCase {
  constructor(
    private readonly invoiceRepo: InvoiceRepository,
    private readonly estimateRepo: EstimateRepository
  ) {}

  async execute(estimateId: string, tenantId: string): Promise<Invoice> {
    const estimate = await this.estimateRepo.findById(estimateId)
    if (!estimate) {
      throw new Error('Estimate not found')
    }

    const invoiceNumber = `INV-${Date.now()}`
    const invoiceDate = new Date()
    const dueDate = new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000)

    const invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId,
      customerId: estimate.customerId,
      jobcardId: estimate.jobcardId,
      estimateId: estimate.id,
      invoiceNumber,
      status: 'pending',
      subtotal: estimate.subtotal,
      taxAmount: estimate.taxAmount,
      discountAmount: estimate.discountAmount,
      totalAmount: estimate.totalAmount,
      paidAmount: 0,
      balance: estimate.totalAmount,
      invoiceDate,
      dueDate,
      metadata: { source: 'estimate', estimateNumber: estimate.estimateNumber },
      deletedAt: undefined,
      deletedBy: undefined,
    }

    return this.invoiceRepo.create(invoice)
  }
}
