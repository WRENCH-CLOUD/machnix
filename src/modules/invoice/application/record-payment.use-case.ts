import { InvoiceRepository } from '../domain/invoice.repository'
import { Invoice, PaymentTransaction, PaymentMode } from '../domain/invoice.entity'

export interface RecordPaymentDTO {
  amount: number
  mode: PaymentMode
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
}

/**
 * Record Payment Use Case
 * Records a payment transaction for an invoice
 */
export class RecordPaymentUseCase {
  constructor(private readonly repository: InvoiceRepository) {}

  async execute(invoiceId: string, dto: RecordPaymentDTO, tenantId: string): Promise<Invoice> {
    // Validation
    if (dto.amount <= 0) {
      throw new Error('Payment amount must be greater than zero')
    }

    // Check if invoice exists
    const invoice = await this.repository.findById(invoiceId)
    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      throw new Error('Invoice is already fully paid')
    }

    // Check if invoice is cancelled
    if (invoice.status === 'cancelled') {
      throw new Error('Cannot record payment for a cancelled invoice')
    }

    // Check if payment amount exceeds balance
    if (dto.amount > invoice.balance) {
      throw new Error('Payment amount exceeds invoice balance')
    }

    const payment: Omit<PaymentTransaction, 'id' | 'createdAt'> = {
      tenantId,
      invoiceId,
      mode: dto.mode,
      amount: dto.amount,
      razorpayOrderId: dto.razorpayOrderId,
      razorpayPaymentId: dto.razorpayPaymentId,
      razorpaySignature: dto.razorpaySignature,
      status: 'success',
      paidAt: new Date(),
    }

    return this.repository.recordPayment(invoiceId, payment)
  }
}

