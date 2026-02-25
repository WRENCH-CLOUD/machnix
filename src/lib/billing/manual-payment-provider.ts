/**
 * Manual Payment Provider
 * 
 * Default stub implementation. Records payments as manual/offline transactions
 * in the subscription_invoices table. Admins mark them as paid via the UI.
 * 
 * When Razorpay is ready, create RazorpayPaymentProvider implementing
 * the same PaymentProvider interface, then swap in src/lib/billing/index.ts.
 */

import type {
  PaymentProvider,
  PaymentOrderResult,
  PaymentVerificationResult,
  RefundResult,
} from './payment-provider'

export class ManualPaymentProvider implements PaymentProvider {
  async createOrder(
    tenantId: string,
    amount: number,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentOrderResult> {
    // Generate a manual order reference
    const orderId = `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    console.log(
      `[ManualPayment] Order created: ${orderId} | Tenant: ${tenantId} | ₹${amount} | ${description}`
    )

    return {
      orderId,
      status: 'created',
      // No checkout URL for manual payments — admin collects offline
    }
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    _signature?: string
  ): Promise<PaymentVerificationResult> {
    // Manual payments are verified by admin marking them as "paid" in the UI
    // This always returns true since the admin is the verification authority
    console.log(
      `[ManualPayment] Payment verified manually: Order ${orderId}, Payment ${paymentId}`
    )

    return {
      verified: true,
      paymentId,
    }
  }

  async createRefund(
    paymentId: string,
    amount: number,
    reason?: string
  ): Promise<RefundResult> {
    const refundId = `REFUND-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    console.log(
      `[ManualPayment] Refund recorded: ${refundId} | Payment: ${paymentId} | ₹${amount} | Reason: ${reason || 'N/A'}`
    )

    return {
      refundId,
      status: 'processed',
    }
  }

  getProviderName(): string {
    return 'manual'
  }
}
