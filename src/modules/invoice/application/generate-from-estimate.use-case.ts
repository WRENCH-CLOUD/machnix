import { InvoiceRepository } from '../domain/invoice.repository'
import { EstimateRepository } from '@/modules/estimate/domain/estimate.repository'
import { Invoice } from '../domain/invoice.entity'
import { generateFormattedId } from '@/shared/utils/generators'

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

  private readonly GST_RATE = 0.18

  async execute(options: GenerateInvoiceOptions | string, tenantId: string): Promise<Invoice> {
    const { estimateId, isGstBilled, discountPercentage } = this.parseOptions(options)

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
    const taxAmount = isGstBilled ? taxableAmount * this.GST_RATE : 0
    const totalAmount = taxableAmount + taxAmount

    if (existingInvoice) {
      // Update existing invoice with new GST/discount settings
      // Recalculate balance based on current totals and existing paid amount
      const balance = totalAmount - existingInvoice.paidAmount
      const status = balance <= 0 ? 'paid' : existingInvoice.status

      return this.invoiceRepo.update(existingInvoice.id, {
        subtotal,
        taxAmount,
        discountAmount,
        discountPercentage,
        isGstBilled,
        totalAmount,
        balance,
        status,
      })
    }

    // Create new invoice
    const invoiceNumber = generateFormattedId('INV')
    const invoiceDate = new Date()
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + 7) // 7 days due date

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

  private parseOptions(options: GenerateInvoiceOptions | string): { estimateId: string, isGstBilled: boolean, discountPercentage: number } {
    if (typeof options === 'string') {
      return { estimateId: options, isGstBilled: true, discountPercentage: 0 }
    }
    return {
      estimateId: options.estimateId,
      isGstBilled: options.isGstBilled ?? true,
      discountPercentage: options.discountPercentage ?? 0
    }
  }
}
