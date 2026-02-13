import { NextRequest, NextResponse } from 'next/server'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'
import { gupshupService } from '@/lib/integrations/gupshup.service'
import { apiGuardRead, apiGuardAdmin } from '@/lib/auth/api-guard'

/**
 * GET /api/tenant/gupshup
 * Get Gupshup settings for the current tenant
 */
export async function GET(request: NextRequest) {
    try {
        const guard = await apiGuardRead(request)
        if (!guard.ok) return guard.response

        const { tenantId, supabase } = guard

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
        // SECURITY: Only tenant owners/admins can update Gupshup settings
        const guard = await apiGuardAdmin(request, 'update-gupshup')
        if (!guard.ok) return guard.response

        const { tenantId, supabase } = guard

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
