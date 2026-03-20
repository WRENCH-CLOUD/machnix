import { NextRequest, NextResponse } from 'next/server'
import { SupabaseJobRepository, UpdateJobStatusUseCase, JobStatus } from '@/modules/job'
import { jobStatusCommand } from '@/processes/job-lifecycle/job-lifecycle.types'
import { SupabaseEstimateRepository } from '@/modules/estimate'
import { SupabaseInvoiceRepository } from '@/modules/invoice'
import { SupabaseCustomerRepository } from '@/modules/customer'
import { SupabaseTenantRepository } from '@/modules/tenant'
import { apiGuard, validateRouteId, RATE_LIMITS } from '@/lib/auth/api-guard'
import { InventoryAllocationService } from '@/modules/inventory'

export async function POST(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any)
    const id = (resolvedParams as { id: string }).id

    const idError = validateRouteId(id, 'job')
    if (idError) return idError

    const guard = await apiGuard(request, { rateLimit: RATE_LIMITS.WRITE, rateLimitAction: 'update-job-status' })
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

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
    const customerRepository = new SupabaseCustomerRepository(supabase, tenantId) // Works because it extends BaseSupabaseRepository which takes context
    const tenantRepository = new SupabaseTenantRepository(supabase) // Doesn't take tenantId context in constructor
    const allocationService = new InventoryAllocationService()

    const useCase = new UpdateJobStatusUseCase(
      repository,
      estimateRepository,
      invoiceRepository,
      customerRepository,
      tenantRepository,
      allocationService
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
