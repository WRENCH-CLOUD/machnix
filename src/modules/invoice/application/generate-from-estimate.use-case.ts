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

    // Check if an invoice already exists for this estimate
    const existingInvoices = estimate.jobcardId 
      ? await this.invoiceRepo.findByJobcardId(estimate.jobcardId)
      : []
    const existingInvoice = existingInvoices.find(inv => inv.estimateId === estimateId)

    if (existingInvoice) {
      // Update existing invoice with current estimate totals
      return this.invoiceRepo.update(existingInvoice.id, {
        subtotal: estimate.subtotal,
        taxAmount: estimate.taxAmount,
        discountAmount: estimate.discountAmount,
        totalAmount: estimate.totalAmount,
        // Recalculate balance based on current totals and existing paid amount
        balance: estimate.totalAmount - existingInvoice.paidAmount,
        // Update status if needed
        status: estimate.totalAmount - existingInvoice.paidAmount <= 0 ? 'paid' : existingInvoice.status,
      })
    }

    // Create new invoice
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
