/**
 * Billing Provider Factory
 * 
 * Single source for getting provider instances. All use cases and API routes
 * import from here — never from concrete implementations directly.
 * 
 * To swap providers (e.g., when Razorpay is ready):
 *   1. Create RazorpayPaymentProvider implementing PaymentProvider
 *   2. Change getPaymentProvider() to return new RazorpayPaymentProvider(...)
 *   3. Done — no other files need changes
 */

import type { PaymentProvider } from './payment-provider'
import type { NotificationProvider } from './notification-provider'
import { ManualPaymentProvider } from './manual-payment-provider'
import { ConsoleNotificationProvider } from './console-notification-provider'

// Re-export interfaces for convenience
export type { PaymentProvider } from './payment-provider'
export type { NotificationProvider } from './notification-provider'
export type {
  PaymentOrderResult,
  PaymentVerificationResult,
  RefundResult,
  InvoiceItem,
} from './payment-provider'
export type { NotificationResult } from './notification-provider'

/**
 * Get the active payment provider.
 * 
 * Current: ManualPaymentProvider (offline payments, admin-managed)
 * Future:  new RazorpayPaymentProvider(process.env.RAZORPAY_KEY_ID!, process.env.RAZORPAY_KEY_SECRET!)
 */
export function getPaymentProvider(): PaymentProvider {
  return new ManualPaymentProvider()
}

/**
 * Get the active notification provider.
 * 
 * Current: ConsoleNotificationProvider (console.log + DB records)
 * Future:  new GupshupNotificationProvider(tenantGupshupSettings)
 */
export function getNotificationProvider(): NotificationProvider {
  return new ConsoleNotificationProvider()
}
