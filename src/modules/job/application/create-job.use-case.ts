import { JobRepository } from '../domain/job.repository'
import { JobCard, JobStatus } from '../domain/job.entity'
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
  todos?: {
    id: string
    text: string
    completed: boolean
    createdAt: string
    completedAt?: string
  }[]
}

/**
 * Callback invoked after job creation for side effects (e.g., estimate creation)
 */
export type OnJobCreatedCallback = (job: JobCard, tenantId: string, createdBy?: string) => Promise<void>

/**
 * Create Job Use Case
 * Creates a new job in the system (SRP: only handles job creation)
 */
export class CreateJobUseCase {
  constructor(
    private readonly repository: JobRepository,
    private readonly onJobCreated?: OnJobCreatedCallback
  ) { }

  async execute(dto: CreateJobDTO, tenantId: string, createdBy?: string): Promise<JobCard> {
    this.validate(dto)

    const job = await this.repository.create({
      tenantId,
      jobNumber: generateFormattedId('JOB'),
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      status: 'received' as JobStatus,
      description: dto.description,
      notes: dto.notes,
      assignedMechanicId: dto.assignedMechanicId,
      details: this.buildJobDetails(dto),
      createdBy,
    })

    if (this.onJobCreated) {
      await this.onJobCreated(job, tenantId, createdBy)
    }

    return job
  }

  /**
   * Validates the job creation DTO
   */
  private validate(dto: CreateJobDTO): void {
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required')
    }
    if (!dto.vehicleId || dto.vehicleId.trim().length === 0) {
      throw new Error('Vehicle ID is required')
    }
  }

  /**
   * Builds the job details object from the DTO
   */
  private buildJobDetails(dto: CreateJobDTO): Record<string, any> {
    return {
      ...(dto.details || {}),
      complaints: dto.description,
      description: dto.description,
      serviceType: dto.serviceType,
      priority: dto.priority,
      estimatedCompletion: dto.estimatedCompletion,
      todos: dto.todos || [],
    }
  }
}

