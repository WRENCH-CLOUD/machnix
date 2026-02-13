/**
 * Supabase Event Repository
 * 
 * Infrastructure implementation for analytics.event_logs.
 * Uses the admin client (service role) to bypass RLS for processor operations.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { EventRepository } from '../domain/event.repository'
import { EventLog, PublishEventDTO, PendingEvent } from '../domain/event.entity'
import { EventType, EntityType } from '../domain/event-types'

export class SupabaseEventRepository implements EventRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  // ─── Row ↔ Domain Mapping ──────────────────────────────────────────────────

  private toDomain(row: Record<string, unknown>): EventLog {
    return {
      id: row.id as string,
      eventType: row.event_type as EventType,
      tenantId: row.tenant_id as string,
      entityType: row.entity_type as EntityType,
      entityId: row.entity_id as string,
      actorId: row.actor_id as string | undefined,
      payload: (row.payload as Record<string, unknown>) ?? {},
      idempotencyKey: row.idempotency_key as string | undefined,
      retryCount: row.retry_count as number,
      maxRetries: row.max_retries as number,
      errorMessage: row.error_message as string | undefined,
      createdAt: new Date(row.created_at as string),
      processedAt: row.processed_at
        ? new Date(row.processed_at as string)
        : undefined,
    }
  }

  // ─── Publish ───────────────────────────────────────────────────────────────

  async publish(dto: PublishEventDTO): Promise<EventLog> {
    const idempotencyKey =
      dto.idempotencyKey ??
      `${dto.eventType}:${dto.entityId}:${Date.now()}`

    const { data, error } = await this.supabase
      .schema('analytics')
      .from('event_logs')
      .upsert(
        {
          event_type: dto.eventType,
          tenant_id: dto.tenantId,
          entity_type: dto.entityType,
          entity_id: dto.entityId,
          actor_id: dto.actorId ?? null,
          payload: dto.payload,
          idempotency_key: idempotencyKey,
        },
        { onConflict: 'idempotency_key', ignoreDuplicates: true }
      )
      .select()
      .single()

    if (error) throw new Error(`Event publish failed: ${error.message}`)
    return this.toDomain(data)
  }

  // ─── Fetch Pending ─────────────────────────────────────────────────────────

  async fetchPending(limit = 50): Promise<PendingEvent[]> {
    const { data, error } = await this.supabase
      .schema('analytics')
      .from('event_logs')
      .select('*')
      .is('processed_at', null)
      .lt('retry_count', 5) // max_retries default
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw new Error(`Fetch pending events failed: ${error.message}`)
    return (data ?? []).map((row) => this.toDomain(row)) as PendingEvent[]
  }

  // ─── Mark Processed ───────────────────────────────────────────────────────

  async markProcessed(eventId: string): Promise<void> {
    const { error } = await this.supabase
      .schema('analytics')
      .from('event_logs')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', eventId)

    if (error) throw new Error(`Mark processed failed: ${error.message}`)
  }

  // ─── Record Failure ───────────────────────────────────────────────────────

  async recordFailure(eventId: string, errorMessage: string): Promise<void> {
    // Use RPC or raw update to atomically increment retry_count
    const { error } = await this.supabase.rpc('increment_event_retry', {
      p_event_id: eventId,
      p_error_message: errorMessage,
    })

    // Fallback: direct update if RPC not available
    if (error) {
      const { error: updateError } = await this.supabase
        .schema('analytics')
        .from('event_logs')
        .update({
          error_message: errorMessage,
          // Note: retry_count increment should ideally be atomic
          // This fallback is not perfectly safe under concurrency
        })
        .eq('id', eventId)

      if (updateError) {
        throw new Error(`Record failure failed: ${updateError.message}`)
      }
    }
  }

  // ─── Dead Letter Queue ────────────────────────────────────────────────────

  async moveToDeadLetter(eventId: string): Promise<void> {
    // Fetch the event first
    const { data: event, error: fetchError } = await this.supabase
      .schema('analytics')
      .from('event_logs')
      .select('*')
      .eq('id', eventId)
      .single()

    if (fetchError || !event) {
      throw new Error(`Event not found for dead letter: ${fetchError?.message}`)
    }

    // Insert into dead letter queue
    const { error: insertError } = await this.supabase
      .schema('analytics')
      .from('event_dead_letter')
      .insert({
        original_event_id: event.id,
        event_type: event.event_type,
        tenant_id: event.tenant_id,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        payload: event.payload,
        error_message: event.error_message,
        retry_count: event.retry_count,
      })

    if (insertError) {
      throw new Error(`Dead letter insert failed: ${insertError.message}`)
    }

    // Mark the original event as "dead-lettered" by setting processed_at
    // This prevents the processor from picking it up again
    await this.markProcessed(eventId)
  }

  // ─── Query Methods ────────────────────────────────────────────────────────

  async findByEntity(entityType: string, entityId: string): Promise<EventLog[]> {
    const { data, error } = await this.supabase
      .schema('analytics')
      .from('event_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Find by entity failed: ${error.message}`)
    return (data ?? []).map((row) => this.toDomain(row))
  }

  async findByTenant(tenantId: string, limit = 100): Promise<EventLog[]> {
    const { data, error } = await this.supabase
      .schema('analytics')
      .from('event_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Find by tenant failed: ${error.message}`)
    return (data ?? []).map((row) => this.toDomain(row))
  }
}
