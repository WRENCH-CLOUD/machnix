import { JobCard, JobStatus } from '../domain/job.entity'
import { JobRepository } from '../domain/job.repository'
import { jobStatusCommand } from '@/processes/job-lifecycle/job-lifecycle.types'
import { EstimateRepository } from '@/modules/estimate/domain/estimate.repository'
import { InvoiceRepository } from '@/modules/invoice/domain/invoice.repository'
import { GenerateInvoiceFromEstimateUseCase } from '@/modules/invoice/application/generate-from-estimate.use-case'
import { CustomerRepository } from '@/modules/customer/infrastructure/customer.repository'
import { TenantRepository } from '@/modules/tenant/infrastructure/tenant.repository'
import { InventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'

/**
 * Result types for UpdateJobStatusUseCase
 */
export type UpdateJobStatusResult =
  | { success: true; job: JobCard }
  | { success: false; paymentRequired: true; invoiceId: string; balance: number; jobNumber: string }

/**
 * Valid status transitions for job lifecycle
 * received <-> working <-> ready -> completed
 * Any status can go to cancelled (except completed)
 */
const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  'received': ['received', 'working', 'cancelled'],
  'working': ['received', 'working', 'ready', 'cancelled'],
  'ready': ['working', 'ready', 'completed', 'cancelled'],
  'completed': ['completed'], // Locked - cannot change
  'cancelled': ['cancelled'], // Locked - cannot change
}

/**
 * Validates if a status transition is allowed
 */
function isValidTransition(fromStatus: JobStatus, toStatus: JobStatus): boolean {
  return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false
}

/**
 * Update Job Status Use Case
 * Updates the status of a job with comprehensive guardrails
 */
export class UpdateJobStatusUseCase {
  constructor(
    private readonly repository: JobRepository,
    private readonly estimateRepository?: EstimateRepository,
    private readonly invoiceRepository?: InvoiceRepository,
    private readonly customerRepository?: CustomerRepository,
    private readonly tenantRepository?: TenantRepository,
    private readonly allocationService?: InventoryAllocationService,
  ) { }

  async execute(jobStatusCommand: jobStatusCommand): Promise<UpdateJobStatusResult> {
    // Validate status transition
    const { job_id: jobId, status } = jobStatusCommand
    const validStatuses: JobStatus[] = ['received', 'working', 'ready', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid job status: ${status}`)
    }

    // Check if job exists
    const job = await this.repository.findById(jobId)
    if (!job) {
      throw new Error('Job not found')
    }

    // GUARDRAIL: Validate status transition
    const currentStatus = job.status as JobStatus
    if (!isValidTransition(currentStatus, status)) {
      throw new Error(`Invalid status transition: Cannot change from '${currentStatus}' to '${status}'`)
    }

    // GUARDRAIL: Completed/Cancelled jobs are locked
    if (currentStatus === 'completed') {
      throw new Error('Cannot modify a completed job')
    }
    if (currentStatus === 'cancelled') {
      throw new Error('Cannot modify a cancelled job')
    }

    // Guardrail: completion requires paid invoice copied from estimate
    if (status === 'completed') {
      const completionCheck = await this.ensureCompletionRequirements(job)
      if (!completionCheck.success) {
        return completionCheck
      }

      // Consume all reserved inventory allocations when job is completed
      if (this.allocationService) {
        try {
          const consumeResult = await this.allocationService.consumeAllForJob(jobId)
          console.log(`[UpdateJobStatusUseCase] Consumed ${consumeResult.totalQuantityConsumed} units for completed job ${jobId}`)
        } catch (error) {
          console.error('[UpdateJobStatusUseCase] Failed to consume allocations:', error)
          // Don't block completion if consumption fails - log and continue
        }
      }
    }

    // Release all inventory allocations when job is cancelled
    if (status === 'cancelled' && this.allocationService) {
      try {
        const releaseResult = await this.allocationService.releaseForJob(jobId)
        console.log(`[UpdateJobStatusUseCase] Released ${releaseResult.totalQuantityReleased} units for cancelled job ${jobId}`)
      } catch (error) {
        console.error('[UpdateJobStatusUseCase] Failed to release allocations:', error)
        // Don't block cancellation if release fails
      }
    }

    // Update timestamps based on status
    const updates: Partial<JobCard> = { status }
    if (status === 'working' && !job.startedAt) {
      updates.startedAt = new Date()
    }
    if (status === 'completed' && !job.completedAt) {
      updates.completedAt = new Date()
    }

    const updatedJob = await this.repository.update(jobId, updates)

    return { success: true, job: updatedJob }
  }

  /**
   * helper to ensure job completion requirements are met
   * requires estimate and paid invoice
   */
  private async ensureCompletionRequirements(job: JobCard): Promise<UpdateJobStatusResult | { success: true }> {
    if (!this.estimateRepository || !this.invoiceRepository) {
      throw new Error('Cannot complete job without estimate and invoice repositories')
    }

    // Ensure an estimate exists for this job
    const estimates = await this.estimateRepository.findByJobcardId(job.id)
    const estimate = estimates[0]
    if (!estimate) {
      throw new Error('Cannot complete job without an estimate for this job')
    }

    // Ensure an invoice exists and matches the estimate; create if missing
    const invoices = await this.invoiceRepository.findByJobcardId(job.id)
    let invoiceWithRelations = invoices.length
      ? await this.invoiceRepository.findById(invoices[0].id)
      : null

    if (!invoiceWithRelations) {
      const generator = new GenerateInvoiceFromEstimateUseCase(this.invoiceRepository, this.estimateRepository)
      const newInvoice = await generator.execute(estimate.id, job.tenantId)
      invoiceWithRelations = await this.invoiceRepository.findById(newInvoice.id)
    }

    if (!invoiceWithRelations) {
      throw new Error('Failed to load invoice for completion guardrail')
    }

    // Align invoice monetary values with the estimate so it is an exact copy
    const needsSync =
      invoiceWithRelations.subtotal !== estimate.subtotal ||
      invoiceWithRelations.taxAmount !== estimate.taxAmount ||
      invoiceWithRelations.discountAmount !== estimate.discountAmount ||
      invoiceWithRelations.totalAmount !== estimate.totalAmount

    if (needsSync) {
      const updated = await this.invoiceRepository.update(invoiceWithRelations.id, {
        subtotal: estimate.subtotal,
        taxAmount: estimate.taxAmount,
        discountAmount: estimate.discountAmount,
        totalAmount: estimate.totalAmount,
        metadata: {
          ...(invoiceWithRelations.metadata || {}),
          source: 'estimate',
          estimateNumber: estimate.estimateNumber,
        },
      })
      invoiceWithRelations = await this.invoiceRepository.findById(updated.id)
    }

    if (!invoiceWithRelations) {
      throw new Error('Failed to reload invoice after sync')
    }

    const payments = invoiceWithRelations.payments || []
    // Check if invoice is paid - status should be 'paid' OR balance should be 0 (or both)
    const isPaid = invoiceWithRelations.status === 'paid' ||
      (invoiceWithRelations.balance !== undefined && invoiceWithRelations.balance !== null && invoiceWithRelations.balance <= 0)

    if (!isPaid) {
      return {
        success: false,
        paymentRequired: true,
        invoiceId: invoiceWithRelations.id,
        balance: invoiceWithRelations.balance ?? invoiceWithRelations.totalAmount ?? 0,
        jobNumber: job.jobNumber,
      }
    }

    return { success: true }
  }
}



