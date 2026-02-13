/**
 * Event Processor API Route (Serverless)
 * 
 * POST /api/events/process
 * 
 * Alternative to the standalone processor script.
 * Call this endpoint from a cron job (e.g., Vercel Cron, GitHub Actions)
 * to process pending events in a serverless environment.
 * 
 * Requires service-role auth or platform admin JWT.
 */

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { SupabaseEventRepository } from '@/modules/event/infrastructure/event.repository.supabase'
import { SupabasePlatformNotificationRepository } from '@/modules/event/infrastructure/notification.repository.supabase'
import { SupabaseTenantNotificationRepository } from '@/modules/event/infrastructure/notification.repository.supabase'
import { EventProcessorService } from '@/modules/event/application/event-processor.service'

export async function POST(request: Request) {
  try {
    // Verify authorization (cron secret or admin token)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = getSupabaseAdmin()

    const eventRepo = new SupabaseEventRepository(adminClient)
    const platformNotifRepo = new SupabasePlatformNotificationRepository(adminClient)
    const tenantNotifRepo = new SupabaseTenantNotificationRepository(adminClient)

    const processor = new EventProcessorService(
      eventRepo,
      platformNotifRepo,
      tenantNotifRepo,
      { batchSize: 100, pollingIntervalMs: 0, maxIdlePolls: 0, idleBackoffMultiplier: 1, maxBackoffMs: 0 }
    )

    // Process a single batch (no loop — serverless-friendly)
    const processedCount = await processor.processBatch()

    return NextResponse.json({
      success: true,
      processedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[EventProcessorAPI] Error:', error)
    return NextResponse.json(
      { error: 'Event processing failed' },
      { status: 500 }
    )
  }
}
