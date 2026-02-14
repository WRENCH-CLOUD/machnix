import { NextRequest, NextResponse } from 'next/server'
import { gupshupService } from '@/lib/integrations/gupshup.service'
import { apiGuardAdmin } from '@/lib/auth/api-guard'

/**
 * POST /api/tenant/gupshup/test
 * Send a test WhatsApp message to verify configuration
 * SECURITY: Restricted to tenant owners/admins only
 */
export async function POST(request: NextRequest) {
    try {
        const guard = await apiGuardAdmin(request, 'test-gupshup')
        if (!guard.ok) return guard.response

        if (!gupshupService.isConfigured()) {
            return NextResponse.json(
                { error: 'Gupshup is not configured at platform level' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { testPhone } = body

        if (!testPhone) {
            return NextResponse.json(
                { error: 'Test phone number is required' },
                { status: 400 }
            )
        }

        // Use centralized test method - no tenant settings needed for test
        const result = await gupshupService.sendTestMessage(testPhone)

        if (result.status === 'failed') {
            return NextResponse.json(
                { error: result.error || 'Failed to send test message' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
        })
    } catch (error: any) {
        console.error('[GupshupAPI] Test message error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to send test message' },
            { status: 500 }
        )
    }
}
