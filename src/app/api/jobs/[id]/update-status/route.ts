import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { UpdateJobStatusUseCase } from '@/modules/job/application/update-job-status.use-case'
import { JobStatus } from '@/modules/job/domain/job.entity'
import { jobStatusCommand } from '@/processes/job-lifecycle/job-lifecycle.types'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any)
    const id = (resolvedParams as { id: string }).id

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
    const { status } = body as { status: JobStatus }
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }
    
    const repository = new SupabaseJobRepository(supabase, tenantId)
    const estimateRepository = new SupabaseEstimateRepository(supabase, tenantId)
    const invoiceRepository = new SupabaseInvoiceRepository(supabase, tenantId)
    const useCase = new UpdateJobStatusUseCase(repository, estimateRepository, invoiceRepository)
    const cmd: jobStatusCommand = {
      job_id: id as any,
      status,
    }
    const job = await useCase.execute(cmd)
    
    return NextResponse.json(job)
  } catch (error: any) {
    console.error('Error updating job status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update job status' },
      { status: 400 }
    )
  }
}
