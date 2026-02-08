import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { gupshupService } from '@/lib/integrations/gupshup.service'

interface SendMessageBody {
    jobId?: string
    customerPhone: string
    vehicleName: string
    status: string
    garageName: string
    note?: string
}

/** POST /api/tenant/gupshup/send - Send vehicle status WhatsApp message */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id
    if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    if (!gupshupService.isConfigured()) {
        return NextResponse.json({ error: 'WhatsApp integration is not configured' }, { status: 400 })
    }

    // Check tenant WhatsApp permission
    const { data: settings } = await supabase
        .schema('tenant')
        .from('settings')
        .select('whatsapp_enabled')
        .eq('tenant_id', tenantId)
        .single()

    if (!settings?.whatsapp_enabled) {
        return NextResponse.json(
            { error: 'WhatsApp notifications are not enabled for your account' },
            { status: 400 }
        )
    }

    const body = await request.json() as SendMessageBody
    const { jobId, customerPhone, vehicleName, status, garageName, note } = body

    // Validate required fields
    if (!customerPhone) {
        return NextResponse.json({ error: 'Customer phone number is required' }, { status: 400 })
    }

    if (!vehicleName || !status || !garageName) {
        return NextResponse.json({ error: 'Vehicle name, status, and garage name are required' }, { status: 400 })
    }

    const params = { vehicleName, status, garageName, note: note || '' }
    const result = await gupshupService.sendVehicleStatusUpdate(customerPhone, params)

    // Log notification (non-blocking)
    logNotification(supabase, tenantId, jobId, result, params, customerPhone)

    if (result.status === 'failed') {
        return NextResponse.json({ error: result.error || 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
}

/** Log notification to database (fire-and-forget) */
async function logNotification(
    supabase: Awaited<ReturnType<typeof createClient>>,
    tenantId: string,
    jobId: string | undefined,
    result: { messageId?: string; status: string },
    params: { vehicleName: string; status: string; garageName: string; note: string },
    customerPhone: string
): Promise<void> {
    try {
        await supabase
            .schema('tenant')
            .from('notifications')
            .insert({
                tenant_id: tenantId,
                jobcard_id: jobId || null,
                channel: 'whatsapp',
                template: 'vehicle_status_update',
                payload: { messageId: result.messageId, params, customerPhone },
                status: result.status === 'submitted' ? 'sent' : 'failed',
                sent_at: new Date().toISOString(),
            })
    } catch (err) {
        console.error('[GupshupAPI] Failed to log notification:', err)
    }
}
