import { CreateItemInput, CreateTransactionInput, InventoryItem, InventoryTransaction, ReferenceType, UpdateItemInput } from './inventory.entity'

export interface InventoryRepository {
  // Items CRUD
  findAll(): Promise<InventoryItem[]>
  findById(id: string): Promise<InventoryItem | null>
  findBySku(sku: string): Promise<InventoryItem | null>
  create(input: CreateItemInput): Promise<InventoryItem>
  update(id: string, input: UpdateItemInput): Promise<InventoryItem>
  softDelete(id: string, deletedBy: string): Promise<void>

  // Stock Operations
  adjustStock(itemId: string, quantity: number, type: 'in' | 'out'): Promise<void>

  // Transactions
  findTransactionsByItem(itemId: string): Promise<InventoryTransaction[]>
  findTransactionsByReference(type: ReferenceType, id: string): Promise<InventoryTransaction[]>
  createTransaction(input: CreateTransactionInput): Promise<InventoryTransaction>
}
