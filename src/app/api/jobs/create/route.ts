import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job-management/infrastructure/job.repository.supabase'
import { CreateJobUseCase } from '@/modules/job-management/application/create-job.use-case'
import { ensureTenantContext } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const tenantId = ensureTenantContext()
    const body = await request.json()
    
    // Get user ID from session if available
    const createdBy = body.createdBy // Can be extracted from auth session
    
    const repository = new SupabaseJobRepository()
    const useCase = new CreateJobUseCase(repository)
    
    const job = await useCase.execute(body, tenantId, createdBy)
    
    return NextResponse.json(job, { status: 201 })
  } catch (error: any) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 400 }
    )
  }
}
