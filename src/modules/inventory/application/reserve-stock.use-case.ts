import { InventoryRepository } from '../domain/inventory.repository'
import { AllocationRepository } from '../domain/allocation.repository'
import { 
  InventoryAllocation, 
  InsufficientStockError,
  CreateAllocationInput 
} from '../domain/allocation.entity'
import { getStockAvailable } from '../domain/inventory.entity'

export interface ReserveStockInput {
  itemId: string
  jobcardId: string
  quantity: number
  estimateItemId?: string
  createdBy?: string
}

export interface ReserveStockResult {
  allocation: InventoryAllocation
  stockRemaining: number
  stockAvailable: number
}

/**
 * Reserve Stock Use Case
 * 
 * Reserves inventory for a job card. This creates an allocation record
 * and increments the stock_reserved field on the inventory item.
 * 
 * STRICT MODE: Will throw InsufficientStockError if not enough stock available.
 */
export class ReserveStockUseCase {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly allocationRepository: AllocationRepository,
  ) {}

  async execute(input: ReserveStockInput): Promise<ReserveStockResult> {
    const { itemId, jobcardId, quantity, estimateItemId, createdBy } = input

    // Validation
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    // Get current item state
    const item = await this.inventoryRepository.findById(itemId)
    if (!item) {
      throw new Error(`Inventory item ${itemId} not found`)
    }

    // Calculate available stock (strict mode)
    const available = getStockAvailable(item)
    
    if (available < quantity) {
      throw new InsufficientStockError(itemId, quantity, available)
    }

    // Check if allocation already exists for this estimate item
    if (estimateItemId) {
      const existingAllocation = await this.allocationRepository.findByEstimateItemId(estimateItemId)
      if (existingAllocation && existingAllocation.status === 'reserved') {
        throw new Error(`Stock already reserved for estimate item ${estimateItemId}`)
      }
    }

    // Create allocation record
    const allocationInput: CreateAllocationInput = {
      itemId,
      jobcardId,
      quantityReserved: quantity,
      estimateItemId,
      createdBy,
    }
    
    const allocation = await this.allocationRepository.create(allocationInput)

    // Update inventory reserved stock
    await this.inventoryRepository.reserveStock(itemId, quantity)

    // Create transaction record
    await this.inventoryRepository.createTransaction({
      itemId,
      transactionType: 'reserve',
      quantity,
      referenceType: 'allocation',
      referenceId: allocation.id,
      createdBy,
    })

    // Get updated item state
    const updatedItem = await this.inventoryRepository.findById(itemId)
    
    return {
      allocation,
      stockRemaining: updatedItem?.stockOnHand ?? 0,
      stockAvailable: updatedItem ? getStockAvailable(updatedItem) : 0,
    }
  }
}
