import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { CreateJobUseCase } from '@/modules/job/application/create-job.use-case'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { CreateEstimateUseCase } from '@/modules/estimate/application/create-estimate.use-case'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const body = await request.json()
    
    // Use user ID from auth session
    const createdBy = user.id
    
    // Create the job
    const jobRepository = new SupabaseJobRepository(supabase, tenantId)
    const createJobUseCase = new CreateJobUseCase(jobRepository)
    const job = await createJobUseCase.execute(body, tenantId, createdBy)
    
    // Automatically create a draft estimate for the job
    try {
      const estimateRepository = new SupabaseEstimateRepository(supabase, tenantId)
      const createEstimateUseCase = new CreateEstimateUseCase(estimateRepository)
      
      await createEstimateUseCase.execute({
        customerId: body.customerId,
        vehicleId: body.vehicleId,
        jobcardId: job.id,
        description: body.description || 'Service estimate',
        laborTotal: 0,
        partsTotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        currency: 'INR',
      }, tenantId, createdBy)
      
      console.log('[CreateJob] Successfully created estimate for job:', job.id)
    } catch (estimateError) {
      // Log but don't fail the job creation if estimate creation fails
      console.error('[CreateJob] Failed to create estimate for job:', job.id, estimateError)
    }
    
    return NextResponse.json(job, { status: 201 })
  } catch (error: any) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 400 }
    )
  }
}
