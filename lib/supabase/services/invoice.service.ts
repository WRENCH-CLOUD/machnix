import { supabase, ensureTenantContext } from '../client'
import type { Database } from '../types'

type Invoice = Database['tenant']['Tables']['invoices']['Row']
type InvoiceInsert = Database['tenant']['Tables']['invoices']['Insert']
type InvoiceUpdate = Database['tenant']['Tables']['invoices']['Update']
type InvoiceItem = Database['tenant']['Tables']['invoice_items']['Row']
type InvoiceItemInsert = Database['tenant']['Tables']['invoice_items']['Insert']
type InvoiceItemUpdate = Database['tenant']['Tables']['invoice_items']['Update']
type Payment = Database['tenant']['Tables']['payments']['Row']
type PaymentInsert = Database['tenant']['Tables']['payments']['Insert']
type Customer = Database['tenant']['Tables']['customers']['Row']
type Jobcard = Database['tenant']['Tables']['jobcards']['Row']

export interface InvoiceWithRelations extends Invoice {
  customer?: Customer
  jobcard?: Jobcard
  payments?: Payment[]
  invoice_items?: InvoiceItem[]
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
        payments:payments(*),
        invoice_items:invoice_items(*)
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
        payments:payments(*),
        invoice_items:invoice_items(*)
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
        payments:payments(*),
        invoice_items:invoice_items(*)
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
        payments:payments(*),
        invoice_items:invoice_items(*)
      `)
      .eq('jobcard_id', jobcardId)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    
    console.log('[getInvoiceByJobId] Query result:', { data, error })
    
    if (error) {
      console.error('[getInvoiceByJobId] Error:', error)
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
    
    // Copy estimate items to invoice items
    if (estimate.estimate_items && estimate.estimate_items.length > 0) {
      const invoiceItems = estimate.estimate_items.map((item: any) => ({
        invoice_id: invoice.id,
        item_name: item.custom_name,
        item_number: item.custom_part_number,
        description: item.description,
        qty: item.qty,
        unit_price: item.unit_price,
        labor_cost: item.labor_cost || 0,
      }))
      
      await supabase
        .schema('tenant')
        .from('invoice_items')
        .insert(invoiceItems)
    }
    
    // Fetch and return complete invoice with relations
    return this.getInvoiceById(invoice.id)
  }

  /**
   * Add a line item to an invoice
   */
  static async addInvoiceItem(
    invoiceId: string,
    item: {
      item_name: string
      item_number?: string
      description?: string
      qty: number
      unit_price: number
      labor_cost?: number
    }
  ): Promise<InvoiceItem> {
    const { data, error } = await supabase
      .schema('tenant')
      .from('invoice_items')
      .insert({
        invoice_id: invoiceId,
        item_name: item.item_name,
        item_number: item.item_number || null,
        description: item.description || null,
        qty: item.qty,
        unit_price: item.unit_price,
        labor_cost: item.labor_cost || 0,
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Recalculate invoice totals
    await this.recalculateInvoiceTotals(invoiceId)
    
    return data
  }

  /**
   * Update an invoice line item
   */
  static async updateInvoiceItem(
    itemId: string,
    updates: {
      item_name?: string
      item_number?: string
      description?: string
      qty?: number
      unit_price?: number
      labor_cost?: number
    }
  ): Promise<InvoiceItem> {
    const { data: item, error: fetchError } = await supabase
      .schema('tenant')
      .from('invoice_items')
      .select('invoice_id')
      .eq('id', itemId)
      .single()
    
    if (fetchError) throw fetchError
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('invoice_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()
    
    if (error) throw error
    
    // Recalculate invoice totals
    await this.recalculateInvoiceTotals(item.invoice_id)
    
    return data
  }

  /**
   * Delete an invoice line item
   */
  static async deleteInvoiceItem(itemId: string): Promise<void> {
    const { data: item, error: fetchError } = await supabase
      .schema('tenant')
      .from('invoice_items')
      .select('invoice_id')
      .eq('id', itemId)
      .single()
    
    if (fetchError) throw fetchError
    
    const { error } = await supabase
      .schema('tenant')
      .from('invoice_items')
      .delete()
      .eq('id', itemId)
    
    if (error) throw error
    
    // Recalculate invoice totals
    await this.recalculateInvoiceTotals(item.invoice_id)
  }

  /**
   * Recalculate invoice totals from line items
   */
  static async recalculateInvoiceTotals(invoiceId: string): Promise<void> {
    const { data: items } = await supabase
      .schema('tenant')
      .from('invoice_items')
      .select('qty, unit_price, labor_cost')
      .eq('invoice_id', invoiceId)
    
    if (!items) return
    
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.qty * item.unit_price) + (item.labor_cost || 0)
    }, 0)
    
    const tax_amount = subtotal * 0.18 // 18% GST
    const total_amount = subtotal + tax_amount
    
    await supabase
      .schema('tenant')
      .from('invoices')
      .update({
        subtotal,
        tax_amount,
        total_amount,
      })
      .eq('id', invoiceId)
  }
}
