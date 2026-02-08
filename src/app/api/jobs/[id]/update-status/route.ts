import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository } from '@/modules/job/infrastructure/job.repository.supabase'
import { UpdateJobStatusUseCase } from '@/modules/job/application/update-job-status.use-case'
import { JobStatus } from '@/modules/job/domain/job.entity'
import { jobStatusCommand } from '@/processes/job-lifecycle/job-lifecycle.types'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'
import { SupabaseInvoiceRepository } from '@/modules/invoice/infrastructure/invoice.repository.supabase'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'
import { SupabaseCustomerRepository } from '@/modules/customer/infrastructure/customer.repository.supabase'
import { SupabaseTenantRepository } from '@/modules/tenant/infrastructure/tenant.repository.supabase'

export async function POST(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any)
    const id = (resolvedParams as { id: string }).id

    // Validate ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid job ID format' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit by user
    const rateLimitResult = checkUserRateLimit(user.id, RATE_LIMITS.WRITE, 'update-job-status')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
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

    // Validate status value
    const validStatuses: JobStatus[] = ['received', 'working', 'ready', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status value: ${status}` },
        { status: 400 }
      )
    }

    // Instantiate repositories
    const repository = new SupabaseJobRepository(supabase, tenantId)
    const estimateRepository = new SupabaseEstimateRepository(supabase, tenantId)
    const invoiceRepository = new SupabaseInvoiceRepository(supabase, tenantId)

    const useCase = new UpdateJobStatusUseCase(
      repository,
      estimateRepository,
      invoiceRepository
    )

    const cmd: jobStatusCommand = {
      job_id: id as any,
      status,
    }
    const result = await useCase.execute(cmd)

    if (!result.success) {
      // Return payment required response with 402 status
      return NextResponse.json({
        paymentRequired: true,
        invoiceId: result.invoiceId,
        balance: result.balance,
        jobNumber: result.jobNumber,
      }, { status: 402 })
    }

    return NextResponse.json(result.job)
  } catch (error: any) {
    console.error('Error updating job status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update job status' },
      { status: 400 }
    )
  }
}
