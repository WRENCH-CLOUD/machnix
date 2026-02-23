import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { GetAllJobsUseCase } from '@/modules/job/application/get-all-jobs.use-case'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    // Rate limit read operations
    const rateLimitResult = checkUserRateLimit(userId, RATE_LIMITS.READ, 'get-jobs')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const supabase = await createClient()

    const repository = new SupabaseJobRepository(supabase, tenantId)
    const useCase = new GetAllJobsUseCase(repository)

    const jobs = await useCase.execute()

    return NextResponse.json(jobs, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
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
