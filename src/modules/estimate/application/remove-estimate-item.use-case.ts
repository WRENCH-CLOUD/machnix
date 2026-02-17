import { EstimateRepository } from '../domain/estimate.repository'
import { InventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'

export interface RemoveEstimateItemResult {
  success: boolean
  releasedStock?: number
}

export class RemoveEstimateItemUseCase {
  constructor(
    private readonly repository: EstimateRepository,
    private readonly allocationService?: InventoryAllocationService
  ) {}

  async execute(itemId: string, createdBy?: string): Promise<RemoveEstimateItemResult> {
    let releasedStock: number | undefined

    // Release any stock allocation for this estimate item BEFORE removal
    if (this.allocationService) {
      try {
        const allocation = await this.allocationService.getAllocationByEstimateItem(itemId)
        if (allocation && allocation.status === 'reserved') {
          const releaseResult = await this.allocationService.releaseForEstimateItem(itemId, createdBy)
          releasedStock = releaseResult.totalQuantityReleased
        }
      } catch (error) {
        // Log but don't fail the removal - allocation might not exist
        console.warn('Failed to release allocation for estimate item:', error)
      }
    }

    // Remove the item from the estimate
    await this.repository.removeItem(itemId)

    return {
      success: true,
      releasedStock,
    }
  }
}
