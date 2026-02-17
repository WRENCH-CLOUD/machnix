/**
 * Plan Features Configuration
 * 
 * Central source of truth for tier-based feature access and usage limits.
 * This is used by both frontend (sidebar gating, modals) and backend (API guards).
 * 
 * Tiers: 'basic', 'pro', 'enterprise'
 * NOTE: The DB enum stores 'basic' — normalizeTier() handles the translation.
 */

export type SubscriptionTier = 'basic' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trial'

// ============================================================================
// TIER NORMALIZATION
// ============================================================================

/**
 * Safely normalize any tier value to a valid SubscriptionTier.
 * Handles: null, undefined, 'basic' (DB alias), unknown strings.
 * 
 * This MUST be used at every boundary where tier is read from:
 *   - JWT claims
 *   - Database rows
 *   - URL params
 *   - User input
 * 
 * @example
 * normalizeTier(undefined)  // => 'basic'
 * normalizeTier('basic')    // => 'basic'
 * normalizeTier('pro')      // => 'pro'
 * normalizeTier('garbage')  // => 'basic'
 */
export function normalizeTier(raw: string | null | undefined): SubscriptionTier {
  if (!raw) return 'basic'
  const lowered = raw.toLowerCase().trim()
  if (lowered === 'basic' || lowered === 'basic' || lowered === 'free') return 'basic'
  if (lowered === 'pro' || lowered === 'professional') return 'pro'
  if (lowered === 'enterprise' || lowered === 'business') return 'enterprise'
  return 'basic' // Unknown → default
}

/**
 * Convert a SubscriptionTier back to the DB enum value ('basic').
 * Use this when writing to the database.
 */
export function tierToDbValue(tier: SubscriptionTier): string {
  if (tier === 'basic') return 'basic'
  return tier
}

/**
 * Check if a raw string is a valid tier value
 */
export function isValidTier(raw: string | null | undefined): raw is SubscriptionTier {
  return raw === 'basic' || raw === 'pro' || raw === 'enterprise'
}

// ============================================================================
// MODULE DEFINITIONS
// ============================================================================

/**
 * All modules in the application.
 * These IDs match the sidebar navigation item IDs.
 */
export const ALL_MODULES = [
  'dashboard',
  'jobs-board',
  'all-jobs',
  'customers',
  'vehicles',
  'mechanics',           // Mechanic Management
  'transactions',   // Payment history
  'reports',        // Analytics & Reports
  'settings',       // Always accessible
  'inventory',      // Parts & Inventory (future)
  'public-website', // Custom Brand Website (Enterprise)
] as const

export type ModuleId = typeof ALL_MODULES[number]

// ============================================================================
// TIER-BASED MODULE ACCESS
// ============================================================================

/**
 * Modules accessible by each tier.
 * Higher tiers inherit all modules from lower tiers.
 */
export const TIER_MODULES: Record<SubscriptionTier, readonly ModuleId[]> = {
  basic: [
    'dashboard',
    'jobs-board',
    'all-jobs',
    'customers',
    'vehicles',
    'settings',
  ],
  pro: [
    'dashboard',
    'jobs-board',
    'all-jobs',
    'customers',
    'vehicles',
    'mechanics',
    'transactions',
    'reports',
    'inventory',
    'settings',
  ],
  enterprise: [
    'dashboard',
    'jobs-board',
    'all-jobs',
    'customers',
    'vehicles',
    'mechanics',
    'transactions',
    'reports',
    'inventory',
    'public-website',
    'settings',
  ],
}

/**
 * Map URL paths to their module IDs for route-level protection.
 * Used by middleware and page-level guards.
 */
export const ROUTE_MODULE_MAP: Record<string, ModuleId> = {
  '/mechanics': 'mechanics',
  '/team': 'mechanics',
  '/transactions': 'transactions',
  '/reports': 'reports',
  '/inventory': 'inventory',
  '/dashboard': 'dashboard',
  '/jobs-board': 'jobs-board',
  '/all-jobs': 'all-jobs',
  '/customers': 'customers',
  '/vehicles': 'vehicles',
  '/settings': 'settings',
}

// ============================================================================
// USAGE LIMITS
// ============================================================================

export interface PlanLimits {
  jobsPerMonth: number    
  staffCount: number      
  whatsappMessages: number
  inventory: number       
}

