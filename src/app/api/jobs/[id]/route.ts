import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await (context.params as any)
        const id = (resolvedParams as { id: string }).id

        const auth = requireAuth(request)
        if (isAuthError(auth)) return auth
        const { userId, tenantId } = auth

        // Rate limit
        const rateLimitResult = checkUserRateLimit(userId, RATE_LIMITS.READ, 'get-job-detail')
        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult)
        }

        const supabase = await createClient()

        const repository = new SupabaseJobRepository(supabase, tenantId)
        const job = await repository.findById(id)

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        return NextResponse.json(job)
    } catch (error: any) {
        console.error('Error fetching job details:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
