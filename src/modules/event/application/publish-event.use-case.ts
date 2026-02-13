/**
 * Event Publisher Use Case
 * 
 * Application-layer helper for publishing events from use cases.
 * 
 * While database triggers handle the core events (job created, invoice generated,
 * payment received, subscription changes), this publisher is used for:
 *   1. Application-level events that don't map to a single INSERT/UPDATE
 *   2. Events triggered by business logic in use cases
 *   3. Manual/explicit event publishing from API routes
 * 
 * Design decisions:
 *   - Fire-and-forget: publishing never blocks the caller
 *   - Idempotent: duplicate publishes with the same key are silently ignored
 *   - Fail-safe: publishing errors are logged, never thrown to callers
 */

import { EventRepository } from '../domain/event.repository'
import { PublishEventDTO, EventLog } from '../domain/event.entity'
import { EventType, EntityType } from '../domain/event-types'

export class PublishEventUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  /**
   * Publish a domain event to the analytics event log.
   * 
   * @returns The created event, or null if publishing failed silently
   */
  async execute(dto: PublishEventDTO): Promise<EventLog | null> {
    try {
      return await this.eventRepository.publish(dto)
    } catch (error) {
      // Event publishing must never crash the calling operation
      console.error(
        `[EventPublisher] Failed to publish ${dto.eventType} for ${dto.entityType}:${dto.entityId}`,
        error
      )
      return null
    }
  }

  /**
   * Convenience method with positional arguments for common use.
   */
  async publish(
    eventType: EventType,
    tenantId: string,
    entityType: EntityType,
    entityId: string,
    payload: Record<string, unknown> = {},
    actorId?: string
  ): Promise<EventLog | null> {
    return this.execute({
      eventType,
      tenantId,
      entityType,
      entityId,
      payload,
      actorId,
    })
  }
}
