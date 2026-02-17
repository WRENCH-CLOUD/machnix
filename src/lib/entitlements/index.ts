/**
 * Entitlements Module
 * 
 * Re-exports for convenience.
 */

export { EntitlementService } from './entitlement.service'
export { checkEntitlementGuard } from './check-entitlement'
export type {
  SubscriptionOverride,
  CreateOverrideInput,
  SubscriptionInvoice,
  CreateSubscriptionInvoiceInput,
  UsageSnapshot,
  EntitlementCheckResult,
  SubscriptionState,
  UpgradeProrationResult,
  UpdateSubscriptionInput,
} from './types'
export type { GuardResult as EntitlementGuardResult } from './check-entitlement'

