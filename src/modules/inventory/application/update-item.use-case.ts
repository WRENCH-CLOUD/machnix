import { InventoryRepository } from '../domain/inventory.repository'
import { InventoryItem, UpdateItemInput } from '../domain/inventory.entity'

export class UpdateItemUseCase {
  constructor(
    private inventoryRepository: InventoryRepository
  ) {}

  async execute(id: string, input: UpdateItemInput): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findById(id)
    if (!item) throw new Error('Item not found')

    const normalizedSku = typeof input.stock_keeping_unit === 'string'
      ? input.stock_keeping_unit.trim()
      : input.stock_keeping_unit

    const effectiveSku = normalizedSku === '' ? undefined : normalizedSku

    if (effectiveSku !== undefined) {
      const existing = await this.inventoryRepository.findBystock_keeping_unit(effectiveSku)
      if (existing && existing.id !== id) throw new Error('stock_keeping_unit already in use')
    }

    input.stock_keeping_unit = effectiveSku as any
    return this.inventoryRepository.update(id, input)
  }
}
