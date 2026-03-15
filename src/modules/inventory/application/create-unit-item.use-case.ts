import { InventoryRepository, UnitRepository } from '../domain/inventory.repository'
import { CreateItemInput, InventoryItem } from '../domain/inventory.entity'

export interface CreateUnitItemInput extends Omit<CreateItemInput, 'unitId'> {
  unitName: string
}

export class CreateUnitItemUseCase {
  constructor(
    private inventoryRepository: InventoryRepository,
    private unitRepository: UnitRepository
  ) {}

  async execute(input: CreateUnitItemInput): Promise<InventoryItem> {
    const normalizedUnitName = input.unitName.trim()
    if (!normalizedUnitName) {
      throw new Error('Unit name is required')
    }

    // Reuse SKU uniqueness rule from CreateItemUseCase
    if (input.stockKeepingUnit) {
      const existing = await this.inventoryRepository.findByStockKeepingUnit(input.stockKeepingUnit)
      if (existing) throw new Error('Item with this Stock Keeping Unit already exists')
    }

    if (input.unitCost < 0) throw new Error('Unit cost cannot be negative')
    if (input.sellPrice < 0) throw new Error('Sell price cannot be negative')

    // Find or create the unit for this tenant
    let unit = await this.unitRepository.findByName(normalizedUnitName)
    if (!unit) {
      unit = await this.unitRepository.create({ unitName: normalizedUnitName })
    }

    const createInput: CreateItemInput = {
      unitId: unit.id,
      stockKeepingUnit: input.stockKeepingUnit,
      name: input.name,
      unitCost: input.unitCost,
      sellPrice: input.sellPrice,
      stockOnHand: input.stockOnHand,
      reorderLevel: input.reorderLevel,
      metadata: input.metadata,
    }

    return this.inventoryRepository.create(createInput)
  }
}

