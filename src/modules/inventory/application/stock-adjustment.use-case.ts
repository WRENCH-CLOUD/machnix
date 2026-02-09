import { InventoryRepository } from '../domain/inventory.repository'
import { InventoryTransaction } from '../domain/inventory.entity'

export class StockAdjustmentUseCase {
  constructor(
    private inventoryRepository: InventoryRepository
  ) {}

  async execute(input: {
    itemId: string
    quantity: number
    type: 'in' | 'out'
    notes?: string
    createdBy: string
  }): Promise<InventoryTransaction> {
    const item = await this.inventoryRepository.findById(input.itemId)
    if (!item) throw new Error('Item not found')

    if (input.quantity <= 0) throw new Error('Quantity must be positive')

    await this.inventoryRepository.adjustStock(input.itemId, input.quantity, input.type)

    return this.inventoryRepository.createTransaction({
      itemId: input.itemId,
      transactionType: input.type === 'in' ? 'adjustment_in' : 'adjustment_out',
      quantity: input.quantity,
      unitCost: item.unitCost, // Using current unit cost
      referenceType: 'manual',
      notes: input.notes,
      createdBy: input.createdBy
    })
  }
}
