import { Invoice, InvoiceWithRelations, InvoiceStatus, PaymentTransaction } from './invoice.entity'

/**
 * Invoice Repository Interface
 * Defines the contract for invoice data operations
 */
export interface InvoiceRepository {
  /**
   * Find all invoices for the current tenant
   */
  findAll(): Promise<InvoiceWithRelations[]>

  /**
   * Find invoices by status
   */
  findByStatus(status: InvoiceStatus): Promise<InvoiceWithRelations[]>

  /**
   * Find an invoice by ID
   */
  findById(id: string): Promise<InvoiceWithRelations | null>

  /**
   * Find invoices by customer ID
   */
  findByCustomerId(customerId: string): Promise<Invoice[]>

  /**
   * Find invoices by jobcard ID
   */
  findByJobcardId(jobcardId: string): Promise<Invoice[]>

  /**
   * Create a new invoice
   */
  create(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice>

  /**
   * Update an existing invoice
   */
  update(id: string, invoice: Partial<Invoice>): Promise<Invoice>

  /**
   * Update invoice status
   */
  updateStatus(id: string, status: InvoiceStatus): Promise<Invoice>

  /**
   * Record a payment for an invoice
   */
  recordPayment(invoiceId: string, payment: Omit<PaymentTransaction, 'id' | 'createdAt'>): Promise<Invoice>

  /**
   * Delete an invoice (soft delete)
   */
  delete(id: string): Promise<void>
}

