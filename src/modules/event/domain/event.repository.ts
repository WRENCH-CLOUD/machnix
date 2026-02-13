/**
 * Event Repository Interface
 * 
 * Contract for event log data access.
 * Infrastructure implementations handle the actual Supabase queries.
 */

import { EventLog, PublishEventDTO, PendingEvent } from './event.entity'

export interface EventRepository {
  /**
   * Insert a new event into analytics.event_logs.
   * Uses idempotency_key to prevent duplicate events.
   */
  publish(dto: PublishEventDTO): Promise<EventLog>

  /**
   * Fetch unprocessed events ordered by created_at ASC.
   * Used by the event processor polling loop.
   * 
   * @param limit - max events to fetch per batch (default 50)
   */
  fetchPending(limit?: number): Promise<PendingEvent[]>

  /**
   * Mark an event as processed (sets processed_at = now()).
   */
  markProcessed(eventId: string): Promise<void>

  /**
   * Increment retry count and record error message.
   * Called when event processing fails but is retriable.
   */
  recordFailure(eventId: string, errorMessage: string): Promise<void>

  /**
   * Move a permanently failed event to the dead letter queue.
   * Called when retry_count >= max_retries.
   */
  moveToDeadLetter(eventId: string): Promise<void>

  /**
   * Find events by entity (for audit trail / debugging).
   */
  findByEntity(entityType: string, entityId: string): Promise<EventLog[]>

  /**
   * Find events by tenant (for tenant-scoped event history).
   */
  findByTenant(tenantId: string, limit?: number): Promise<EventLog[]>
}
