import { InvoiceRepository } from '@/app/modules/invoice-management/domain/invoice.repository'
import { Invoice, InvoiceWithRelations, InvoiceStatus, PaymentTransaction } from '@/app/modules/invoice-management/domain/invoice.entity'
import { supabase, ensureTenantContext } from '@/lib/supabase/client'

/**
 * Supabase implementation of InvoiceRepository
 */
export class SupabaseInvoiceRepository implements InvoiceRepository {
  private toDomain(row: any): Invoice {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      customerId: row.customer_id,
      jobcardId: row.jobcard_id,
      estimateId: row.estimate_id,
      invoiceNumber: row.invoice_number,
      status: row.status as InvoiceStatus,
      subtotal: row.subtotal,
      taxAmount: row.tax_amount,
      discountAmount: row.discount_amount,
      totalAmount: row.total_amount,
      paidAmount: row.paid_amount,
      balance: row.balance,
      invoiceDate: new Date(row.invoice_date),
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      deletedBy: row.deleted_by,
    }
  }

  private toDomainWithRelations(row: any): InvoiceWithRelations {
    return {
      ...this.toDomain(row),
      customer: row.customer,
      jobcard: row.jobcard,
      estimate: row.estimate,
      payments: row.payments || [],
    }
  }

  private toDatabase(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      tenant_id: invoice.tenantId,
      customer_id: invoice.customerId,
      jobcard_id: invoice.jobcardId,
      estimate_id: invoice.estimateId,
      invoice_number: invoice.invoiceNumber,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax_amount: invoice.taxAmount,
      discount_amount: invoice.discountAmount,
      total_amount: invoice.totalAmount,
      paid_amount: invoice.paidAmount,
      balance: invoice.balance,
      invoice_date: invoice.invoiceDate.toISOString(),
      due_date: invoice.dueDate?.toISOString(),
      metadata: invoice.metadata,
    }
  }

  async findAll(): Promise<InvoiceWithRelations[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        jobcard:jobcards(*),
        estimate:estimates(*),
        payments:payment_transactions(*)
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomainWithRelations(row))
  }

  async findByStatus(status: InvoiceStatus): Promise<InvoiceWithRelations[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        jobcard:jobcards(*),
        estimate:estimates(*),
        payments:payment_transactions(*)
      `)
      .eq('tenant_id', tenantId)
      .eq('status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomainWithRelations(row))
  }

  async findById(id: string): Promise<InvoiceWithRelations | null> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        jobcard:jobcards(*),
        estimate:estimates(*),
        payments:payment_transactions(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data ? this.toDomainWithRelations(data) : null
  }

  async findByCustomerId(customerId: string): Promise<Invoice[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findByJobcardId(jobcardId: string): Promise<Invoice[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .select('*')
      .eq('jobcard_id', jobcardId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async create(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .insert(this.toDatabase(invoice))
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const tenantId = ensureTenantContext()

    const dbUpdates: any = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal
    if (updates.taxAmount !== undefined) dbUpdates.tax_amount = updates.taxAmount
    if (updates.discountAmount !== undefined) dbUpdates.discount_amount = updates.discountAmount
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount
    if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance
    if (updates.invoiceDate !== undefined) dbUpdates.invoice_date = updates.invoiceDate.toISOString()
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate?.toISOString()
    if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata

    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .update(dbUpdates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    return this.update(id, { status })
  }

  async recordPayment(invoiceId: string, payment: Omit<PaymentTransaction, 'id' | 'createdAt'>): Promise<Invoice> {
    // Get current invoice
    const invoice = await this.findById(invoiceId)
    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Create payment transaction
    const { error: paymentError } = await supabase
      .schema('tenant')
      .from('payment_transactions')
      .insert({
        tenant_id: payment.tenantId,
        invoice_id: payment.invoiceId,
        mode: payment.mode,
        amount: payment.amount,
        razorpay_order_id: payment.razorpayOrderId,
        razorpay_payment_id: payment.razorpayPaymentId,
        razorpay_signature: payment.razorpaySignature,
        status: payment.status,
        paid_at: payment.paidAt?.toISOString(),
      })

    if (paymentError) throw paymentError

    // Update invoice paid amount and balance
    const newPaidAmount = invoice.paidAmount + payment.amount
    const newBalance = invoice.totalAmount - newPaidAmount
    let newStatus: InvoiceStatus = invoice.status

    if (newBalance === 0) {
      newStatus = 'paid'
    } else if (newPaidAmount > 0 && newBalance > 0) {
      newStatus = 'partially_paid'
    }

    return this.update(invoiceId, {
      paidAmount: newPaidAmount,
      balance: newBalance,
      status: newStatus,
    })
  }

  async delete(id: string): Promise<void> {
    const tenantId = ensureTenantContext()

    const { error } = await supabase
      .schema('tenant')
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }
}
