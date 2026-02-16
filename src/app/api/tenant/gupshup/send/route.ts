import { NextRequest, NextResponse } from 'next/server'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { gupshupService } from '@/lib/integrations/gupshup.service'
import { VehicleStatusUpdateParams } from '@/modules/whatsapp/domain/whatsapp-templates.types'
import { normalizeTier, isModuleAccessible } from '@/config/plan-features'

/**
 * POST /api/tenant/gupshup/send
 * Send a vehicle status update WhatsApp message
 * 
 * This is triggered manually by the tenant when they want to notify a customer.
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenantId = user.app_metadata?.tenant_id
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
        }

        // --- SUBSCRIPTION GATE: WhatsApp requires Pro or higher ---
        const tier = normalizeTier(user.app_metadata?.subscription_tier)
        if (tier === 'basic') {
            return NextResponse.json(
                {
                    error: 'WhatsApp messaging requires a Pro or Enterprise plan.',
                    code: 'FEATURE_LOCKED',
                    required_tier: 'pro',
                    current_tier: tier,
                },
                { status: 403 }
            )
        }

        if (!gupshupService.isConfigured()) {
            return NextResponse.json(
                { error: 'WhatsApp integration is not configured' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const {
            jobId,
            customerPhone,
            vehicleName,
            status,
            garageName,
            note
        } = body as {
            jobId?: string
            customerPhone: string
            vehicleName: string
            status: string
            garageName: string
            note?: string
        }

        if (!customerPhone) {
            return NextResponse.json(
                { error: 'Customer phone number is required' },
                { status: 400 }
            )
        }

        if (!vehicleName || !status || !garageName) {
            return NextResponse.json(
                { error: 'Vehicle name, status, and garage name are required' },
                { status: 400 }
            )
        }

        const repository = new SupabaseTenantRepository(supabase)
        const settings = await repository.getGupshupSettings(tenantId)

        if (!settings?.isActive) {
            return NextResponse.json(
                { error: 'WhatsApp notifications are not enabled for your account' },
                { status: 400 }
            )
        }

        const params: VehicleStatusUpdateParams = {
            vehicleName,
            status,
            garageName,
            note: note || ''
        }

        const result = await gupshupService.sendVehicleStatusUpdate(customerPhone, params)

        // Log the notification
        try {
            const adminSupabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )
            await adminSupabase
                .schema('tenant')
                .from('notifications')
                .insert({
                    tenant_id: tenantId,
                    jobcard_id: jobId || null,
                    channel: 'whatsapp',
                    template: 'vehicle_status_update',
                    payload: {
                        messageId: result.messageId,
                        params,
                        customerPhone
                    },
                    status: result.status === 'submitted' ? 'sent' : 'failed',
                    sent_at: new Date().toISOString(),
                })
        } catch (logError) {
            console.error('[GupshupAPI] Failed to log notification:', logError)
            // Don't fail the request if logging fails
        }

        if (result.status === 'failed') {
            return NextResponse.json(
                { error: result.error || 'Failed to send message' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
        })
    } catch (error: any) {
        console.error('[GupshupAPI] Send error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to send message' },
            { status: 500 }
        )
    }
}
