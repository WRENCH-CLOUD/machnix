
export type TransactionType = 'purchase' | 'sale' | 'adjustment_in' | 'adjustment_out' | 'return' | 'usage'

export type ReferenceType = 'jobcard' | 'invoice' | 'purchase_order' | 'manual'

export interface InventoryItem {
  id: string
  tenantId: string
  sku?: string
  name: string
  description?: string
  unitCost: number
  sellPrice: number
  stockOnHand: number
  reorderLevel: number
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}

export interface InventoryTransaction {
  id: string
  tenantId: string
  itemId: string
  transactionType: TransactionType
  quantity: number
  unitCost?: number
  referenceType?: ReferenceType
  referenceId?: string
  notes?: string
  createdBy?: string
  createdAt: Date
}

// Input types
export interface CreateItemInput {
  sku?: string
  name: string
  description?: string
  unitCost: number
  sellPrice: number
  stockOnHand: number
  reorderLevel: number
  metadata?: Record<string, any>
}

export interface UpdateItemInput {
  sku?: string
  name?: string
  description?: string
  unitCost?: number
  sellPrice?: number
  stockOnHand?: number
  reorderLevel?: number
  metadata?: Record<string, any>
}

export interface CreateTransactionInput {
  itemId: string
  transactionType: TransactionType
  quantity: number
  unitCost?: number
  referenceType?: ReferenceType
  referenceId?: string
  notes?: string
  createdBy?: string
}
