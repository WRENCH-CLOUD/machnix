import { JobRepository } from '../domain/job.repository';
import { JobCard } from '../domain/job.entity';

export class AssignMechanicUseCase {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(jobId: string, mechanicId: string): Promise<JobCard> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // We can add validation here if needed, e.g., checking if mechanic exists and is active
    
    return this.jobRepository.update(jobId, {
      assignedMechanicId: mechanicId,
    });
  }
}
