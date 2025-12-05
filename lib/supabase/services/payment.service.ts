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
   * Get payment transactions for a payment
   */
  static async getPaymentTransactions(paymentId: string): Promise<PaymentTransaction[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('payment_transactions')
      .select('*')
      .eq('payment_id', paymentId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  /**
   * Initiate Razorpay payment
   */
  static async initiateRazorpayPayment(paymentId: string, razorpayOrderId: string): Promise<PaymentTransaction> {
    return this.addPaymentTransaction({
      payment_id: paymentId,
      gateway: 'razorpay',
      transaction_id: razorpayOrderId,
      status: 'pending',
    })
  }

  /**
   * Complete Razorpay payment
   */
  static async completeRazorpayPayment(
    transactionId: string,
    razorpayPaymentId: string,
    status: 'success' | 'failed',
    response?: any
  ): Promise<PaymentTransaction> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('payment_transactions')
      .update({
        status,
        razorpay_payment_id: razorpayPaymentId,
        gateway_response: response,
      })
      .eq('transaction_id', transactionId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
