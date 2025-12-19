import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job-management/infrastructure/job.repository.supabase'
import { UpdateJobStatusUseCase } from '@/modules/job-management/application/update-job-status.use-case'
import { JobStatus } from '@/modules/job-management/domain/job.entity'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body as { status: JobStatus }
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }
    
    const repository = new SupabaseJobRepository()
    const useCase = new UpdateJobStatusUseCase(repository)
    
    const job = await useCase.execute(params.id, status)
    
    return NextResponse.json(job)
  } catch (error: any) {
    console.error('Error updating job status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update job status' },
      { status: 400 }
    )
  }
}

