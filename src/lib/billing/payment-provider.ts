/**
 * Payment Provider Interface
 * 
 * Abstract interface for payment operations. All use cases call this interface,
 * never a concrete implementation. Swap providers by changing the factory function
 * in src/lib/billing/index.ts.
 * 
 * Current: ManualPaymentProvider (offline/admin-managed)
 * Future:  RazorpayPaymentProvider (automated online payments)
 */

export interface PaymentOrderResult {
  orderId: string
  status: 'created' | 'error'
  providerOrderId?: string  // e.g., Razorpay order_id
  checkoutUrl?: string      // e.g., Razorpay payment page URL
  error?: string
}

export interface PaymentVerificationResult {
  verified: boolean
  paymentId?: string
  error?: string
}

export interface RefundResult {
  refundId: string
  status: 'processed' | 'pending' | 'error'
  error?: string
}

export interface InvoiceItem {
  description: string
  amount: number         // In INR (not paise)
  quantity: number
  discount?: number
}

export interface PaymentProvider {
  /** Create a payment order/request */
  createOrder(
    tenantId: string,
    amount: number,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentOrderResult>

  /** Verify a completed payment */
  verifyPayment(
    orderId: string,
    paymentId: string,
    signature?: string
  ): Promise<PaymentVerificationResult>

  /** Issue a refund */
  createRefund(
    paymentId: string,
    amount: number,
    reason?: string
  ): Promise<RefundResult>

  /** Get the provider name for logging/display */
  getProviderName(): string
}
