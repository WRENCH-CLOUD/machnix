import { JobRepository } from '../domain/job.repository'
import { JobCard, JobStatus } from '../domain/job.entity'
import { jobStatusCommand } from '@/processes/job-lifecycle/job-lifecycle.types'
/**
 * Update Job Status Use Case
 * Updates the status of a job
 */
export class UpdateJobStatusUseCase {
  constructor(private readonly repository: JobRepository) {}

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

