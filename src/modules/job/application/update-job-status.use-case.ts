import { JobRepository } from '../domain/job.repository'
import { JobCard, JobStatus } from '../domain/job.entity'
import { jobStatusCommand } from '@/processes/job-lifecycle/job-lifecycle.types'
import { EstimateRepository } from '@/modules/estimate/domain/estimate.repository'
import { InvoiceRepository } from '@/modules/invoice/domain/invoice.repository'
import { GenerateInvoiceFromEstimateUseCase } from '@/modules/invoice/application/generate-from-estimate.use-case'
/**
 * Update Job Status Use Case
 * Updates the status of a job
 */
export class UpdateJobStatusUseCase {
  constructor(
    private readonly repository: JobRepository,
    private readonly estimateRepository?: EstimateRepository,
    private readonly invoiceRepository?: InvoiceRepository,
  ) {}

  async execute(jobStatusCommand : jobStatusCommand): Promise<JobCard> {
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

      const payments = invoiceWithRelations?.payments || []
      const isPaid = invoiceWithRelations.status === 'paid' && invoiceWithRelations.balance === 0
      const hasRecordedPayment = payments.length > 0

      if (!isPaid || !hasRecordedPayment) {
        throw new Error('Cannot complete job until the invoice is fully paid and a payment transaction is recorded')
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

    return this.repository.update(jobId, updates)
  }
}

