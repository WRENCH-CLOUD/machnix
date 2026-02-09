import { InventoryRepository } from '../domain/inventory.repository'
import { InventoryItem, UpdateItemInput } from '../domain/inventory.entity'

export class UpdateItemUseCase {
  constructor(
    private inventoryRepository: InventoryRepository
  ) {}

  async execute(id: string, input: UpdateItemInput): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findById(id)
    if (!item) throw new Error('Item not found')

    if (input.stock_keeping_unit) {
        const existing = await this.inventoryRepository.findBystock_keeping_unit(input.stock_keeping_unit)
        if (existing && existing.id !== id) throw new Error('stock_keeping_unit already in use')
    }

    return this.inventoryRepository.update(id, input)
  }
}
