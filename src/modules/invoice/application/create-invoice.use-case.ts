import { InvoiceRepository } from '../domain/invoice.repository'
import { Invoice } from '../domain/invoice.entity'

export interface CreateInvoiceDTO {
  customerId: string
  jobcardId?: string
  estimateId?: string
  subtotal: number
  taxAmount?: number
  discountAmount?: number
  invoiceDate?: Date
  dueDate?: Date
  metadata?: Record<string, any>
}

/**
 * Create Invoice Use Case
 * Creates a new invoice in the system
 */
export class CreateInvoiceUseCase {
  constructor(private readonly repository: InvoiceRepository) {}

  async execute(dto: CreateInvoiceDTO, tenantId: string): Promise<Invoice> {
    // Validation
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required')
    }
    if (dto.subtotal < 0) {
      throw new Error('Subtotal cannot be negative')
    }

    // Generate invoice number (format: INV-YYYYMMDD-XXXX)
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const invoiceNumber = `INV-${dateStr}-${randomNum}`

    // Calculate totals
    const taxAmount = dto.taxAmount || 0
    const discountAmount = dto.discountAmount || 0
    const totalAmount = dto.subtotal + taxAmount - discountAmount

    return this.repository.create({
      tenantId,
      invoiceNumber,
      customerId: dto.customerId,
      jobcardId: dto.jobcardId,
      estimateId: dto.estimateId,
      status: 'pending',
      subtotal: dto.subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      invoiceDate: dto.invoiceDate || new Date(),
      dueDate: dto.dueDate,
      metadata: dto.metadata || {},
    })
  }
}

