import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { gupshupService, STATUS_DISPLAY_TEXT } from '@/lib/integrations/gupshup.service'

interface SendMessageBody {
    jobId?: string
    jobStatus: string
    customerPhone: string
    vehicleNumber: string
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
    const { jobId, jobStatus, customerPhone, vehicleNumber, garageName, note } = body

    // Validate required fields
    if (!customerPhone) {
        return NextResponse.json({ error: 'Customer phone number is required' }, { status: 400 })
    }

    if (!jobStatus || !vehicleNumber || !garageName) {
        return NextResponse.json({ error: 'Job status, vehicle number, and garage name are required' }, { status: 400 })
    }

    // Auto-generate note for non-received statuses if not provided
    const finalNote = note || (jobStatus === 'received'
        ? ''
        : `Status: ${STATUS_DISPLAY_TEXT[jobStatus] || jobStatus}`)

    const result = await gupshupService.sendVehicleStatusUpdate(customerPhone, {
        jobStatus,
        vehicleNumber,
        garageName,
        note: finalNote
    })

    // Log to analytics schema
    logToAnalytics(supabase, {
        tenantId,
        jobId,
        customerPhone,
        jobStatus,
        vehicleNumber,
        messageId: result.messageId,
        deliveryStatus: result.status === 'submitted' ? 'sent' : 'failed',
        error: result.error
    })

    if (result.status === 'failed') {
        return NextResponse.json({ error: result.error || 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
}

interface AnalyticsLog {
    tenantId: string
    jobId?: string
    customerPhone: string
    jobStatus: string
    vehicleNumber: string
    messageId: string
    deliveryStatus: string
    error?: string
}

/** Log WhatsApp message to analytics (fire-and-forget) */
async function logToAnalytics(
    supabase: Awaited<ReturnType<typeof createClient>>,
    data: AnalyticsLog
): Promise<void> {
    try {
        await supabase
            .schema('analytics')
            .from('whatsapp_messages')
            .insert({
                tenant_id: data.tenantId,
                job_id: data.jobId || null,
                customer_phone: data.customerPhone,
                job_status: data.jobStatus,
                vehicle_number: data.vehicleNumber,
                message_id: data.messageId,
                delivery_status: data.deliveryStatus,
                error_message: data.error || null,
                sent_at: new Date().toISOString(),
            })
    } catch (err) {
        console.error('[GupshupAPI] Failed to log to analytics:', err)
    }
}
