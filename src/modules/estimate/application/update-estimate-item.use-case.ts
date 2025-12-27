import { EstimateRepository } from '../domain/estimate.repository'

export class UpdateEstimateItemUseCase {
  constructor(private readonly repository: EstimateRepository) {}

  async execute(input: {
    itemId: string
    customName?: string
    customPartNumber?: string
    description?: string
    qty?: number
    unitPrice?: number
    laborCost?: number
  }) {
    return this.repository.updateItem(input.itemId, {
      customName: input.customName,
      customPartNumber: input.customPartNumber,
      description: input.description,
      qty: input.qty,
      unitPrice: input.unitPrice,
      laborCost: input.laborCost,
    })
  }
}
