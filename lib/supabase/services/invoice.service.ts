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
    
    if (error) {
      console.error('Error fetching invoices:', error)
      throw error
    }
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
    
    if (error) {
      console.error('Error fetching invoice by ID:', error)
      throw error
    }
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

  /**
   * Get invoice by jobcard ID
   */
  static async getInvoiceByJobId(jobcardId: string): Promise<InvoiceWithRelations | null> {
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
      .eq('jobcard_id', jobcardId)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    
    // Only throw on actual errors, not on "no rows" (PGRST116)
    if (error && error.code !== 'PGRST116') {
      console.error('[getInvoiceByJobId] Unexpected error:', error)
      throw error
    }
    
    return data as InvoiceWithRelations | null
  }

  /**
   * Create an invoice from a jobcard
   * Calculates totals from parts and labor
   */
  static async createInvoiceFromJob(jobcardId: string): Promise<Invoice> {
    const tenantId = ensureTenantContext()
    
    // First check if invoice already exists
    const existingInvoice = await this.getInvoiceByJobId(jobcardId)
    if (existingInvoice) {
      return existingInvoice
    }
    
    // Get jobcard with parts
    const { data: jobcard, error: jobError } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select(`
        *,
        part_usages:part_usages(*)
      `)
      .eq('id', jobcardId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (jobError) throw jobError
    
    // Calculate subtotal from parts
    const partsSubtotal = (jobcard.part_usages || []).reduce((sum: number, part: any) => {
      return sum + (part.unit_price * part.quantity)
    }, 0)
    
    // Add labor charges
    const laborCharges = jobcard.labor_charges || 0
    const subtotal = partsSubtotal + laborCharges
    
    // Calculate tax (18% GST)
    const taxAmount = subtotal * 0.18
    const totalAmount = subtotal + taxAmount
    
    // Create invoice
    const { data, error } = await supabase
      .schema('tenant')
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        jobcard_id: jobcardId,
        customer_id: jobcard.customer_id,
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        paid_amount: 0,
        status: 'pending',
        notes: `Invoice for job ${jobcard.job_number || jobcardId}`,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Generate invoice from estimate when job status changes to 'ready'
   * Copies all estimate items to invoice items
   */
  static async generateInvoiceFromEstimate(jobcardId: string, estimateId: string): Promise<InvoiceWithRelations> {
    const tenantId = ensureTenantContext()
    
    console.log('[generateInvoiceFromEstimate] Starting with:', { jobcardId, estimateId, tenantId })
    
    // Check if invoice already exists
    const existingInvoice = await this.getInvoiceByJobId(jobcardId)
    if (existingInvoice) {
      console.log('[generateInvoiceFromEstimate] Invoice already exists, returning existing')
      return existingInvoice
    }
    
    // Get estimate with items
    const { data: estimate, error: estimateError } = await supabase
      .schema('tenant')
      .from('estimates')
      .select(`
        *,
        estimate_items:estimate_items(*)
      `)
      .eq('id', estimateId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (estimateError) throw estimateError
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`
    
    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .schema('tenant')
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        jobcard_id: jobcardId,
        estimate_id: estimateId,
        customer_id: estimate.customer_id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        subtotal: estimate.parts_total + estimate.labor_total,
        tax_amount: estimate.tax_amount,
        total_amount: estimate.total_amount,
        paid_amount: 0,
        status: 'pending',
        notes: `Generated from estimate ${estimate.estimate_number}`,
      })
      .select()
      .single()
    
    if (invoiceError) throw invoiceError
    
    // Note: invoice_items table removed; line items remain in estimate_items
    // Invoice totals are calculated from estimate totals
    
    // Fetch and return complete invoice with relations
    return this.getInvoiceById(invoice.id)
  }

}