export const TIER_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  basic: {
    jobsPerMonth: 70,
    staffCount: 2,
    whatsappMessages: 0,
    inventory: 0,
  },
  pro: {
    jobsPerMonth: 200,
    staffCount: 10,
    whatsappMessages: 100,
    inventory: 200,
  },
  enterprise: {
    jobsPerMonth: -1, // Unlimited (pay-as-you-go)
    staffCount: -1,
    whatsappMessages: -1,
    inventory: -1,
  },
}

// ============================================================================
// PLAN DISPLAY INFO (for UI)
// ============================================================================

export interface PlanDisplayInfo {
  name: string
  displayName: string
  tagline: string
  description: string
  monthlyPrice: string
  annualPrice: string
  targetUser: string
  hook: string
  features: string[]
  gstInvoicing: string
  communication: string
  usageLimitLabel: string
  color: string       // Primary accent color
  gradient: string    // Gradient for cards
}

export const PLAN_DISPLAY: Record<SubscriptionTier, PlanDisplayInfo> = {
  basic: {
    name: 'basic',
    displayName: 'Basic',
    tagline: 'Solo/Starter',
    description: 'Single-mechanic garage.',
    monthlyPrice: 'Coming Soon',
    annualPrice: 'Coming Soon',
    targetUser: 'Single-mechanic garage.',
    hook: 'Organizes the chaos.',
    features: [
      'Dashboard',
      'Job Board',
      'Customers',
      'Vehicles',
      'Basic Receipts',
      'Email notifications',
    ],
    gstInvoicing: 'Basic Receipts.',
    communication: 'Email only.',
    usageLimitLabel: '70 Jobs/mo, 2 Staff.',
    color: 'zinc',
    gradient: 'from-zinc-500 to-zinc-700',
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    tagline: 'Growing Shop',
    description: 'Mid-sized workshops (3-10 staff).',
    monthlyPrice: 'Coming Soon',
    annualPrice: 'Coming Soon',
    targetUser: 'Mid-sized workshops (3-10 staff).',
    hook: 'Manages the money (Profit/Loss).',
    features: [
      'Everything in Basic +',
      'Inventory Management',
      'Transactions & Payments',
      'Mechanic Management',
      'Full GST Filing & Tax Reports',
      'WhatsApp (Gupshup) Integration',
      'Advanced Reporting',
    ],
    gstInvoicing: 'Full GST Filing & Tax Reports.',
    communication: 'WhatsApp (Gupshup) Integration.',
    usageLimitLabel: '200 Jobs/mo, 10 Staff.',
    color: 'primary',
    gradient: 'from-primary to-primary/80',
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    tagline: 'The Brand',
    description: 'Multi-branch/Premium chains.',
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    targetUser: 'Multi-branch/Premium chains.',
    hook: 'Builds the Brand.',
    features: [
      'Everything in Pro +',
      'Custom Brand Website',
      'Multi-GST / Multi-location',
      'Priority WhatsApp Support & Auto-alerts',
      'Unlimited Jobs & Staff',
      'Dedicated Account Manager',
    ],
    gstInvoicing: 'Multi-GST / Multi-location.',
    communication: 'Priority WhatsApp Support & Auto-alerts.',
    usageLimitLabel: 'Unlimited (Pay-as-you-go).',
    color: 'violet',
    gradient: 'from-violet-500 to-violet-700',
  },
}

// ============================================================================
// UPGRADE / CONTACT CONFIGURATION
// ============================================================================

/**
 * Contact information for upgrade requests.
 * Since we don't have billing yet, all upgrades go through "Contact Us".
 */
