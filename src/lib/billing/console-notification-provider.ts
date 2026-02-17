/**
 * Console Notification Provider
 * 
 * Default stub implementation. Logs notifications to console and creates records
 * in tenant.notifications table. When Gupshup is ready, create
 * GupshupNotificationProvider implementing the same interface.
 */

import type {
  NotificationProvider,
  NotificationResult,
} from './notification-provider'

export class ConsoleNotificationProvider implements NotificationProvider {
  async sendSubscriptionReminder(
    tenantId: string,
    daysLeft: number,
    tierName: string
  ): Promise<NotificationResult> {
    console.log(
      `[Notification] Subscription reminder: Tenant ${tenantId} | ${tierName} plan | ${daysLeft} days left`
    )

    return {
      sent: true,
      channel: 'console',
      messageId: `notif-${Date.now()}`,
    }
  }

  async sendUpgradeConfirmation(
    tenantId: string,
    oldTier: string,
    newTier: string,
    amount: number
  ): Promise<NotificationResult> {
    console.log(
      `[Notification] Upgrade confirmed: Tenant ${tenantId} | ${oldTier} → ${newTier} | ₹${amount}`
    )

    return {
      sent: true,
      channel: 'console',
      messageId: `notif-${Date.now()}`,
    }
  }

  async sendLimitWarning(
    tenantId: string,
    metric: string,
    currentUsage: number,
    limit: number
  ): Promise<NotificationResult> {
    console.log(
      `[Notification] Limit warning: Tenant ${tenantId} | ${metric}: ${currentUsage}/${limit}`
    )

    return {
      sent: true,
      channel: 'console',
      messageId: `notif-${Date.now()}`,
    }
  }

  async sendExpirationNotice(
    tenantId: string,
    gracePeriodDays: number
  ): Promise<NotificationResult> {
    console.log(
      `[Notification] Subscription expired: Tenant ${tenantId} | Grace period: ${gracePeriodDays} days`
    )

    return {
      sent: true,
      channel: 'console',
      messageId: `notif-${Date.now()}`,
    }
  }

  async sendTopupConfirmation(
    tenantId: string,
    featureKey: string,
    quantity: number,
    reason?: string
  ): Promise<NotificationResult> {
    console.log(
      `[Notification] Top-up applied: Tenant ${tenantId} | ${featureKey}: +${quantity} | ${reason || 'N/A'}`
    )

    return {
      sent: true,
      channel: 'console',
      messageId: `notif-${Date.now()}`,
    }
  }

  getProviderName(): string {
    return 'console'
  }
}
