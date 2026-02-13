/**
 * Event Entity
 * 
 * Domain model representing an event in the analytics event log.
 * Events are the backbone of cross-schema communication — every
 * significant tenant action produces an event that the processor
 * later consumes to update aggregates and create notifications.
 */

import { EntityType, EventType } from './event-types'

export interface EventLog {
  id: string
  eventType: EventType
  tenantId: string
  entityType: EntityType
  entityId: string
  actorId?: string
  payload: Record<string, unknown>
  idempotencyKey?: string
  retryCount: number
  maxRetries: number
  errorMessage?: string
  createdAt: Date
  processedAt?: Date
}

/**
 * DTO for publishing a new event (omits system-managed fields)
 */
export interface PublishEventDTO {
  eventType: EventType
  tenantId: string
  entityType: EntityType
  entityId: string
  actorId?: string
  payload: Record<string, unknown>
  idempotencyKey?: string
}

/**
 * Represents an unprocessed event ready for the processor
 */
export interface PendingEvent extends EventLog {
  processedAt: undefined
}

/**
 * Result of processing a single event
 */
export type EventProcessingResult =
  | { success: true; eventId: string }
  | { success: false; eventId: string; error: string; retriable: boolean }
