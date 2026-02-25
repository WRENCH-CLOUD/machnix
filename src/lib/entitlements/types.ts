/**
 * Entitlement System Types
 *
 * Shared types for the subscription override ledger, usage snapshots, 
 * and entitlement check results.
 */

import type { SubscriptionTier, SubscriptionValidity, BillingPeriod } from '@/config/plan-features'

// ============================================================================
// SUBSCRIPTION OVERRIDE (Top-up / Manual Extension)
// ============================================================================

export interface SubscriptionOverride {
  id: string
  tenantId: string
  featureKey: string       // 'extra_jobs', 'extra_whatsapp', 'extend_expiry', or custom
  quantity: number
  validFrom: Date
  expiresAt: Date | null   // null = valid until billing cycle resets
  reason: string | null
  createdBy: string | null
  createdAt: Date
}

export interface CreateOverrideInput {
  featureKey: string
  quantity: number
  expiresAt?: string | null  // ISO date string
  reason?: string
  createdBy?: string
}

// ============================================================================
// SUBSCRIPTION INVOICE (Internal billing audit)
// ============================================================================

export interface SubscriptionInvoice {
  id: string
  tenantId: string
  invoiceType: 'subscription' | 'upgrade' | 'topup' | 'renewal'
  description: string | null
  amount: number
  discountAmount: number
  totalAmount: number
  status: 'pending' | 'paid' | 'cancelled'
  paymentMethod: string | null
  paymentReference: string | null
  metadata: Record<string, unknown>
  paidAt: Date | null
  createdAt: Date
}

export interface CreateSubscriptionInvoiceInput {
  invoiceType: 'subscription' | 'upgrade' | 'topup' | 'renewal'
  description: string
  amount: number
  discountAmount?: number
  totalAmount: number
  paymentMethod?: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// USAGE SNAPSHOT
// ============================================================================

export interface UsageSnapshot {
  jobsThisMonth: number
  whatsappThisMonth: number
  staffCount: number
  inventoryCount: number
}

// ============================================================================
// ENTITLEMENT CHECK RESULT
// ============================================================================

export interface EntitlementCheckResult {
  allowed: boolean
  metric: string
  current: number
  tierLimit: number
  overrideExtra: number
  effectiveLimit: number
  remaining: number
}

// ============================================================================
// SUBSCRIPTION STATE
// ============================================================================

export interface SubscriptionState {
  tier: SubscriptionTier
  status: string              // subscription_status from DB
  validity: SubscriptionValidity
  billingPeriod: BillingPeriod
  startAt: Date | null
  endAt: Date | null
  gracePeriodEndsAt: Date | null
  trialEndsAt: Date | null
  customPrice: number | null
  isActive: boolean
  isInGracePeriod: boolean
  isExpired: boolean
  daysUntilExpiry: number | null
}

// ============================================================================
// UPGRADE PRORATION
// ============================================================================

export interface UpgradeProrationResult {
  currentTier: SubscriptionTier
  targetTier: SubscriptionTier
  priceDifference: number
  discountPercent: number
  discountAmount: number
  proratedAmount: number
  daysRemaining: number
  totalDays: number
}

// ============================================================================
// SUBSCRIPTION UPDATE INPUT
// ============================================================================

export interface UpdateSubscriptionInput {
  tier?: SubscriptionTier
  startAt?: string           // ISO date
  endAt?: string             // ISO date
  gracePeriodEndsAt?: string // ISO date
  customPrice?: number | null
  billingPeriod?: BillingPeriod
  subscriptionStatus?: string
}
