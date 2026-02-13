import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { checkRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'

/**
 * POST /api/callbacks/gupshup
 * Webhook endpoint for Gupshup delivery status callbacks
 * 
 * Gupshup sends delivery events here when message status changes:
 * - enqueued, failed, sent, delivered, read
 * 
 * SECURITY: This is a public webhook endpoint.
 * - Rate limited to prevent abuse
 * - Validates expected payload structure before processing
 * - Only updates existing records (no creation of new data)
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limit webhook calls to prevent abuse
        const rateLimitResult = checkRateLimit(request, RATE_LIMITS.STANDARD, 'gupshup-webhook')
        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult)
        }

        const body = await request.json()

        // Validate payload structure to reject garbage requests
        if (!body || typeof body !== 'object' || !body.type) {
            console.warn('[GupshupWebhook] Invalid payload structure:', typeof body)
            return new NextResponse(null, { status: 200 })
        }

        console.log('[GupshupWebhook] Received:', JSON.stringify(body, null, 2))

        // Extract relevant fields from Gupshup webhook payload
        const {
            type,
            payload
        } = body

        // Handle message status events
        if (type === 'message-event') {
            const {
                id: messageId,
                type: eventType,
            } = payload || {}

            // Map Gupshup status to our notification status
            const statusMap: Record<string, string> = {
                'enqueued': 'queued',
                'failed': 'failed',
                'sent': 'sent',
                'delivered': 'delivered',
                'read': 'read',
            }

            const status = statusMap[eventType] || eventType

            // Update notification status in database using service role
            if (messageId) {
                try {
                    const supabase = createSupabaseClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!
                    )

                    // Update notification by matching the gupshup message ID in metadata
                    const { error } = await supabase
                        .schema('tenant')
                        .from('notifications')
                        .update({
                            status,
                            sent_at: status === 'sent' ? new Date().toISOString() : undefined,
                        })
                        .eq('payload->messageId', messageId)

                    if (error) {
                        console.error('[GupshupWebhook] Error updating notification:', error)
                    }
                } catch (dbError) {
                    console.error('[GupshupWebhook] Database error:', dbError)
                }
            }
        }

        // Gupshup expects empty 200 response within 10 seconds
        return new NextResponse(null, { status: 200 })
    } catch (error: any) {
        console.error('[GupshupWebhook] Error processing webhook:', error)
        // Still return 200 to prevent Gupshup from retrying
        return new NextResponse(null, { status: 200 })
    }
}
