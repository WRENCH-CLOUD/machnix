import { EstimateRepository } from '../domain/estimate.repository'
import { EstimateItem } from '../domain/estimate.entity'
import { InventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'
import { InsufficientStockError } from '@/modules/inventory/domain/allocation.entity'

export interface AddEstimateItemInput {
  estimateId: string
  partId?: string
  customName: string
  customPartNumber?: string
  qty: number
  unitPrice: number
  laborCost?: number
  createdBy?: string
}

export interface AddEstimateItemResult {
  item: EstimateItem
  allocationId?: string
  stockReserved?: number
}

export class AddEstimateItemUseCase {
  constructor(
    private readonly repository: EstimateRepository,
    private readonly allocationService?: InventoryAllocationService
  ) {}

  async execute(input: AddEstimateItemInput): Promise<AddEstimateItemResult> {
    // First, get the estimate to check if it's linked to a jobcard
    const estimate = await this.repository.findById(input.estimateId)
    if (!estimate) {
      throw new Error('Estimate not found')
    }

    // If part is from inventory and estimate is linked to a jobcard, reserve stock
    let allocationId: string | undefined
    let stockReserved: number | undefined

    if (input.partId && estimate.jobcardId && this.allocationService) {
      // Check if stock can be reserved (STRICT MODE - will throw if insufficient)
      const canReserve = await this.allocationService.canReserve(input.partId, input.qty)
      if (!canReserve.canReserve) {
        throw new InsufficientStockError(
          input.partId,
          input.qty,
          canReserve.available,
          canReserve.reason
        )
      }
    }

    // Add the item to the estimate
    const item = await this.repository.addItem(input.estimateId, {
      partId: input.partId,
      customName: input.customName,
      customPartNumber: input.customPartNumber,
      qty: input.qty,
      unitPrice: input.unitPrice,
      laborCost: input.laborCost ?? 0,
    })

    // Reserve stock after item is successfully created
    if (input.partId && estimate.jobcardId && this.allocationService) {
      try {
        const reserveResult = await this.allocationService.reserveForEstimateItem(
          item.id,
          input.partId,
          input.qty,
          estimate.jobcardId,
          input.createdBy
        )
        allocationId = reserveResult.allocation.id
        stockReserved = reserveResult.allocation.quantityReserved
      } catch (error) {
        // If reservation fails, we should remove the item to maintain consistency
        // This is a best-effort cleanup
        console.error('Failed to reserve stock after adding estimate item:', error)
        try {
          await this.repository.removeItem(item.id)
        } catch (cleanupError) {
          console.error('Failed to cleanup estimate item after reservation failure:', cleanupError)
        }
        throw error
      }
    }

    return {
      item,
      allocationId,
      stockReserved,
    }
  }
}
