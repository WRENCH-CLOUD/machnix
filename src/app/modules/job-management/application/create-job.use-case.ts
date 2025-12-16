import { JobRepository } from '../domain/job.repository'
import { JobCard, JobStatus } from '../domain/job.entity'

export interface CreateJobDTO {
  customerId: string
  vehicleId: string
  description?: string
  notes?: string
  assignedMechanicId?: string
  details?: Record<string, any>
}

/**
 * Create Job Use Case
 * Creates a new job in the system
 */
export class CreateJobUseCase {
  constructor(private readonly repository: JobRepository) {}

  async execute(dto: CreateJobDTO, tenantId: string, createdBy?: string): Promise<JobCard> {
    // Validation
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required')
    }
    if (!dto.vehicleId || dto.vehicleId.trim().length === 0) {
      throw new Error('Vehicle ID is required')
    }

    // Generate job number (format: JOB-YYYYMMDD-XXXX)
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const jobNumber = `JOB-${dateStr}-${randomNum}`

    return this.repository.create({
      tenantId,
      jobNumber,
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      status: 'received' as JobStatus,
      description: dto.description,
      notes: dto.notes,
      assignedMechanicId: dto.assignedMechanicId,
      details: dto.details || {},
      createdBy,
    })
  }
}

