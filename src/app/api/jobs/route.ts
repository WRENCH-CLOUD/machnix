import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/app/modules/job-management/infrastructure/job.repository.supabase'
import { GetAllJobsUseCase } from '@/app/modules/job-management/application/get-all-jobs.use-case'

export async function GET() {
  try {
    const repository = new SupabaseJobRepository()
    const useCase = new GetAllJobsUseCase(repository)
    
    const jobs = await useCase.execute()
    
    return NextResponse.json(jobs)
  } catch (error: any) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
