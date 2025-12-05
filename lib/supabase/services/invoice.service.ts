import { supabase, ensureTenantContext } from '../client'
import type { Database } from '../types'

type Invoice = Database['tenant']['Tables']['invoices']['Row']
type InvoiceInsert = Database['tenant']['Tables']['invoices']['Insert']
type InvoiceUpdate = Database['tenant']['Tables']['invoices']['Update']
type Payment = Database['tenant']['Tables']['payments']['Row']
type PaymentInsert = Database['tenant']['Tables']['payments']['Insert']
type Customer = Database['tenant']['Tables']['customers']['Row']
type Jobcard = Database['tenant']['Tables']['jobcards']['Row']

export interface InvoiceWithRelations extends Invoice {
  customer?: Customer
  jobcard?: Jobcard
  payments?: Payment[]
}

export class InvoiceService {
  /**
   * Get all invoices for the current tenant
   */
  static async getInvoices(status?: string): Promise<InvoiceWithRelations[]> {
    const tenantId = ensureTenantContext()
    
    let query = supabase
      .schema('tenant')
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        jobcard:jobcards(*),
        payments:payments(*)
      `)
      .eq('tenant_id', tenantId)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data as InvoiceWithRelations[]
  }

  /**
   * Get a single invoice by ID
   */
  static async getInvoiceById(invoiceId: string): Promise<InvoiceWithRelations> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        jobcard:jobcards(*),
        payments:payments(*)
      `)
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) throw error
    return data as InvoiceWithRelations
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(
    invoice: Omit<InvoiceInsert, 'tenant_id' | 'id' | 'issued_at' | 'updated_at'>
  ): Promise<Invoice> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .insert({
        ...invoice,
        tenant_id: tenantId,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update an invoice
   */
  static async updateInvoice(invoiceId: string, updates: InvoiceUpdate): Promise<Invoice> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete an invoice
   */
  static async deleteInvoice(invoiceId: string): Promise<void> {
    const tenantId = ensureTenantContext()
    
    const { error } = await supabase
      .schema('tenant')
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
    
    if (error) throw error
  }

  /**
   * Add a payment to an invoice
   */
  static async addPayment(
    payment: Omit<PaymentInsert, 'tenant_id' | 'id'>
  ): Promise<Payment> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('payments')
      .insert({
        ...payment,
        tenant_id: tenantId,
      })
      .select()
      .single()
    
    if (error) throw error

    // Update invoice paid_amount and balance
    const invoice = await this.getInvoiceById(payment.invoice_id)
    const newPaidAmount = invoice.paid_amount + payment.amount
    const newBalance = invoice.total_amount - newPaidAmount
    
    await this.updateInvoice(payment.invoice_id, {
      paid_amount: newPaidAmount,
      balance: newBalance,
      status: newBalance === 0 ? 'paid' : newBalance < invoice.total_amount ? 'partial' : 'pending',
    })
    
    return data
  }

  /**
   * Get payments for an invoice
   */
  static async getInvoicePayments(invoiceId: string): Promise<Payment[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('tenant_id', tenantId)
      .order('payment_date', { ascending: false })
    
    if (error) throw error
    return data
  }

  /**
   * Get overdue invoices
   */
  static async getOverdueInvoices(): Promise<InvoiceWithRelations[]> {
    const tenantId = ensureTenantContext()
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        jobcard:jobcards(*),
        payments:payments(*)
      `)
      .eq('tenant_id', tenantId)
      .neq('status', 'paid')
      .lt('due_date', today)
      .order('due_date', { ascending: true })
    
    if (error) throw error
    return data as InvoiceWithRelations[]
  }
}
