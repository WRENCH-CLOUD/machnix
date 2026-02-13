/**
 * Notification Generator
 * 
 * Maps events to notification payloads for both platform admins and tenant users.
 * This is a pure mapping layer — no side effects, no database access.
 * 
 * The event processor calls this to determine WHAT notifications to create,
 * then writes them via the appropriate notification repository.
 */

import { EventLog } from '../domain/event.entity'
import { CreatePlatformNotificationDTO } from '../domain/notification.entity'
import { CreateTenantNotificationDTO } from '../domain/notification.entity'
import {
  JOB_EVENTS,
  INVOICE_EVENTS,
  PAYMENT_EVENTS,
  SUBSCRIPTION_EVENTS,
  TENANT_EVENTS,
  INVENTORY_EVENTS,
  NotificationSeverity,
} from '../domain/event-types'

interface GeneratedNotifications {
  platform: CreatePlatformNotificationDTO[]
  tenant: CreateTenantNotificationDTO[]
}

/**
 * Generate notification DTOs from a processed event.
 * Returns separate arrays for platform and tenant notifications.
 * Some events produce both (e.g. subscription expiring notifies tenant owner AND platform admin).
 */
export function generateNotifications(event: EventLog): GeneratedNotifications {
  const result: GeneratedNotifications = { platform: [], tenant: [] }
  const payload = event.payload as Record<string, unknown>

  switch (event.eventType) {
    // ─── Job Events ─────────────────────────────────────────────────
    case JOB_EVENTS.CREATED: {
      result.tenant.push({
        tenantId: event.tenantId,
        userId: event.actorId,
        jobcardId: event.entityId,
        title: 'New Job Card Created',
        message: `Job ${payload.job_number ?? ''} has been created and is now in "Received" status.`,
        channel: 'in_app',
        category: 'job_update',
        severity: 'info',
        entityType: 'jobcard',
        entityId: event.entityId,
        sourceEventId: event.id,
      })
      break
    }

    case JOB_EVENTS.STATUS_CHANGED: {
      const severity: NotificationSeverity =
        payload.new_status === 'cancelled' ? 'warning' : 'info'

      result.tenant.push({
        tenantId: event.tenantId,
        jobcardId: event.entityId,
        title: 'Job Status Updated',
        message: `Job ${payload.job_number ?? ''} moved from "${payload.old_status}" to "${payload.new_status}".`,
        channel: 'in_app',
        category: 'job_update',
        severity,
        entityType: 'jobcard',
        entityId: event.entityId,
        sourceEventId: event.id,
      })
      break
    }

    // ─── Invoice Events ─────────────────────────────────────────────
    case INVOICE_EVENTS.GENERATED: {
      result.tenant.push({
        tenantId: event.tenantId,
        customerId: payload.customer_id as string,
        jobcardId: payload.jobcard_id as string,
        title: 'Invoice Generated',
        message: `Invoice ${payload.invoice_number ?? ''} for ₹${payload.total_amount ?? 0} has been generated.`,
        channel: 'in_app',
        category: 'billing',
        severity: 'info',
        entityType: 'invoice',
        entityId: event.entityId,
        sourceEventId: event.id,
      })
      break
    }

    // ─── Payment Events ─────────────────────────────────────────────
    case PAYMENT_EVENTS.RECEIVED: {
      result.tenant.push({
        tenantId: event.tenantId,
        title: 'Payment Received',
        message: `Payment of ₹${payload.amount ?? 0} received via ${payload.payment_method ?? 'unknown'}.`,
        channel: 'in_app',
        category: 'billing',
        severity: 'info',
        entityType: 'payment',
        entityId: event.entityId,
        sourceEventId: event.id,
      })

      // Platform admin also gets notified of payments (revenue tracking)
      result.platform.push({
        tenantId: event.tenantId,
        title: 'Tenant Payment Received',
        message: `Payment of ₹${payload.amount ?? 0} received for tenant ${event.tenantId}.`,
        category: 'billing',
        severity: 'info',
        entityType: 'payment',
        entityId: event.entityId,
        sourceEventId: event.id,
      })
      break
    }

    // ─── Subscription Events ────────────────────────────────────────
    case SUBSCRIPTION_EVENTS.EXPIRING: {
      result.tenant.push({
        tenantId: event.tenantId,
        title: 'Subscription Expiring Soon',
        message: `Your ${payload.subscription_tier ?? ''} subscription expires on ${payload.subscription_end ?? 'soon'}. Please renew to avoid service interruption.`,
        channel: 'in_app',
        category: 'billing',
        severity: 'warning',
        entityType: 'tenant',
        entityId: event.entityId,
        sourceEventId: event.id,
      })

      result.platform.push({
        tenantId: event.tenantId,
        title: 'Tenant Subscription Expiring',
        message: `Tenant "${payload.tenant_name ?? event.tenantId}" subscription (${payload.subscription_tier}) expires on ${payload.subscription_end}.`,
        category: 'billing',
        severity: 'warning',
        entityType: 'tenant',
        entityId: event.entityId,
        sourceEventId: event.id,
      })
      break
    }

    case SUBSCRIPTION_EVENTS.CHANGED: {
      result.platform.push({
        tenantId: event.tenantId,
        title: 'Subscription Tier Changed',
        message: `Tenant "${payload.tenant_name ?? event.tenantId}" changed from ${payload.old_tier} to ${payload.new_tier}.`,
        category: 'billing',
        severity: 'info',
        entityType: 'tenant',
        entityId: event.entityId,
        sourceEventId: event.id,
      })
      break
    }

    // ─── Tenant Events ──────────────────────────────────────────────
    case TENANT_EVENTS.STATUS_CHANGED: {
      const severity: NotificationSeverity =
        payload.new_status === 'suspended' ? 'critical' : 'info'

      result.platform.push({
        tenantId: event.tenantId,
        title: 'Tenant Status Changed',
        message: `Tenant "${payload.tenant_name ?? event.tenantId}" status changed from "${payload.old_status}" to "${payload.new_status}".`,
        category: 'tenant_activity',
        severity,
        entityType: 'tenant',
        entityId: event.entityId,
        sourceEventId: event.id,
      })
      break
    }

    // ─── Inventory Events ───────────────────────────────────────────
    case INVENTORY_EVENTS.LOW_STOCK: {
      result.tenant.push({
        tenantId: event.tenantId,
        title: 'Low Stock Alert',
        message: `Part "${payload.part_name ?? ''}" (SKU: ${payload.sku ?? ''}) is running low. Current stock: ${payload.current_stock ?? 0}.`,
        channel: 'in_app',
        category: 'inventory',
        severity: 'warning',
        entityType: 'part',
        entityId: event.entityId,
        sourceEventId: event.id,
      })
      break
    }

    default:
      // Unknown event types are silently skipped
      // Events without notification mappings are still processed and marked done
      break
  }

  return result
}