export const UPGRADE_CONTACT = {
  email: 'hello@wrenchcloud.com',
  whatsapp: '+919876543210',  // Update with actual number
  subject: (currentTier: SubscriptionTier, targetTier: SubscriptionTier) =>
    `Upgrade Request: ${PLAN_DISPLAY[currentTier].displayName} → ${PLAN_DISPLAY[targetTier].displayName}`,
  body: (currentTier: SubscriptionTier, targetTier: SubscriptionTier) =>
    `Hi, I'd like to upgrade my plan from ${PLAN_DISPLAY[currentTier].displayName} to ${PLAN_DISPLAY[targetTier].displayName}. Please reach out to discuss.`,
  /** Generate a mailto: link for upgrade requests */
  mailtoLink: (currentTier: SubscriptionTier, targetTier: SubscriptionTier): string => {
    const subject = encodeURIComponent(UPGRADE_CONTACT.subject(currentTier, targetTier))
    const body = encodeURIComponent(UPGRADE_CONTACT.body(currentTier, targetTier))
    return `mailto:${UPGRADE_CONTACT.email}?subject=${subject}&body=${body}`
  },
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a module is accessible by a given tier
 */
export function isModuleAccessible(tier: SubscriptionTier, moduleId: string): boolean {
  const safeTier = normalizeTier(tier)
  return TIER_MODULES[safeTier]?.includes(moduleId as ModuleId) ?? false
}

/**
 * Get the minimum tier required for a module
 */
export function getRequiredTier(moduleId: string): SubscriptionTier {
  if (TIER_MODULES.basic.includes(moduleId as ModuleId)) return 'basic'
  if (TIER_MODULES.pro.includes(moduleId as ModuleId)) return 'pro'
  return 'enterprise'
}

/**
 * Get the upgrade tier label (e.g., "Pro" for a Basic user trying to access Pro features)
 */
export function getUpgradeTierLabel(moduleId: string): string {
  const required = getRequiredTier(moduleId)
  return PLAN_DISPLAY[required].displayName
}

/**
 * Check if a usage limit is reached
 */
export function isLimitReached(
  tier: SubscriptionTier,
  metric: keyof PlanLimits,
  currentValue: number
): boolean {
  const safeTier = normalizeTier(tier)
  const limit = TIER_LIMITS[safeTier][metric]
  if (limit === -1) return false // Unlimited
  if (limit === 0) return true   // Feature not available at all
  return currentValue >= limit
}

/**
 * Get the limit for a metric on a tier
 */
export function getLimit(tier: SubscriptionTier, metric: keyof PlanLimits): number {
  const safeTier = normalizeTier(tier)
  return TIER_LIMITS[safeTier][metric]
}

/**
 * Get the display label for limit (e.g., "50" or "Unlimited")
 */
export function getLimitLabel(tier: SubscriptionTier, metric: keyof PlanLimits): string {
  const limit = getLimit(tier, metric)
  if (limit === -1) return 'Unlimited'
  if (limit === 0) return 'Not Available'
  return limit.toString()
}

/**
 * Tier ordering for comparison
 */
export const TIER_ORDER: Record<SubscriptionTier, number> = {
  basic: 0,
  pro: 1,
  enterprise: 2,
}

/**
 * Check if tierA is higher than or equal to tierB
 */
export function isTierAtLeast(current: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_ORDER[normalizeTier(current)] >= TIER_ORDER[normalizeTier(required)]
}

/**
 * Get the next tier up from the current tier
 */
export function getNextTier(current: SubscriptionTier): SubscriptionTier | null {
  const safe = normalizeTier(current)
  if (safe === 'enterprise') return null
  if (safe === 'pro') return 'enterprise'
  return 'pro'
}

/**
 * Check if a route path is accessible by a given tier
 */
export function isRouteAccessible(tier: SubscriptionTier, pathname: string): boolean {
  const moduleId = ROUTE_MODULE_MAP[pathname]
  if (!moduleId) return true // Unknown routes are accessible by default
  return isModuleAccessible(tier, moduleId)
}

/**
 * Subscription pricing for admin revenue calculations
 * These are placeholder values - update when actual pricing is set
 */
export const TIER_PRICING: Record<SubscriptionTier, { monthly: number; annual: number }> = {
  basic: { monthly: 999, annual: 9990 },       // ₹999/mo
  pro: { monthly: 2499, annual: 24990 },        // ₹2,499/mo
  enterprise: { monthly: 5599, annual: 55990 }, // ₹5,599/mo (base)
}

// ============================================================================
// SUBSCRIPTION SYSTEM CONSTANTS
// ============================================================================

/** Loyalty discount applied when upgrading mid-cycle (5%) */
export const UPGRADE_DISCOUNT_PERCENT = 5

/** Days of read/write access after subscription expires before hard lock */
export const GRACE_PERIOD_DAYS = 7

/** Per-unit rates for Enterprise pay-as-you-go metering */
export const PAYG_RATES = {
  perJob: 25,           // ₹25 per job card beyond base
  perWhatsapp: 0.50,    // ₹0.50 per WhatsApp message
  perStaff: 199,        // ₹199 per additional staff member/mo
} as const

/** Valid billing periods */
export type BillingPeriod = 'monthly' | 'yearly'

/** Subscription validity states */
export type SubscriptionValidity = 'active' | 'grace_period' | 'expired' | 'trial'
