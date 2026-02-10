import { InventoryRepository } from '../domain/inventory.repository'
import { CreateItemInput, InventoryItem } from '../domain/inventory.entity'

export class CreateItemUseCase {
  constructor(
    private inventoryRepository: InventoryRepository
  ) {}

  async execute(input: CreateItemInput): Promise<InventoryItem> {
    if (input.unitCost < 0) throw new Error('Unit cost cannot be negative')
    if (input.sellPrice < 0) throw new Error('Sell price cannot be negative')

    if (input.stockKeepingUnit) {
      const existing = await this.inventoryRepository.findByStockKeepingUnit(input.stockKeepingUnit)
      if (existing) throw new Error('Item with this Stock Keeping Unit already exists')
    }

    return this.inventoryRepository.create(input)
  }
}
