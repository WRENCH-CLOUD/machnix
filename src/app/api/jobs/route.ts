import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { GetAllJobsUseCase } from '@/modules/job/application/get-all-jobs.use-case'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'
import { getRouteUser } from '@/lib/auth/get-route-user'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Read user from middleware-injected headers (avoids redundant getUser() call)
    const user = getRouteUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit read operations
    const rateLimitResult = checkUserRateLimit(user.id, RATE_LIMITS.READ, 'get-jobs')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const tenantId = user.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const supabase = await createClient()

    const repository = new SupabaseJobRepository(supabase, tenantId)
    const useCase = new GetAllJobsUseCase(repository)
    
    const jobs = await useCase.execute()
    
    return NextResponse.json(jobs, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      },
    })
  } catch (error: any) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
