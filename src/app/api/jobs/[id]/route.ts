import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'
import { getRouteUser } from '@/lib/auth/get-route-user'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await (context.params as any)
        const id = (resolvedParams as { id: string }).id

        // Read user from middleware-injected headers (avoids redundant getUser() call)
        const user = getRouteUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit
        const rateLimitResult = checkUserRateLimit(user.id, RATE_LIMITS.READ, 'get-job-detail')
        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult)
        }

        const tenantId = user.tenantId
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
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
