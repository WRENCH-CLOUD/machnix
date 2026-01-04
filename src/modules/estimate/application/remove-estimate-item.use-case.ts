import { EstimateRepository } from '../domain/estimate.repository'

export class RemoveEstimateItemUseCase {
  constructor(private readonly repository: EstimateRepository) {}

  async execute(itemId: string): Promise<void> {
    await this.repository.removeItem(itemId)
  }
}
