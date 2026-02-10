import { InventoryRepository } from '../domain/inventory.repository'
import { InventoryItem, UpdateItemInput } from '../domain/inventory.entity'

export class UpdateItemUseCase {
  constructor(
    private inventoryRepository: InventoryRepository
  ) {}

  async execute(id: string, input: UpdateItemInput): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findById(id)
    if (!item) throw new Error('Item not found')

    const normalizedSku = typeof input.stockKeepingUnit === 'string'
      ? input.stockKeepingUnit.trim()
      : input.stockKeepingUnit

    const effectiveSku = normalizedSku === '' ? undefined : normalizedSku

    if (effectiveSku !== undefined) {
      const existing = await this.inventoryRepository.findByStockKeepingUnit(effectiveSku)
      if (existing && existing.id !== id) throw new Error('stockKeepingUnit already in use')
    }

    input.stockKeepingUnit = effectiveSku as any
    return this.inventoryRepository.update(id, input)
  }
}
