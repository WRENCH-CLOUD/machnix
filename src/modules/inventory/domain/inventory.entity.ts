
export type TransactionType = 'purchase' | 'sale' | 'adjustment_in' | 'adjustment_out' | 'return' | 'usage' | 'reserve' | 'unreserve'

export type ReferenceType = 'jobcard' | 'invoice' | 'purchase_order' | 'manual' | 'allocation'

export interface InventoryItem {
  id: string
  tenantId: string
  stockKeepingUnit?: string
  name: string
  unitCost: number
  sellPrice: number
  stockOnHand: number
  stockReserved: number
  reorderLevel: number
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}

/**
 * Calculate available stock (stock on hand minus reserved)
 */
export function getStockAvailable(item: InventoryItem): number {
  return item.stockOnHand - (item.stockReserved || 0)
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
  createdBy?: string
  createdAt: Date
}

// Input types
export interface CreateItemInput {
  stockKeepingUnit?: string
  name: string
  unitCost: number
  sellPrice: number
  stockOnHand: number
  reorderLevel: number
  metadata?: Record<string, any>
}

export interface UpdateItemInput {
  stockKeepingUnit?: string
  name?: string
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
  createdBy?: string
}

// ============================================================================
// Delta Sync Types (for efficient client-side inventory caching)
// ============================================================================

/**
 * Lightweight inventory item for client-side snapshot
 * Contains only fields needed for autofill/display
 */
export interface InventorySnapshotItem {
  id: string
  name: string
  stockKeepingUnit?: string
  unitCost: number
  sellPrice: number
  stockOnHand: number
  stockReserved: number
  stockAvailable: number  // computed: stockOnHand - stockReserved
  reorderLevel: number
  updatedAt: string       // ISO timestamp for delta comparison
}

/**
 * Full inventory snapshot response (initial load)
 */
export interface InventorySnapshotResponse {
  items: InventorySnapshotItem[]
  syncedAt: string        // Server timestamp for next delta request
  totalCount: number
}

/**
 * Delta sync response (incremental updates)
 */
export interface InventoryDeltaResponse {
  /** Items that were created or updated since the last sync */
  upserted: InventorySnapshotItem[]
  /** IDs of items that were soft-deleted since the last sync */
  deleted: string[]
  /** Server timestamp for next delta request */
  syncedAt: string
  /** Whether client should do a full resync (e.g., too many changes) */
  requiresFullSync: boolean
}

/**
 * Client-side inventory cache structure
 */
export interface InventoryCache {
  /** Map of items keyed by ID for O(1) lookups and updates */
  items: Map<string, InventorySnapshotItem>
  /** Last sync timestamp for delta requests */
  lastSyncedAt: string
  /** Cache version for conflict detection */
  version: number
  /** Whether cache is fully initialized */
  initialized: boolean
}

/**
 * Threshold for forcing full sync instead of delta
 * If more than this percentage of items changed, just refetch all
 */
export const DELTA_SYNC_THRESHOLD_PERCENT = 30
