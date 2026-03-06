import { EstimateRepository } from '../domain/estimate.repository'
import { EstimateItem } from '../domain/estimate.entity'
import { InventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'
import { InsufficientStockError } from '@/modules/inventory/domain/allocation.entity'

export interface UpdateEstimateItemInput {
  itemId: string
  customName?: string
  customPartNumber?: string
  qty?: number
  unitPrice?: number
  laborCost?: number
  createdBy?: string
}

export interface UpdateEstimateItemResult {
  item: EstimateItem
  allocationAdjusted?: boolean
  newAllocationId?: string
}

export class UpdateEstimateItemUseCase {
  constructor(
    private readonly repository: EstimateRepository,
    private readonly allocationService?: InventoryAllocationService
  ) {}

  async execute(input: UpdateEstimateItemInput): Promise<UpdateEstimateItemResult> {
    let allocationAdjusted = false
    let newAllocationId: string | undefined

    // If quantity is changing and we have allocation service, handle allocation adjustment
    if (input.qty !== undefined && this.allocationService) {
      const existingAllocation = await this.allocationService.getAllocationByEstimateItem(input.itemId)
      
      if (existingAllocation && existingAllocation.status === 'reserved') {
        const oldQty = existingAllocation.quantityReserved
        const newQty = input.qty
        const diff = newQty - oldQty

        if (diff !== 0) {
          if (diff > 0) {
            // Need more stock - check availability first
            const canReserve = await this.allocationService.canReserve(existingAllocation.itemId, diff)
            if (!canReserve.canReserve) {
              throw new InsufficientStockError(
                existingAllocation.itemId,
                diff,
                canReserve.available,
                canReserve.reason
              )
            }
          }

          // Release existing allocation and create new one with updated quantity
          // This is simpler than trying to adjust in-place
          await this.allocationService.releaseForEstimateItem(input.itemId, input.createdBy)
          
          // Create a new allocation with the full new quantity
          const reserveResult = await this.allocationService.reserveForEstimateItem(
            input.itemId,
            existingAllocation.itemId,
            newQty,
            existingAllocation.jobcardId,
            input.createdBy
          )
          newAllocationId = reserveResult.allocation.id
          allocationAdjusted = true
        }
      }
    }

    const item = await this.repository.updateItem(input.itemId, {
      customName: input.customName,
      customPartNumber: input.customPartNumber,
      qty: input.qty,
      unitPrice: input.unitPrice,
      laborCost: input.laborCost,
    })

    return {
      item,
      allocationAdjusted,
      newAllocationId,
    }
  }
}
