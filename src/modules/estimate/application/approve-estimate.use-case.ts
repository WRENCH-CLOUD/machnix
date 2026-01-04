import { EstimateRepository } from '../domain/estimate.repository'
import { Estimate } from '../domain/estimate.entity'

/**
 * Approve Estimate Use Case
 * Approves an estimate
 */
export class ApproveEstimateUseCase {
  constructor(private readonly repository: EstimateRepository) {}

  async execute(estimateId: string, approvedBy: string): Promise<Estimate> {
    // Check if estimate exists
    const estimate = await this.repository.findById(estimateId)
    if (!estimate) {
      throw new Error('Estimate not found')
    }

    // Validate status
    if (estimate.status === 'approved') {
      throw new Error('Estimate is already approved')
    }
    if (estimate.status === 'expired') {
      throw new Error('Cannot approve an expired estimate')
    }

    return this.repository.approve(estimateId, approvedBy)
  }
}

