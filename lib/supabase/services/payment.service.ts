import { supabase, ensureTenantContext } from '../client'
import type { Database } from '../types'

type Payment = Database['tenant']['Tables']['payments']['Row']
type PaymentInsert = Database['tenant']['Tables']['payments']['Insert']
type PaymentUpdate = Database['tenant']['Tables']['payments']['Update']
type PaymentTransaction = Database['tenant']['Tables']['payment_transactions']['Row']
type PaymentTransactionInsert = Database['tenant']['Tables']['payment_transactions']['Insert']
type Invoice = Database['tenant']['Tables']['invoices']['Row']

export interface PaymentWithRelations extends Payment {
  invoice?: Invoice
  payment_transactions?: PaymentTransaction[]
}

export class PaymentService {
  /**
   * Get all payments for the current tenant
   */
  static async getPayments(): Promise<PaymentWithRelations[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('payments')
      .select(`
        *,
        invoice:invoices(*),
        payment_transactions:payment_transactions(*)
      `)
      .eq('tenant_id', tenantId)
      .order('payment_date', { ascending: false })
    
    if (error) throw error
    return data as PaymentWithRelations[]
  }

  /**
   * Get a single payment by ID
   */
  static async getPaymentById(paymentId: string): Promise<PaymentWithRelations> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('payments')
      .select(`
        *,
        invoice:invoices(*),
        payment_transactions:payment_transactions(*)
      `)
      .eq('id', paymentId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) throw error
    return data as PaymentWithRelations
  }

  /**
   * Create a new payment
   */
  static async createPayment(
    payment: Omit<PaymentInsert, 'tenant_id' | 'id' | 'created_at'>
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
    return data
  }

  /**
   * Update a payment
   */
  static async updatePayment(paymentId: string, updates: PaymentUpdate): Promise<Payment> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete a payment
   */
  static async deletePayment(paymentId: string): Promise<void> {
    const tenantId = ensureTenantContext()
    
    const { error } = await supabase
      .schema('tenant')
      .from('payments')
      .delete()
      .eq('id', paymentId)
      .eq('tenant_id', tenantId)
    
    if (error) throw error
  }

  /**
   * Add a payment transaction (for Razorpay integration)
   */
  static async addPaymentTransaction(
    transaction: Omit<PaymentTransactionInsert, 'tenant_id' | 'id' | 'created_at'>
  ): Promise<PaymentTransaction> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('payment_transactions')
      .insert({
        ...transaction,
        tenant_id: tenantId,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Get payment transactions for an invoice
   */
  static async getPaymentTransactionsByInvoice(invoiceId: string): Promise<PaymentTransaction[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('payment_transactions')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  /**
   * Initiate Razorpay payment
   */
  static async initiateRazorpayPayment(invoiceId: string, amount: number, razorpayOrderId: string): Promise<PaymentTransaction> {
    return this.addPaymentTransaction({
      invoice_id: invoiceId,
      mode: 'razorpay',
      amount: amount,
      razorpay_order_id: razorpayOrderId,
      status: 'initiated',
    })
  }

  /**
   * Complete Razorpay payment
   */
  static async completeRazorpayPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    status: 'success' | 'failed'
  ): Promise<PaymentTransaction> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('payment_transactions')
      .update({
        status,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        paid_at: status === 'success' ? new Date().toISOString() : null,
      })
      .eq('razorpay_order_id', razorpayOrderId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Mark invoice as paid and complete the job in a single atomic operation
   */
  static async markPaidAndComplete(
    invoiceId: string,
    jobId: string,
    paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other',
    referenceId?: string
  ): Promise<{ payment: Payment; invoice: Invoice }> {
    const tenantId = ensureTenantContext()
    
    try {
      console.log('[markPaidAndComplete] Starting payment process:', { invoiceId, jobId, paymentMethod, referenceId })
      
      // Get invoice with estimate to get current totals
      const { data: invoice, error: invoiceError } = await supabase
        .schema('tenant')
        .from('invoices')
        .select(`
          *,
          estimate:estimate_id (
            parts_total,
            labor_total,
            tax_amount,
            total_amount
          )
        `)
        .eq('id', invoiceId)
        .eq('tenant_id', tenantId)
        .single()
      
      if (invoiceError) {
        console.error('[markPaidAndComplete] Invoice fetch error:', invoiceError)
        throw new Error(`Failed to fetch invoice: ${invoiceError.message || JSON.stringify(invoiceError)}`)
      }
      if (!invoice) {
        throw new Error('Invoice not found')
      }
      
      console.log('[markPaidAndComplete] Invoice found:', { 
        id: invoice.id, 
        total: invoice.total_amount,
        paid: invoice.paid_amount 
      })
      
      // Get current totals from estimate
      const estimate = invoice.estimate as any
      const currentTotal = estimate ? estimate.total_amount : invoice.total_amount
      const currentPaid = invoice.paid_amount || 0
      const amountDue = currentTotal - currentPaid
      
      console.log('[markPaidAndComplete] Calculated amounts:', {
        currentTotal,
        currentPaid,
        amountDue
      })
      
      // If estimate exists, sync invoice totals first
      if (estimate) {
        const currentSubtotal = estimate.parts_total + estimate.labor_total
        
        console.log('[markPaidAndComplete] Syncing invoice with estimate totals')
        const { error: syncError } = await supabase
          .schema('tenant')
          .from('invoices')
          .update({
            subtotal: currentSubtotal,
            tax_amount: estimate.tax_amount,
            total_amount: currentTotal,
          })
          .eq('id', invoiceId)
          .eq('tenant_id', tenantId)
        
        if (syncError) {
          console.error('[markPaidAndComplete] Invoice sync error:', syncError)
          throw new Error(`Failed to sync invoice: ${syncError.message || JSON.stringify(syncError)}`)
        }
        console.log('[markPaidAndComplete] Invoice synced successfully')
      }
      
      // Create payment record
      console.log('[markPaidAndComplete] Creating payment record for amount:', amountDue)
      const { data: payment, error: paymentError } = await supabase
        .schema('tenant')
        .from('payments')
        .insert({
          tenant_id: tenantId,
          invoice_id: invoiceId,
          amount: amountDue,
          payment_method: paymentMethod,
          reference_number: referenceId || null,
          payment_date: new Date().toISOString(),
          status: 'completed',
          paid_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      if (paymentError) {
        console.error('[markPaidAndComplete] Payment creation error:', paymentError)
        throw new Error(`Failed to create payment: ${paymentError.message || JSON.stringify(paymentError)}`)
      }
      
      console.log('[markPaidAndComplete] Payment created:', payment.id)
      
      // Update invoice to mark as paid
      console.log('[markPaidAndComplete] Updating invoice to paid status')
      const { data: updatedInvoice, error: updateInvoiceError } = await supabase
        .schema('tenant')
        .from('invoices')
        .update({
          paid_amount: currentTotal,
          status: 'paid',
        })
        .eq('id', invoiceId)
        .eq('tenant_id', tenantId)
        .select()
        .single()
      
      if (updateInvoiceError) {
        console.error('[markPaidAndComplete] Invoice update error:', updateInvoiceError)
        throw new Error(`Failed to update invoice: ${updateInvoiceError.message || JSON.stringify(updateInvoiceError)}`)
      }
      
      console.log('[markPaidAndComplete] Invoice updated to paid')
      
      // Update job status to completed
      console.log('[markPaidAndComplete] Updating job to completed status')
      const { error: jobUpdateError } = await supabase
        .schema('tenant')
        .from('jobcards')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('tenant_id', tenantId)
      
      if (jobUpdateError) {
        console.error('[markPaidAndComplete] Job update error:', jobUpdateError)
        throw new Error(`Failed to update job: ${jobUpdateError.message || JSON.stringify(jobUpdateError)}`)
      }
      
      console.log('[markPaidAndComplete] Job marked as completed successfully')
      
      return { payment, invoice: updatedInvoice }
    } catch (error) {
      console.error('[markPaidAndComplete] Unexpected error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred during payment processing')
    }
  }
}
