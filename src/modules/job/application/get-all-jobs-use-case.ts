import { JobRepository } from '../domain/job-repository'
import { JobCardWithRelations } from '../domain/job-entity'

/**
 * Get All Jobs Use Case
 * Retrieves all jobs for the current tenant
 */
export class GetAllJobsUseCase {
  constructor(private readonly repository: JobRepository) {}

  async execute(): Promise<JobCardWithRelations[]> {
    return this.repository.findAll()
  }
}

