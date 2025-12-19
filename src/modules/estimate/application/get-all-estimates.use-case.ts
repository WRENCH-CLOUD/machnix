import { EstimateRepository } from '../domain/estimate.repository'
import { EstimateWithRelations } from '../domain/estimate.entity'

/**
 * Get All Estimates Use Case
 * Retrieves all estimates for the current tenant
 */
export class GetAllEstimatesUseCase {
  constructor(private readonly repository: EstimateRepository) {}

  async execute(): Promise<EstimateWithRelations[]> {
    return this.repository.findAll()
  }
}

