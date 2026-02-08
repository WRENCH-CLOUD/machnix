import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { gupshupService } from '@/lib/integrations/gupshup.service'

/** GET /api/tenant/gupshup - Get WhatsApp settings for current tenant */
export async function GET(): Promise<NextResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id
    if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { data: settings, error } = await supabase
        .schema('tenant')
        .from('settings')
        .select('whatsapp_enabled')
        .eq('tenant_id', tenantId)
        .single()

    if (error) {
        console.error('[GupshupAPI] Error fetching settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({
        whatsappEnabled: settings?.whatsapp_enabled ?? false,
        platformConfigured: gupshupService.isConfigured(),
        sourceNumber: gupshupService.getSourceNumber(),
    })
}

/** PUT /api/tenant/gupshup - Update WhatsApp enabled status */
export async function PUT(request: NextRequest): Promise<NextResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id
    if (!tenantId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { whatsappEnabled } = await request.json()

    const { error } = await supabase
        .schema('tenant')
        .from('settings')
        .update({
            whatsapp_enabled: whatsappEnabled,
            updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId)

    if (error) {
        console.error('[GupshupAPI] Error updating settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
