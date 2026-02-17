import { InventoryRepository } from '../domain/inventory.repository'
import { AllocationRepository } from '../domain/allocation.repository'
import { 
  InventoryAllocation, 
  AllocationNotFoundError 
} from '../domain/allocation.entity'

export interface ReleaseStockInput {
  allocationId?: string
  estimateItemId?: string
  taskId?: string  // Release reservation for a task
  jobcardId?: string  // Release all reservations for a job
  createdBy?: string
}

export interface ReleaseStockResult {
  releasedAllocations: InventoryAllocation[]
  totalQuantityReleased: number
}

/**
 * Release Stock Use Case
 * 
 * Releases reserved inventory back to available stock.
 * Used when:
 * - Estimate item is removed
 * - Job is cancelled
 * - Part is no longer needed
 */
export class ReleaseStockUseCase {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly allocationRepository: AllocationRepository,
  ) {}

  async execute(input: ReleaseStockInput): Promise<ReleaseStockResult> {
    const { allocationId, estimateItemId, taskId, jobcardId, createdBy } = input

    const releasedAllocations: InventoryAllocation[] = []
    let totalQuantityReleased = 0

    // Release by allocation ID
    if (allocationId) {
      const result = await this.releaseAllocation(allocationId, createdBy)
      if (result) {
        releasedAllocations.push(result)
        totalQuantityReleased += result.quantityReserved
      }
    }
    // Release by estimate item ID
    else if (estimateItemId) {
      const allocation = await this.allocationRepository.findByEstimateItemId(estimateItemId)
      if (allocation && allocation.status === 'reserved') {
        const result = await this.releaseAllocation(allocation.id, createdBy)
        if (result) {
          releasedAllocations.push(result)
          totalQuantityReleased += result.quantityReserved
        }
      }
    }
    // Release by task ID
    else if (taskId) {
      const allocation = await this.allocationRepository.findByTaskId(taskId)
      if (allocation && allocation.status === 'reserved') {
        const result = await this.releaseAllocation(allocation.id, createdBy)
        if (result) {
          releasedAllocations.push(result)
          totalQuantityReleased += result.quantityReserved
        }
      }
    }
    // Release all for job
    else if (jobcardId) {
      const allocations = await this.allocationRepository.findReservedByJobcard(jobcardId)
      
      for (const allocation of allocations) {
        const result = await this.releaseAllocation(allocation.id, createdBy)
        if (result) {
          releasedAllocations.push(result)
          totalQuantityReleased += result.quantityReserved
        }
      }
    }
    else {
      throw new Error('Must provide allocationId, estimateItemId, taskId, or jobcardId')
    }

    return {
      releasedAllocations,
      totalQuantityReleased,
    }
  }

  /**
   * Release a single allocation
   */
  private async releaseAllocation(
    allocationId: string, 
    createdBy?: string
  ): Promise<InventoryAllocation | null> {
    const allocation = await this.allocationRepository.findById(allocationId)
    
    if (!allocation) {
      throw new AllocationNotFoundError(allocationId)
    }

    // Skip if already released or consumed
    if (allocation.status !== 'reserved') {
      console.log(`[ReleaseStock] Skipping allocation ${allocationId} - status is ${allocation.status}`)
      return null
    }

    // Release the reserved stock back to inventory
    await this.inventoryRepository.unreserveStock(allocation.itemId, allocation.quantityReserved)

    // Mark allocation as released
    const updatedAllocation = await this.allocationRepository.markReleased(allocationId)

    // Create transaction record
    await this.inventoryRepository.createTransaction({
      itemId: allocation.itemId,
      transactionType: 'unreserve',
      quantity: allocation.quantityReserved,
      referenceType: 'allocation',
      referenceId: allocationId,
      createdBy,
    })

    return updatedAllocation
  }
}
