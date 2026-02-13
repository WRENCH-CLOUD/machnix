/**
 * Event Processor Service
 * 
 * The core of the decentralised event architecture. This service:
 *   1. Polls analytics.event_logs for unprocessed events
 *   2. Generates notifications via the notification-generator
 *   3. Writes notifications to appropriate schemas (public / tenant)
 *   4. Marks events as processed
 *   5. Handles failures with retry + dead letter queue
 * 
 * Design principles:
 *   - Single writer: only this processor updates analytics aggregates
 *   - Idempotent: reprocessing the same event produces identical results
 *   - Backpressure: configurable batch size and polling interval
 *   - Circuit breaker: events exceeding max_retries go to dead letter queue
 *   - Non-blocking: event processing never blocks tenant transactional paths
 * 
 * Deployment:
 *   - Run as a standalone Node.js process, cron job, or serverless function
 *   - NOT part of the Next.js request lifecycle
 */

import { EventRepository } from '../domain/event.repository'
import {
  PlatformNotificationRepository,
  TenantNotificationRepository,
} from '../domain/notification.repository'
import { PendingEvent, EventProcessingResult } from '../domain/event.entity'
import { generateNotifications } from './notification-generator'

export interface EventProcessorConfig {
  /** Max events per polling batch (default: 50) */
  batchSize: number
  /** Milliseconds between polling cycles (default: 5000) */
  pollingIntervalMs: number
  /** Max consecutive empty polls before backing off (default: 10) */
  maxIdlePolls: number
  /** Backoff multiplier when idle (default: 2) */
  idleBackoffMultiplier: number
  /** Maximum backoff interval in ms (default: 60000) */
  maxBackoffMs: number
}

const DEFAULT_CONFIG: EventProcessorConfig = {
  batchSize: 50,
  pollingIntervalMs: 5000,
  maxIdlePolls: 10,
  idleBackoffMultiplier: 2,
  maxBackoffMs: 60_000,
}

export class EventProcessorService {
  private isRunning = false
  private idleCount = 0
  private currentInterval: number
  private readonly config: EventProcessorConfig

  constructor(
    private readonly eventRepo: EventRepository,
    private readonly platformNotificationRepo: PlatformNotificationRepository,
    private readonly tenantNotificationRepo: TenantNotificationRepository,
    config?: Partial<EventProcessorConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.currentInterval = this.config.pollingIntervalMs
  }

  // ─── Main Loop ─────────────────────────────────────────────────────────────

  /**
   * Start the processor polling loop.
   * Call this from a standalone script or serverless function entry point.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[EventProcessor] Already running')
      return
    }

    this.isRunning = true
    console.log('[EventProcessor] Starting event processor loop...')

    while (this.isRunning) {
      try {
        const processedCount = await this.processBatch()

        if (processedCount === 0) {
          this.idleCount++
          this.applyBackoff()
        } else {
          this.idleCount = 0
          this.currentInterval = this.config.pollingIntervalMs
        }
      } catch (error) {
        console.error('[EventProcessor] Batch processing error:', error)
        // Continue running — individual event failures are handled per-event
      }

      await this.sleep(this.currentInterval)
    }

    console.log('[EventProcessor] Stopped.')
  }

  /**
   * Stop the processor gracefully.
   */
  stop(): void {
    this.isRunning = false
  }

  // ─── Batch Processing ──────────────────────────────────────────────────────

  /**
   * Process a single batch of pending events.
   * Can be called directly for serverless / cron-based execution.
   * 
   * @returns Number of events processed in this batch
   */
  async processBatch(): Promise<number> {
    const events = await this.eventRepo.fetchPending(this.config.batchSize)

    if (events.length === 0) {
      return 0
    }

    console.log(`[EventProcessor] Processing batch of ${events.length} events`)

    const results = await Promise.allSettled(
      events.map((event) => this.processEvent(event))
    )

    const succeeded = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length

    const failed = results.length - succeeded

    if (failed > 0) {
      console.warn(
        `[EventProcessor] Batch complete: ${succeeded} succeeded, ${failed} failed`
      )
    }

    return events.length
  }

  // ─── Single Event Processing ───────────────────────────────────────────────

  /**
   * Process a single event:
   *   1. Generate notifications
   *   2. Write notifications to DB
   *   3. Mark event as processed
   *   4. Handle failures
   */
  private async processEvent(
    event: PendingEvent
  ): Promise<EventProcessingResult> {
    try {
      // Step 1: Generate notifications from event
      const notifications = generateNotifications(event)

      // Step 2: Write platform notifications
      for (const platformNotif of notifications.platform) {
        await this.platformNotificationRepo.create(platformNotif)
      }

      // Step 3: Write tenant notifications
      for (const tenantNotif of notifications.tenant) {
        await this.tenantNotificationRepo.create(tenantNotif)
      }

      // Step 4: Mark event as processed
      await this.eventRepo.markProcessed(event.id)

      return { success: true, eventId: event.id }
    } catch (error) {
      return this.handleProcessingError(event, error)
    }
  }

  // ─── Error Handling ────────────────────────────────────────────────────────

  private async handleProcessingError(
    event: PendingEvent,
    error: unknown
  ): Promise<EventProcessingResult> {
    const errorMessage =
      error instanceof Error ? error.message : String(error)

    console.error(
      `[EventProcessor] Failed to process event ${event.id} (${event.eventType}): ${errorMessage}`
    )

    try {
      // Record the failure (increments retry_count)
      await this.eventRepo.recordFailure(event.id, errorMessage)

      // Check if we've exceeded max retries → dead letter
      if (event.retryCount + 1 >= event.maxRetries) {
        console.warn(
          `[EventProcessor] Event ${event.id} exceeded max retries (${event.maxRetries}). Moving to dead letter queue.`
        )
        await this.eventRepo.moveToDeadLetter(event.id)

        return {
          success: false,
          eventId: event.id,
          error: `Moved to dead letter queue after ${event.maxRetries} retries: ${errorMessage}`,
          retriable: false,
        }
      }

      return {
        success: false,
        eventId: event.id,
        error: errorMessage,
        retriable: true,
      }
    } catch (handlingError) {
      // If even error handling fails, log and continue
      console.error(
        `[EventProcessor] Failed to handle error for event ${event.id}:`,
        handlingError
      )
      return {
        success: false,
        eventId: event.id,
        error: `Error handling failed: ${errorMessage}`,
        retriable: true,
      }
    }
  }

  // ─── Backoff Logic ─────────────────────────────────────────────────────────

  private applyBackoff(): void {
    if (this.idleCount >= this.config.maxIdlePolls) {
      this.currentInterval = Math.min(
        this.currentInterval * this.config.idleBackoffMultiplier,
        this.config.maxBackoffMs
      )
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
