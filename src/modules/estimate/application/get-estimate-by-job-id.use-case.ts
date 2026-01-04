import { EstimateRepository } from '../domain/estimate.repository'
import { EstimateWithRelations } from '../domain/estimate.entity'

export class GetEstimateByJobIdUseCase {
  constructor(private readonly repository: EstimateRepository) {}

  async execute(jobId: string): Promise<EstimateWithRelations | null> {
    const estimates = await this.repository.findByJobcardId(jobId)
    return estimates.length > 0
      ? await this.repository.findById(estimates[0].id)
      : null
  }
}
