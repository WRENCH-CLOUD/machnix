import { EstimateRepository } from '../domain/estimate.repository'

export class AddEstimateItemUseCase {
  constructor(private readonly repository: EstimateRepository) {}

  async execute(input: {
    estimateId: string
    partId?: string
    customName: string
    customPartNumber?: string
    description?: string
    qty: number
    unitPrice: number
    laborCost?: number
  }) {
    return this.repository.addItem(input.estimateId, {
      partId: input.partId,
      customName: input.customName,
      customPartNumber: input.customPartNumber,
      description: input.description,
      qty: input.qty,
      unitPrice: input.unitPrice,
      laborCost: input.laborCost ?? 0,
    })
  }
}
