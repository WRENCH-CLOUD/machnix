import { Invoice, InvoiceWithRelations, InvoiceStatus, PaymentTransaction } from './invoice.entity'

export interface InvoiceRepository {
  findAll(): Promise<InvoiceWithRelations[]>
  findByStatus(status: InvoiceStatus): Promise<InvoiceWithRelations[]>
  findById(id: string): Promise<InvoiceWithRelations | null>
  findByCustomerId(customerId: string): Promise<Invoice[]>
  findByJobcardId(jobcardId: string): Promise<Invoice[]>
  create(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice>
  update(id: string, updates: Partial<Invoice>): Promise<Invoice>
  updateStatus(id: string, status: InvoiceStatus): Promise<Invoice>
  recordPayment(invoiceId: string, payment: Omit<PaymentTransaction, 'id' | 'createdAt'>): Promise<Invoice>
  delete(id: string): Promise<void>
}
