import { InventoryRepository } from '../domain/inventory.repository'
import { CreateItemInput, InventoryItem } from '../domain/inventory.entity'

export interface BulkImportResult {
  created: InventoryItem[]
  skipped: { row: number; name: string; reason: string }[]
  errors: { row: number; name: string; error: string }[]
}

export class BulkImportItemsUseCase {
  constructor(
    private inventoryRepository: InventoryRepository
  ) {}

  async execute(items: (CreateItemInput & { _row: number })[]): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      created: [],
      skipped: [],
      errors: [],
    }

    for (const item of items) {
      const { _row, ...rawInput } = item
      try {
        // Sanitize: trim name, clamp negatives, fallback NaN to 0
        const input: CreateItemInput = {
          name: (rawInput.name || '').trim(),
          stockKeepingUnit: rawInput.stockKeepingUnit?.trim() || undefined,
          unitCost: Math.max(0, Number(rawInput.unitCost) || 0),
          sellPrice: Math.max(0, Number(rawInput.sellPrice) || 0),
          stockOnHand: Math.max(0, Math.floor(Number(rawInput.stockOnHand) || 0)),
          reorderLevel: Math.max(0, Math.floor(Number(rawInput.reorderLevel) || 0)),
        }

        // Validate: name is required
        if (!input.name) {
          result.errors.push({ row: _row, name: '(empty)', error: 'Name is required' })
          continue
        }

        // Check for duplicate SKU
        if (input.stockKeepingUnit) {
          const existing = await this.inventoryRepository.findByStockKeepingUnit(input.stockKeepingUnit)
          if (existing) {
            result.skipped.push({ row: _row, name: input.name, reason: `SKU "${input.stockKeepingUnit}" already exists` })
            continue
          }
        }

        const created = await this.inventoryRepository.create(input)
        result.created.push(created)
      } catch (error: any) {
        result.errors.push({ row: _row, name: rawInput.name || '(unknown)', error: error.message || 'Unknown error' })
      }
    }

    return result
  }
}
