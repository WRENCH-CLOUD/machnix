import { JobRepository } from '../domain/job.repository'
import { JobCard, JobStatus } from '../domain/job.entity'
import { EstimateRepository } from '@/modules/estimate/domain/estimate.repository'
import { CreateEstimateUseCase } from '@/modules/estimate/application/create-estimate.use-case'
import { generateFormattedId } from '@/shared/utils/generators'

export interface CreateJobDTO {
  customerId: string
  vehicleId: string
  description?: string
  notes?: string
  assignedMechanicId?: string
  details?: Record<string, any>
  serviceType?: string
  priority?: string
  estimatedCompletion?: string
}

/**
 * Create Job Use Case
 * Creates a new job in the system
 */
export class CreateJobUseCase {
  constructor(
    private readonly repository: JobRepository,
    private readonly estimateRepository?: EstimateRepository
  ) { }

  async execute(dto: CreateJobDTO, tenantId: string, createdBy?: string): Promise<JobCard> {
    // Validation
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required')
    }
    if (!dto.vehicleId || dto.vehicleId.trim().length === 0) {
      throw new Error('Vehicle ID is required')
    }

    // Generate job number (format: JOB-YYYYMMDD-XXXX)
    const jobNumber = generateFormattedId('JOB')

    const complaintText = dto.notes?.trim() || dto.description?.trim()

    const details = {
      ...(dto.details || {}),
      complaints: complaintText,
      serviceType: dto.serviceType,
      priority: dto.priority,
      estimatedCompletion: dto.estimatedCompletion,
    }

    const job = await this.repository.create({
      tenantId,
      jobNumber,
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      status: 'received' as JobStatus,
      description: complaintText,
      notes: complaintText,
      assignedMechanicId: dto.assignedMechanicId,
      details,
      createdBy,
    })

    // Guardrail: ensure every job starts with an estimate
    if (this.estimateRepository) {
      const createEstimate = new CreateEstimateUseCase(this.estimateRepository)
      await createEstimate.execute(
        {
          customerId: dto.customerId,
          vehicleId: dto.vehicleId,
          jobcardId: job.id,
          laborTotal: 0,
          partsTotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          currency: 'INR',
        },
        tenantId,
        createdBy,
      )
    }

    return job
  }
}

