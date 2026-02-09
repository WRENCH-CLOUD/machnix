import { InventoryRepository } from '../domain/inventory.repository'
import { CreateItemInput, InventoryItem } from '../domain/inventory.entity'

export class CreateItemUseCase {
  constructor(
    private inventoryRepository: InventoryRepository
  ) {}

  async execute(input: CreateItemInput): Promise<InventoryItem> {
    if (input.unitCost < 0) throw new Error('Unit cost cannot be negative')
    if (input.sellPrice < 0) throw new Error('Sell price cannot be negative')

    if (input.sku) {
      const existing = await this.inventoryRepository.findBySku(input.sku)
      if (existing) throw new Error('Item with this SKU already exists')
    }

    return this.inventoryRepository.create(input)
  }
}
