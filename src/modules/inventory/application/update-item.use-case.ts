import { InventoryRepository } from '../domain/inventory.repository'
import { InventoryItem, UpdateItemInput } from '../domain/inventory.entity'

export class UpdateItemUseCase {
  constructor(
    private inventoryRepository: InventoryRepository
  ) {}

  async execute(id: string, input: UpdateItemInput): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findById(id)
    if (!item) throw new Error('Item not found')

    if (input.sku) {
        const existing = await this.inventoryRepository.findBySku(input.sku)
        if (existing && existing.id !== id) throw new Error('SKU already in use')
    }

    return this.inventoryRepository.update(id, input)
  }
}
