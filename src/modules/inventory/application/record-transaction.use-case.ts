import { InventoryRepository } from '../domain/inventory.repository'
import { CreateTransactionInput, InventoryTransaction } from '../domain/inventory.entity'

export class RecordTransactionUseCase {
  constructor(
    private inventoryRepository: InventoryRepository
  ) {}

  async execute(input: CreateTransactionInput): Promise<InventoryTransaction> {
    const item = await this.inventoryRepository.findById(input.itemId)
    if (!item) throw new Error('Item not found')

    if (input.quantity <= 0) throw new Error('Quantity must be positive')

    // Determine stock adjustment direction based on transaction type
    let adjustmentType: 'in' | 'out' | null = null

    switch (input.transactionType) {
      case 'purchase':
      case 'adjustment_in':
      case 'return':
        adjustmentType = 'in'
        break
      case 'sale':
      case 'adjustment_out':
      case 'usage':
        adjustmentType = 'out'
        break
    }

    if (adjustmentType) {
       await this.inventoryRepository.adjustStock(input.itemId, input.quantity, adjustmentType)
    }

    return this.inventoryRepository.createTransaction(input)
  }
}
