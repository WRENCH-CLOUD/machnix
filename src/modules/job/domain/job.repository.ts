import { JobCard, JobCardWithRelations, JobStatus } from './job.entity'

/**
 * Job Repository Interface
 * Defines the contract for job data operations
 */
export interface JobRepository {
  /**
   * Find all jobs for the current tenant
   */
  findAll(): Promise<JobCardWithRelations[]>

  /**
   * Find jobs by status
   */
  findByStatus(status: JobStatus): Promise<JobCardWithRelations[]>

  /**
   * Find a job by ID
   */
  findById(id: string): Promise<JobCardWithRelations | null>

  /**
   * Find jobs by customer ID
   */
  findByCustomerId(customerId: string): Promise<JobCard[]>

  /**
   * Find jobs by vehicle ID
   */
  findByVehicleId(vehicleId: string): Promise<JobCard[]>

  /**
   * Find jobs assigned to a mechanic
   */
  findByMechanicId(mechanicId: string): Promise<JobCard[]>

  /**
   * Create a new job
   */
  create(job: Omit<JobCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobCard>

  /**
   * Update an existing job
   */
  update(id: string, job: Partial<JobCard>): Promise<JobCard>

  /**
   * Update job status
   */
  updateStatus(id: string, status: JobStatus): Promise<JobCard>

  /**
   * Delete a job (soft delete)
   */
  delete(id: string): Promise<void>
}

