/**
 * Event Processor Runner
 * 
 * Standalone script to run the event processor as a background service.
 * 
 * Usage:
 *   npx tsx scripts/run-event-processor.ts
 * 
 * Configuration via environment variables:
 *   EVENT_BATCH_SIZE        — events per poll (default: 50)
 *   EVENT_POLL_INTERVAL_MS  — ms between polls (default: 5000)
 *   EVENT_MAX_IDLE_POLLS    — idles before backoff (default: 10)
 *   EVENT_MAX_BACKOFF_MS    — max backoff interval (default: 60000)
 * 
 * This runs outside the Next.js request lifecycle to ensure
 * analytics processing never blocks transactional performance.
 */

import { createClient } from '@supabase/supabase-js'
import { SupabaseEventRepository } from '../src/modules/event/infrastructure/event.repository.supabase'
import { SupabasePlatformNotificationRepository } from '../src/modules/event/infrastructure/notification.repository.supabase'
import { SupabaseTenantNotificationRepository } from '../src/modules/event/infrastructure/notification.repository.supabase'
import { EventProcessorService } from '../src/modules/event/application/event-processor.service'

// ─── Supabase Admin Client (service role, bypasses RLS) ──────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '[EventProcessor] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  )
  process.exit(1)
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Wire Up Repositories ────────────────────────────────────────────────────

const eventRepo = new SupabaseEventRepository(adminClient)
const platformNotifRepo = new SupabasePlatformNotificationRepository(adminClient)
const tenantNotifRepo = new SupabaseTenantNotificationRepository(adminClient)

// ─── Config from Environment ─────────────────────────────────────────────────

const config = {
  batchSize: parseInt(process.env.EVENT_BATCH_SIZE ?? '50', 10),
  pollingIntervalMs: parseInt(process.env.EVENT_POLL_INTERVAL_MS ?? '5000', 10),
  maxIdlePolls: parseInt(process.env.EVENT_MAX_IDLE_POLLS ?? '10', 10),
  idleBackoffMultiplier: 2,
  maxBackoffMs: parseInt(process.env.EVENT_MAX_BACKOFF_MS ?? '60000', 10),
}

// ─── Start Processor ─────────────────────────────────────────────────────────

const processor = new EventProcessorService(
  eventRepo,
  platformNotifRepo,
  tenantNotifRepo,
  config
)

// Graceful shutdown
const shutdown = () => {
  console.log('[EventProcessor] Shutting down gracefully...')
  processor.stop()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

console.log('[EventProcessor] Configuration:', config)
processor.start().catch((err) => {
  console.error('[EventProcessor] Fatal error:', err)
  process.exit(1)
})
