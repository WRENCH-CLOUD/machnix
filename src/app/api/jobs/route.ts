import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { GetAllJobsUseCase } from '@/modules/job/application/get-all-jobs.use-case'
import { apiGuardRead } from '@/lib/auth/api-guard'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const guard = await apiGuardRead(request)
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

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
