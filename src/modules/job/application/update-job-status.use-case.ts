import { JobRepository } from '../domain/job.repository'
import { JobCard, JobStatus } from '../domain/job.entity'
import { jobStatusCommand } from '@/processes/job-lifecycle/job-lifecycle.types'
import { EstimateRepository } from '@/modules/estimate/domain/estimate.repository'
import { InvoiceRepository } from '@/modules/invoice/domain/invoice.repository'
import { GenerateInvoiceFromEstimateUseCase } from '@/modules/invoice/application/generate-from-estimate.use-case'
import { CustomerRepository } from '@/modules/customer/infrastructure/customer.repository'
import { TenantRepository } from '@/modules/tenant/infrastructure/tenant.repository'
import { gupshupService } from '@/lib/integrations/gupshup.service'

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

    // GUARDRAIL: Completed jobs are locked
    if (currentStatus === 'completed') {
      throw new Error('Cannot modify a completed job')
    }

    // GUARDRAIL: Cancelled jobs are locked
    if (currentStatus === 'cancelled') {
      throw new Error('Cannot modify a cancelled job')
    }

    // Guardrail: completion requires paid invoice copied from estimate
    if (status === 'completed') {
      if (!this.estimateRepository || !this.invoiceRepository) {
        throw new Error('Cannot complete job without estimate and invoice repositories')
      }

      // Ensure an estimate exists for this job
      const estimates = await this.estimateRepository.findByJobcardId(jobId)
      const estimate = estimates[0]
      if (!estimate) {
        throw new Error('Cannot complete job without an estimate for this job')
      }

      // Ensure an invoice exists and matches the estimate; create if missing
      const invoices = await this.invoiceRepository.findByJobcardId(jobId)
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

    // Trigger WhatsApp Notification
    if (this.tenantRepository && this.customerRepository && status !== currentStatus) {
      await this.handleWhatsAppNotification(job, status, updatedJob)
    }

    return { success: true, job: updatedJob }
  }

  /**
   * Handle automated WhatsApp notifications logic
   */
  private async handleWhatsAppNotification(
    originalJob: JobCard,
    newStatus: JobStatus,
    updatedJob: JobCard
  ) {
    try {
      const settings = await this.tenantRepository!.getGupshupSettings(originalJob.tenantId)

      // Check if active and mode is auto or both
      if (!settings?.isActive) return
      if (settings.triggerMode !== 'auto' && settings.triggerMode !== 'both') return

      // Determine event type
      let event: 'job_ready' | 'job_delivered' | undefined

      if (newStatus === 'ready') {
        event = 'job_ready'
      } else if (newStatus === 'completed') {
        event = 'job_delivered'
      }

      if (!event) return

      // Fetch customer for phone number
      const customer = await this.customerRepository!.findById(originalJob.customerId)
      if (!customer?.phone) return

      // Send notification
      await gupshupService.sendEventNotification(
        settings,
        event,
        customer.phone,
        {
          customer_name: customer.name,
          job_number: originalJob.jobNumber,
          // Add other params as needed by your templates
        }
      )
    } catch (error) {
      // Log but don't fail the job update
      console.error('[UpdateJobStatusUseCase] Failed to send WhatsApp:', error)
    }
  }
}

