import { NextRequest, NextResponse } from 'next/server'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'
import { createClient } from '@/lib/supabase/server'
import { gupshupService } from '@/lib/integrations/gupshup.service'

/**
 * GET /api/tenant/gupshup
 * Get Gupshup settings for the current tenant
 */
export async function GET() {
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

        const repository = new SupabaseTenantRepository(supabase)
        const settings = await repository.getGupshupSettings(tenantId)

        return NextResponse.json({
            settings,
            platformConfigured: gupshupService.isConfigured(),
            // Expose the source number for display (read-only)
            sourceNumber: gupshupService.getSourceNumber(),
        })
    } catch (error: any) {
        console.error('[GupshupAPI] Error fetching settings:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/tenant/gupshup
 * Update Gupshup settings for the current tenant
 * 
 * Note: Source number is now centralized at platform level.
 * Tenants can only control: isActive (enable/disable)
 */
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenantId = user.app_metadata?.tenant_id
        const role = user.app_metadata?.role

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
        }

        // Only admins can update Gupshup settings
        if (!['tenant_owner', 'tenant_admin', 'admin'].includes(role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const body = await request.json()
        const { isActive } = body

        const repository = new SupabaseTenantRepository(supabase)
        await repository.upsertGupshupSettings(tenantId, {
            // Source number comes from platform env, not tenant
            sourceNumber: gupshupService.getSourceNumber() || '',
            isActive,
            // Manual only - no auto triggers
            triggerMode: 'manual',
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[GupshupAPI] Error updating settings:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update settings' },
            { status: 500 }
        )
    }
}
