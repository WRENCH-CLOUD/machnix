"use client"

import { useCallback, useMemo } from "react"
import { useAuth } from "@/providers/auth-provider"
import {
  type SubscriptionTier,
  type ModuleId,
  normalizeTier,
  isModuleAccessible,
  getRequiredTier,
  getUpgradeTierLabel,
  isLimitReached,
  getLimit,
  getLimitLabel,
  isTierAtLeast,
  getNextTier,
  TIER_LIMITS,
  PLAN_DISPLAY,
  TIER_MODULES,
  UPGRADE_CONTACT,
} from "@/config/plan-features"

/**
 * usePlan() - Frontend hook for subscription-based feature gating.
 * 
 * Reads the subscription tier from the auth session and provides
 * helper methods to check module access, usage limits, and upgrade prompts.
 * 
 * @example
 * ```tsx
 * const { tier, canAccess, isLocked, tierLabel } = usePlan()
 * 
 * if (isLocked('transactions')) {
 *   // Show upgrade modal
 * }
 * ```
 */
export function usePlan() {
  const { subscriptionTier } = useAuth()

  // The current tier - normalized from whatever the JWT holds
  const tier: SubscriptionTier = normalizeTier(subscriptionTier)

  /**
   * Check if current plan can access a specific module
   */
  const canAccess = useCallback(
    (moduleId: string): boolean => isModuleAccessible(tier, moduleId),
    [tier]
  )

  /**
   * Check if a module is locked (not accessible in current tier)
   */
  const isLocked = useCallback(
    (moduleId: string): boolean => !isModuleAccessible(tier, moduleId),
    [tier]
  )

  /**
   * Get the required tier to access a module
   */
  const requiredTierFor = useCallback(
    (moduleId: string): SubscriptionTier => getRequiredTier(moduleId),
    []
  )

  /**
   * Get the upgrade label for a locked module (e.g., "Pro")
   */
  const upgradeLabel = useCallback(
    (moduleId: string): string => getUpgradeTierLabel(moduleId),
    []
  )

  /**
   * Check if a usage limit has been reached
   */
  const checkLimit = useCallback(
    (metric: 'jobsPerMonth' | 'staffCount' | 'whatsappMessages', currentValue: number): boolean =>
      isLimitReached(tier, metric, currentValue),
    [tier]
  )

  /**
   * Get the numeric limit for a metric
   */
  const limitFor = useCallback(
    (metric: 'jobsPerMonth' | 'staffCount' | 'whatsappMessages'): number =>
      getLimit(tier, metric),
    [tier]
  )

  /**
   * Get a display-friendly limit label
   */
  const limitLabel = useCallback(
    (metric: 'jobsPerMonth' | 'staffCount' | 'whatsappMessages'): string =>
      getLimitLabel(tier, metric),
    [tier]
  )

  /**
   * Check if current tier meets the minimum requirement
   */
  const meetsMinimum = useCallback(
    (required: SubscriptionTier): boolean => isTierAtLeast(tier, required),
    [tier]
  )

  /**
   * The display name of the current tier (e.g., "Basic", "Pro", "Enterprise")
   */
  const tierLabel = useMemo(() => PLAN_DISPLAY[tier].displayName, [tier])

  /**
   * The next tier up (for upgrade prompts), null if already Enterprise
   */
  const nextTier = useMemo(() => getNextTier(tier), [tier])

  /**
   * Display name of the next tier (for upgrade CTA text)
   */
  const nextTierLabel = useMemo(
    () => (nextTier ? PLAN_DISPLAY[nextTier].displayName : null),
    [nextTier]
  )

  /**
   * The current plan's limits
   */
  const limits = useMemo(() => TIER_LIMITS[tier], [tier])

  /**
   * The current plan's display info
   */
  const planInfo = useMemo(() => PLAN_DISPLAY[tier], [tier])

  /**
   * The modules accessible in the current plan
   */
  const accessibleModules = useMemo(() => TIER_MODULES[tier], [tier])

  /**
   * Open "Contact Us" for upgrade. Since we don't have billing yet,
   * all upgrade actions redirect to email.
   */
  const contactUpgrade = useCallback(
    (targetTier?: SubscriptionTier) => {
      const target = targetTier || nextTier
      if (!target) return
      const link = UPGRADE_CONTACT.mailtoLink(tier, target)
      window.open(link, '_blank')
    },
    [tier, nextTier]
  )

  return {
    // Core
    tier,
    tierLabel,
    planInfo,
    limits,
    accessibleModules,

    // Module access
    canAccess,
    isLocked,
    requiredTierFor,
    upgradeLabel,

    // Usage limits
    checkLimit,
    limitFor,
    limitLabel,

    // Tier comparison
    meetsMinimum,
    nextTier,
    nextTierLabel,

    // Upgrade actions
    contactUpgrade,
  }
}
