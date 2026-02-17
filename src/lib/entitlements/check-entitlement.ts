/**
 * Entitlement API Guard
 * 
 * Reusable guard function for API routes that need to enforce usage limits.
 * Returns a structured 403 response when the limit is exceeded.
 * 
 * @example
 * ```ts
 * // In a job creation API route:
 * const guard = await checkEntitlementGuard(supabase, tenantId, tier, 'jobsPerMonth')
 * if (!guard.allowed) return guard.response
 * ```
 */

import { NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { type SubscriptionTier } from '@/config/plan-features'
import { type PlanLimits } from '@/config/plan-features'
import { EntitlementService } from './entitlement.service'
import type { EntitlementCheckResult } from './types'

export interface GuardResult {
  allowed: boolean
  entitlement: EntitlementCheckResult
  response?: NextResponse  // Only set when allowed === false
}

/**
 * Check if a tenant is allowed to perform an action based on their entitlements.
 * Returns a structured 403 if not allowed.
 */
export async function checkEntitlementGuard(
  supabase: SupabaseClient,
  tenantId: string,
  tier: SubscriptionTier,
  metric: keyof PlanLimits
): Promise<GuardResult> {
  const service = new EntitlementService(supabase)

  // Get current usage
  const usage = await service.getUsageSnapshot(tenantId)

  // Map metric to usage value
  const usageMap: Record<keyof PlanLimits, number> = {
    jobsPerMonth: usage.jobsThisMonth,
    whatsappMessages: usage.whatsappThisMonth,
    staffCount: usage.staffCount,
    inventory: usage.inventoryCount,
  }

  const currentUsage = usageMap[metric] ?? 0
  const entitlement = await service.checkEntitlement(tenantId, tier, metric, currentUsage)

  if (entitlement.allowed) {
    return { allowed: true, entitlement }
  }

  // Build structured 403 response
  const response = NextResponse.json(
    {
      error: 'Usage limit reached',
      code: 'ENTITLEMENT_EXCEEDED',
      details: {
        metric,
        current: entitlement.current,
        limit: entitlement.effectiveLimit,
        tierLimit: entitlement.tierLimit,
        overrideExtra: entitlement.overrideExtra,
        remaining: 0,
      },
      message: `You have reached your ${metric} limit (${entitlement.current}/${entitlement.effectiveLimit}). Please upgrade your plan or contact support for additional capacity.`,
    },
    { status: 403 }
  )

  return { allowed: false, entitlement, response }
}
