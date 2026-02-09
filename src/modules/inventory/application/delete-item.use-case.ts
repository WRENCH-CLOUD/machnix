import { InventoryRepository } from '../domain/inventory.repository'

export class DeleteItemUseCase {
  constructor(
    private inventoryRepository: InventoryRepository
  ) {}

  async execute(id: string, deletedBy: string): Promise<void> {
    const item = await this.inventoryRepository.findById(id)
    if (!item) throw new Error('Item not found')

    await this.inventoryRepository.softDelete(id, deletedBy)
  }
}
