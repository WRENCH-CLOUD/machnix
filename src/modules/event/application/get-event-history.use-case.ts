/**
 * Get Event History Use Case
 * 
 * Query event history for debugging, audit trail, and monitoring.
 */

import { EventRepository } from '../domain/event.repository'
import { EventLog } from '../domain/event.entity'
import { EntityType } from '../domain/event-types'

export class GetEventHistoryUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  /**
   * Get all events for a specific entity (audit trail).
   */
  async byEntity(entityType: EntityType, entityId: string): Promise<EventLog[]> {
    return this.eventRepository.findByEntity(entityType, entityId)
  }

  /**
   * Get recent events for a tenant.
   */
  async byTenant(tenantId: string, limit = 100): Promise<EventLog[]> {
    return this.eventRepository.findByTenant(tenantId, limit)
  }
}
