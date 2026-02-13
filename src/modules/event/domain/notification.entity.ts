/**
 * Notification Entity
 * 
 * Domain models for both public (platform admin) and tenant notifications.
 * Notifications are created by the event processor, never directly by
 * tenant actions.
 */

import { EntityType, NotificationCategory, NotificationSeverity } from './event-types'

// ─── Base Notification ──────────────────────────────────────────────────────

interface BaseNotification {
  id: string
  title: string
  message: string
  category: NotificationCategory
  severity: NotificationSeverity
  entityType?: EntityType
  entityId?: string
  sourceEventId?: string
  isRead: boolean
  readAt?: Date
  createdAt: Date
}

// ─── Public Notification (platform admin) ───────────────────────────────────

export interface PlatformNotification extends BaseNotification {
  recipientId?: string   // platform_admin auth user id
  tenantId?: string      // related tenant context
}

export interface CreatePlatformNotificationDTO {
  recipientId?: string
  tenantId?: string
  title: string
  message: string
  category: NotificationCategory
  severity: NotificationSeverity
  entityType?: EntityType
  entityId?: string
  sourceEventId?: string
}

// ─── Tenant Notification ────────────────────────────────────────────────────

export interface TenantNotification extends BaseNotification {
  tenantId: string
  customerId?: string
  jobcardId?: string
  userId?: string
  channel: string
  template?: string
  payload?: Record<string, unknown>
  status: string
  sentAt?: Date
}

export interface CreateTenantNotificationDTO {
  tenantId: string
  userId?: string
  customerId?: string
  jobcardId?: string
  title: string
  message: string
  channel: string
  template?: string
  payload?: Record<string, unknown>
  category?: NotificationCategory
  severity?: NotificationSeverity
  entityType?: EntityType
  entityId?: string
  sourceEventId?: string
}
