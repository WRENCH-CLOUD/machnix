import { InventoryRepository } from '../domain/inventory.repository'
import { InventoryItem } from '../domain/inventory.entity'

export class GetItemsUseCase {
  constructor(
    private inventoryRepository: InventoryRepository
  ) {}

  async execute(): Promise<InventoryItem[]> {
    return this.inventoryRepository.findAll()
  }
}
