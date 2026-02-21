import { InventoryRepository } from '../domain/inventory.repository'
import { AllocationRepository } from '../domain/allocation.repository'
import { 
  InventoryAllocation, 
  AllocationAlreadyConsumedError,
  AllocationNotFoundError 
} from '../domain/allocation.entity'

export interface ConsumeStockInput {
  allocationId?: string
  jobcardId?: string
  itemId?: string
  quantity?: number  // Optional: defaults to full reserved quantity
  createdBy?: string
}

export interface ConsumeStockResult {
  allocation: InventoryAllocation
  quantityConsumed: number
  transactionId: string
}

/**
 * Consume Stock Use Case
 * 
 * Consumes reserved inventory when a part is actually used (todo marked as "changed").
 * This decreases both stock_on_hand and stock_reserved.
 */
export class ConsumeStockUseCase {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly allocationRepository: AllocationRepository,
  ) {}

  async execute(input: ConsumeStockInput): Promise<ConsumeStockResult> {
    const { allocationId, jobcardId, itemId, quantity, createdBy } = input

    // Find the allocation
    let allocation: InventoryAllocation | null = null

    if (allocationId) {
      allocation = await this.allocationRepository.findById(allocationId)
    } else if (jobcardId && itemId) {
      allocation = await this.allocationRepository.findByItemAndJobcard(itemId, jobcardId)
    }

    if (!allocation) {
      throw new AllocationNotFoundError(
        allocationId || `item:${itemId} jobcard:${jobcardId}`
      )
    }

    // Validate allocation status
    if (allocation.status === 'consumed') {
      throw new AllocationAlreadyConsumedError(allocation.id)
    }

    if (allocation.status === 'released') {
      throw new Error(`Allocation ${allocation.id} has been released and cannot be consumed`)
    }

    // Determine quantity to consume
    const quantityToConsume = quantity ?? allocation.quantityReserved

    if (quantityToConsume > allocation.quantityReserved) {
      throw new Error(
        `Cannot consume ${quantityToConsume} units. Only ${allocation.quantityReserved} reserved.`
      )
    }

    // Consume the reserved stock from inventory
    await this.inventoryRepository.consumeReservedStock(allocation.itemId, quantityToConsume)

    // Mark allocation as consumed
    const updatedAllocation = await this.allocationRepository.markConsumed(
      allocation.id, 
      quantityToConsume
    )

    // Create transaction record
    const transaction = await this.inventoryRepository.createTransaction({
      itemId: allocation.itemId,
      transactionType: 'usage',
      quantity: quantityToConsume,
      referenceType: 'jobcard',
      referenceId: allocation.jobcardId,
      createdBy,
    })

    return {
      allocation: updatedAllocation,
      quantityConsumed: quantityToConsume,
      transactionId: transaction.id,
    }
  }
}
