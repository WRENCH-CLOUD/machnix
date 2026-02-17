/**
 * Update Subscription Use Case
 * 
 * Handles subscription tier changes, date updates, and pricing adjustments.
 * Uses the billing provider interface for invoice generation (plug-and-play).
 */

import { TenantRepository } from '../infrastructure/tenant.repository'
import { EntitlementService } from '@/lib/entitlements/entitlement.service'
import { getPaymentProvider, getNotificationProvider } from '@/lib/billing'
import { normalizeTier, TIER_PRICING, GRACE_PERIOD_DAYS } from '@/config/plan-features'
import type { UpdateSubscriptionInput } from '@/lib/entitlements/types'
import type { SubscriptionTier } from '@/config/plan-features'
import type { SupabaseClient } from '@supabase/supabase-js'

interface UpdateSubscriptionParams {
  tenantId: string
  updates: UpdateSubscriptionInput
  adminEmail?: string
}

interface UpdateSubscriptionResult {
  success: boolean
  tenant: any
  invoice?: any
  proration?: any
  error?: string
}

export class UpdateSubscriptionUseCase {
  constructor(
    private readonly repo: TenantRepository,
    private readonly supabase: SupabaseClient
  ) {}

  async execute(params: UpdateSubscriptionParams): Promise<UpdateSubscriptionResult> {
    const { tenantId, updates, adminEmail } = params

    // 1. Get current tenant
    const tenant = await this.repo.findById(tenantId)
    if (!tenant) {
      return { success: false, tenant: null, error: 'Tenant not found' }
    }

    const currentTier = normalizeTier(tenant.subscription)
    const targetTier = updates.tier ? normalizeTier(updates.tier) : currentTier

    // 2. Handle tier upgrade — calculate proration
    let proration = null
    let invoice = null

    if (updates.tier && targetTier !== currentTier) {
      const entitlementService = new EntitlementService(this.supabase)
      const isUpgrade = this.tierRank(targetTier) > this.tierRank(currentTier)

      if (isUpgrade && tenant.subscriptionEndAt) {
        // Calculate days remaining in current cycle
        const now = new Date()
        const endAt = new Date(tenant.subscriptionEndAt)
        const startAt = tenant.subscriptionStartAt ? new Date(tenant.subscriptionStartAt) : now
        const totalDays = Math.max(1, Math.ceil((endAt.getTime() - startAt.getTime()) / (1000*60*60*24)))
        const daysRemaining = Math.max(0, Math.ceil((endAt.getTime() - now.getTime()) / (1000*60*60*24)))

        proration = entitlementService.calculateUpgradeProration(
          currentTier,
          targetTier,
          daysRemaining,
          totalDays
        )

        // Create an invoice via the payment provider
        const paymentProvider = getPaymentProvider()
        const orderResult = await paymentProvider.createOrder(
          tenantId,
          proration.proratedAmount,
          `Upgrade from ${currentTier} to ${targetTier} (prorated ${daysRemaining} days)`,
          { proration, adminEmail }
        )

        // Create invoice record
        invoice = await this.repo.createSubscriptionInvoice(tenantId, {
          invoiceType: 'upgrade',
          description: `Upgrade: ${currentTier} → ${targetTier} (${daysRemaining} days remaining, ${proration.discountPercent}% loyalty discount)`,
          amount: proration.priceDifference,
          discountAmount: proration.discountAmount,
          totalAmount: proration.proratedAmount,
          paymentMethod: paymentProvider.getProviderName(),
          metadata: { proration, orderId: orderResult.orderId },
        })
      }

      // Notify about upgrade
      const notificationProvider = getNotificationProvider()
      await notificationProvider.sendUpgradeConfirmation(
        tenantId,
        currentTier,
        targetTier,
        proration?.proratedAmount || TIER_PRICING[targetTier].monthly
      )
    }

    // 3. Auto-set grace period if end date is provided
    if (updates.endAt && !updates.gracePeriodEndsAt) {
      const endDate = new Date(updates.endAt)
      const graceDate = new Date(endDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
      updates.gracePeriodEndsAt = graceDate.toISOString()
    }

    // 4. Apply updates
    const updatedTenant = await this.repo.updateSubscription(tenantId, updates)

    return {
      success: true,
      tenant: updatedTenant,
      invoice,
      proration,
    }
  }

  private tierRank(tier: SubscriptionTier): number {
    const ranks: Record<SubscriptionTier, number> = {
      basic: 1,
      pro: 2,
      enterprise: 3,
    }
    return ranks[tier] || 0
  }
}
