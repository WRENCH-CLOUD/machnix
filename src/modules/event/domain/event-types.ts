/**
 * Event Types Registry
 * 
 * Central registry of all event types in the system.
 * Follows the pattern: <domain>.<action>
 * 
 * This is the single source of truth for event type strings
 * used by publishers, processors, and notification generators.
 */

// ─── Job Events ──────────────────────────────────────────────────────────────
export const JOB_EVENTS = {
  CREATED: 'job.created',
  STATUS_CHANGED: 'job.status_changed',
  ASSIGNED: 'job.assigned',
  COMPLETED: 'job.completed',
  CANCELLED: 'job.cancelled',
} as const

// ─── Invoice Events ──────────────────────────────────────────────────────────
export const INVOICE_EVENTS = {
  GENERATED: 'invoice.generated',
  SENT: 'invoice.sent',
  OVERDUE: 'invoice.overdue',
} as const

// ─── Payment Events ──────────────────────────────────────────────────────────
export const PAYMENT_EVENTS = {
  RECEIVED: 'payment.received',
  FAILED: 'payment.failed',
  REFUNDED: 'payment.refunded',
} as const

// ─── Subscription Events ────────────────────────────────────────────────────
export const SUBSCRIPTION_EVENTS = {
  CHANGED: 'subscription.changed',
  EXPIRING: 'subscription.expiring',
  EXPIRED: 'subscription.expired',
  RENEWED: 'subscription.renewed',
} as const

// ─── Tenant Events ──────────────────────────────────────────────────────────
export const TENANT_EVENTS = {
  STATUS_CHANGED: 'tenant.status_changed',
  ONBOARDED: 'tenant.onboarded',
} as const

// ─── Inventory Events ───────────────────────────────────────────────────────
export const INVENTORY_EVENTS = {
  LOW_STOCK: 'inventory.low_stock',
  RESTOCKED: 'inventory.restocked',
} as const

// ─── Union type of all event types ──────────────────────────────────────────
export type EventType =
  | typeof JOB_EVENTS[keyof typeof JOB_EVENTS]
  | typeof INVOICE_EVENTS[keyof typeof INVOICE_EVENTS]
  | typeof PAYMENT_EVENTS[keyof typeof PAYMENT_EVENTS]
  | typeof SUBSCRIPTION_EVENTS[keyof typeof SUBSCRIPTION_EVENTS]
  | typeof TENANT_EVENTS[keyof typeof TENANT_EVENTS]
  | typeof INVENTORY_EVENTS[keyof typeof INVENTORY_EVENTS]

// ─── Entity Types ───────────────────────────────────────────────────────────
export type EntityType =
  | 'jobcard'
  | 'invoice'
  | 'payment'
  | 'tenant'
  | 'subscription'
  | 'part'
  | 'customer'
  | 'vehicle'
  | 'mechanic'

// ─── Notification Categories ────────────────────────────────────────────────
export type NotificationCategory =
  | 'system'
  | 'billing'
  | 'alert'
  | 'tenant_activity'
  | 'job_update'
  | 'inventory'

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical'
