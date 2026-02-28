import { JobRepository } from '../domain/job.repository'

/**
 * Delete Job Use Case
 * Permanently deletes a job from the system
 */
export class DeleteJobUseCase {
  constructor(private readonly repository: JobRepository) {}

  async execute(jobId: string): Promise<void> {
    // Check if job exists
    const job = await this.repository.findById(jobId)
    if (!job) {
      throw new Error('Job not found')
    }

    // Determine if deletion is allowed based on status?
    // User said "delete deletes it totally", implying hard delete.
    // Usually we might restrict deleting completed jobs, but user requirements didn't specify.
    // We will stick to the basic requirement: "Delete deletes it totally".

    await this.repository.delete(jobId)
  }
}
