/**
 * Entitlement Service
 * 
 * Core business logic for subscription entitlement checking.
 * Combines tier limits (from config) with active overrides (from DB)
 * and current usage (from DB) to determine access.
 * 
 * Philosophy: State in DB, Rules in Code.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import {
  type SubscriptionTier,
  normalizeTier,
  TIER_LIMITS,
  TIER_PRICING,
  UPGRADE_DISCOUNT_PERCENT,
  GRACE_PERIOD_DAYS,
} from '@/config/plan-features'
import type {
  EntitlementCheckResult,
  UsageSnapshot,
  SubscriptionState,
  UpgradeProrationResult,
  SubscriptionOverride,
} from './types'
import type { PlanLimits } from '@/config/plan-features'

// ============================================================================
// FEATURE KEY → PLAN LIMIT METRIC MAPPING
// ============================================================================

const FEATURE_TO_METRIC: Record<string, keyof PlanLimits> = {
  'extra_jobs': 'jobsPerMonth',
  'extra_whatsapp': 'whatsappMessages',
  'extra_staff': 'staffCount',
  'extra_inventory': 'inventory',
}

// ============================================================================
// ENTITLEMENT SERVICE
// ============================================================================

export class EntitlementService {
  constructor(private readonly supabase: SupabaseClient) {}

  // --------------------------------------------------------------------------
  // OVERRIDE QUERIES
  // --------------------------------------------------------------------------

  /**
   * Get all active overrides for a tenant
   */
  async getActiveOverrides(tenantId: string): Promise<SubscriptionOverride[]> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('subscription_overrides')
      .select('*')
      .eq('tenant_id', tenantId)
      .lte('valid_from', new Date().toISOString())
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Entitlement] Failed to fetch overrides:', error)
      return []
    }

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      featureKey: row.feature_key,
      quantity: row.quantity,
      validFrom: new Date(row.valid_from),
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      reason: row.reason,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    }))
  }

  /**
   * Sum active override quantity for a specific feature key
   */
  async getOverrideTotal(tenantId: string, featureKey: string): Promise<number> {
    const overrides = await this.getActiveOverrides(tenantId)
    return overrides
      .filter(o => o.featureKey === featureKey)
      .reduce((sum, o) => sum + o.quantity, 0)
  }

  // --------------------------------------------------------------------------
  // USAGE QUERIES
  // --------------------------------------------------------------------------

  /**
   * Get current month's usage snapshot for a tenant
   */
  async getUsageSnapshot(tenantId: string): Promise<UsageSnapshot> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('admin_tenant_overview')
      .select('jobs_this_month, whatsapp_this_month, staff_count, vehicle_count')
      .eq('id', tenantId)
      .maybeSingle()

    if (error) {
      console.error('[Entitlement] Failed to fetch usage:', error)
      return { jobsThisMonth: 0, whatsappThisMonth: 0, staffCount: 0, inventoryCount: 0 }
    }

    // Also get inventory count
    const { count: inventoryCount } = await this.supabase
      .schema('tenant')
      .from('parts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    return {
      jobsThisMonth: data?.jobs_this_month || 0,
      whatsappThisMonth: data?.whatsapp_this_month || 0,
      staffCount: data?.staff_count || 0,
      inventoryCount: inventoryCount || 0,
    }
  }

  // --------------------------------------------------------------------------
  // ENTITLEMENT CHECKS
  // --------------------------------------------------------------------------

  /**
   * Calculate the effective limit for a metric:
   * Tier_Limit + Sum(Active_Overrides)
   */
  async getEffectiveLimit(
    tier: SubscriptionTier,
    tenantId: string,
    metric: keyof PlanLimits
  ): Promise<{ tierLimit: number; overrideExtra: number; effectiveLimit: number }> {
    const safeTier = normalizeTier(tier)
    const tierLimit = TIER_LIMITS[safeTier][metric]

    // Unlimited = no need to check overrides
    if (tierLimit === -1) {
      return { tierLimit: -1, overrideExtra: 0, effectiveLimit: -1 }
    }

    // Find the matching feature key for this metric
    const featureKey = Object.entries(FEATURE_TO_METRIC)
      .find(([, m]) => m === metric)?.[0]

    let overrideExtra = 0
    if (featureKey) {
      overrideExtra = await this.getOverrideTotal(tenantId, featureKey)
    }

    return {
      tierLimit,
      overrideExtra,
      effectiveLimit: tierLimit + overrideExtra,
    }
  }

  /**
   * Full entitlement check: Is the tenant allowed to use more of this metric?
   * 
   * Formula: allowed = (current < effectiveLimit) OR (tierLimit === -1)
   */
  async checkEntitlement(
    tenantId: string,
    tier: SubscriptionTier,
    metric: keyof PlanLimits,
    currentUsage: number
  ): Promise<EntitlementCheckResult> {
    const { tierLimit, overrideExtra, effectiveLimit } =
      await this.getEffectiveLimit(tier, tenantId, metric)

    // Unlimited
    if (effectiveLimit === -1) {
      return {
        allowed: true,
        metric,
        current: currentUsage,
        tierLimit: -1,
        overrideExtra: 0,
        effectiveLimit: -1,
        remaining: Infinity,
      }
    }

    // Feature not available at all (limit is 0 and no overrides)
    if (effectiveLimit === 0) {
      return {
        allowed: false,
        metric,
        current: currentUsage,
        tierLimit: 0,
        overrideExtra: 0,
        effectiveLimit: 0,
        remaining: 0,
      }
    }

    const remaining = Math.max(0, effectiveLimit - currentUsage)
    const allowed = currentUsage < effectiveLimit

    return {
      allowed,
      metric,
      current: currentUsage,
      tierLimit,
      overrideExtra,
      effectiveLimit,
      remaining,
    }
  }

  /**
   * Quick check for job creation entitlement
   */
  async canCreateJob(tenantId: string, tier: SubscriptionTier): Promise<EntitlementCheckResult> {
    const usage = await this.getUsageSnapshot(tenantId)
    return this.checkEntitlement(tenantId, tier, 'jobsPerMonth', usage.jobsThisMonth)
  }

  /**
   * Quick check for WhatsApp message entitlement
   */
  async canSendWhatsApp(tenantId: string, tier: SubscriptionTier): Promise<EntitlementCheckResult> {
    const usage = await this.getUsageSnapshot(tenantId)
    return this.checkEntitlement(tenantId, tier, 'whatsappMessages', usage.whatsappThisMonth)
  }

  // --------------------------------------------------------------------------
  // SUBSCRIPTION VALIDITY
  // --------------------------------------------------------------------------

  /**
   * Determine the subscription validity state for a tenant
   */
  getSubscriptionState(tenant: {
    subscription: string
    subscriptionStatus: string
    subscriptionStartAt?: Date | null
    subscriptionEndAt?: Date | null
    gracePeriodEndsAt?: Date | null
    trialEndsAt?: Date | null
    customPrice?: number | null
    billingPeriod?: string
  }): SubscriptionState {
    const now = new Date()
    const tier = normalizeTier(tenant.subscription)
    const endAt = tenant.subscriptionEndAt ? new Date(tenant.subscriptionEndAt) : null
    const graceEnds = tenant.gracePeriodEndsAt ? new Date(tenant.gracePeriodEndsAt) : null
    const trialEnds = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null

    // Determine validity
    let validity: SubscriptionState['validity'] = 'active'
    let isActive = true
    let isInGracePeriod = false
    let isExpired = false

    // Check trial
    if (tenant.subscriptionStatus === 'trial') {
      if (trialEnds && now > trialEnds) {
        validity = 'expired'
        isActive = false
        isExpired = true
      } else {
        validity = 'trial'
      }
    }
    // Check subscription end
    else if (endAt && now > endAt) {
      if (graceEnds && now <= graceEnds) {
        validity = 'grace_period'
        isInGracePeriod = true
      } else {
        validity = 'expired'
        isActive = false
        isExpired = true
      }
    }

    // Days until expiry
    let daysUntilExpiry: number | null = null
    if (endAt) {
      daysUntilExpiry = Math.max(0, Math.ceil((endAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }

    return {
      tier,
      status: tenant.subscriptionStatus,
      validity,
      billingPeriod: (tenant.billingPeriod || 'monthly') as SubscriptionState['billingPeriod'],
      startAt: tenant.subscriptionStartAt ? new Date(tenant.subscriptionStartAt) : null,
      endAt,
      gracePeriodEndsAt: graceEnds,
      trialEndsAt: trialEnds,
      customPrice: tenant.customPrice ?? null,
      isActive,
      isInGracePeriod,
      isExpired,
      daysUntilExpiry,
    }
  }

  // --------------------------------------------------------------------------
  // UPGRADE PRORATION
  // --------------------------------------------------------------------------

  /**
   * Calculate the prorated upgrade cost when moving from one tier to another.
   * 
   * Formula:
   *   priceDiff = targetPrice - currentPrice
   *   discount = priceDiff * UPGRADE_DISCOUNT_PERCENT / 100
   *   prorated = (priceDiff - discount) * (daysRemaining / totalDays)
   */
  calculateUpgradeProration(
    currentTier: SubscriptionTier,
    targetTier: SubscriptionTier,
    daysRemaining: number,
    totalDays: number = 30
  ): UpgradeProrationResult {
    const currentPrice = TIER_PRICING[normalizeTier(currentTier)].monthly
    const targetPrice = TIER_PRICING[normalizeTier(targetTier)].monthly

    const priceDifference = targetPrice - currentPrice
    const discountAmount = Math.round(priceDifference * UPGRADE_DISCOUNT_PERCENT / 100)
    const afterDiscount = priceDifference - discountAmount

    // Prorate for remaining days
    const proratedAmount = Math.round(afterDiscount * (daysRemaining / totalDays))

    return {
      currentTier: normalizeTier(currentTier),
      targetTier: normalizeTier(targetTier),
      priceDifference,
      discountPercent: UPGRADE_DISCOUNT_PERCENT,
      discountAmount,
      proratedAmount: Math.max(0, proratedAmount),
      daysRemaining,
      totalDays,
    }
  }
}
