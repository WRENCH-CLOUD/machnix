import { InvoiceRepository } from '../domain/invoice.repository'
import { EstimateRepository } from '@/modules/estimate/domain/estimate.repository'
import { Invoice } from '../domain/invoice.entity'

export interface GenerateInvoiceOptions {
  estimateId: string
  isGstBilled?: boolean
  discountPercentage?: number
}

export class GenerateInvoiceFromEstimateUseCase {
  constructor(
    private readonly invoiceRepo: InvoiceRepository,
    private readonly estimateRepo: EstimateRepository
  ) { }

  async execute(options: GenerateInvoiceOptions | string, tenantId: string): Promise<Invoice> {
    // Support both old string signature and new options object
    const estimateId = typeof options === 'string' ? options : options.estimateId
    const isGstBilled = typeof options === 'string' ? true : (options.isGstBilled ?? true)
    const discountPercentage = typeof options === 'string' ? 0 : (options.discountPercentage ?? 0)

    const estimate = await this.estimateRepo.findById(estimateId)
    if (!estimate) {
      throw new Error('Estimate not found')
    }

    // Check if an invoice already exists for this estimate
    const existingInvoices = estimate.jobcardId
      ? await this.invoiceRepo.findByJobcardId(estimate.jobcardId)
      : []
    const existingInvoice = existingInvoices.find(inv => inv.estimateId === estimateId)

    // Calculate amounts based on GST and discount settings
    const subtotal = estimate.subtotal
    const discountAmount = subtotal * (discountPercentage / 100)
    const taxableAmount = subtotal - discountAmount
    const taxAmount = isGstBilled ? taxableAmount * 0.18 : 0
    const totalAmount = taxableAmount + taxAmount

    if (existingInvoice) {
      // Update existing invoice with new GST/discount settings
      return this.invoiceRepo.update(existingInvoice.id, {
        subtotal,
        taxAmount,
        discountAmount,
        discountPercentage,
        isGstBilled,
        totalAmount,
        // Recalculate balance based on current totals and existing paid amount
        balance: totalAmount - existingInvoice.paidAmount,
        // Update status if needed
        status: totalAmount - existingInvoice.paidAmount <= 0 ? 'paid' : existingInvoice.status,
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
      subtotal,
      taxAmount,
      discountAmount,
      discountPercentage,
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      isGstBilled,
      invoiceDate,
      dueDate,
      metadata: { source: 'estimate', estimateNumber: estimate.estimateNumber },
      deletedAt: undefined,
      deletedBy: undefined,
    }

    return this.invoiceRepo.create(invoice)
  }
}
