/**
 * Notification Provider Interface
 * 
 * Abstract interface for subscription-related notifications.
 * All use cases call this interface, never a concrete implementation.
 * 
 * Current: ConsoleNotificationProvider (logs + DB record)
 * Future:  GupshupNotificationProvider (WhatsApp via Gupshup)
 */

export interface NotificationResult {
  sent: boolean
  messageId?: string
  channel: string
  error?: string
}

export interface NotificationProvider {
  /** Notify tenant about subscription renewal reminder */
  sendSubscriptionReminder(
    tenantId: string,
    daysLeft: number,
    tierName: string
  ): Promise<NotificationResult>

  /** Notify tenant about successful upgrade */
  sendUpgradeConfirmation(
    tenantId: string,
    oldTier: string,
    newTier: string,
    amount: number
  ): Promise<NotificationResult>

  /** Warn tenant about approaching usage limit */
  sendLimitWarning(
    tenantId: string,
    metric: string,
    currentUsage: number,
    limit: number
  ): Promise<NotificationResult>

  /** Notify tenant that their subscription has expired */
  sendExpirationNotice(
    tenantId: string,
    gracePeriodDays: number
  ): Promise<NotificationResult>

  /** Notify tenant about a top-up or override being applied */
  sendTopupConfirmation(
    tenantId: string,
    featureKey: string,
    quantity: number,
    reason?: string
  ): Promise<NotificationResult>

  /** Get the provider name for logging/display */
  getProviderName(): string
}
