/**
 * Inventory Allocation Entity
 * Tracks stock reservations and consumption for job cards
 */

export type AllocationStatus = 'reserved' | 'consumed' | 'released'

/**
 * Represents a stock allocation/reservation for a job card
 */
export interface InventoryAllocation {
  id: string
  tenantId: string
  itemId: string
  jobcardId: string
  estimateItemId?: string
  taskId?: string  // Link to job_card_tasks
  quantityReserved: number
  quantityConsumed: number
  status: AllocationStatus
  reservedAt: Date
  consumedAt?: Date
  releasedAt?: Date
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Allocation with related entity information
 */
export interface AllocationWithRelations extends InventoryAllocation {
  item?: {
    id: string
    name: string
    stockKeepingUnit?: string
  }
  jobcard?: {
    id: string
    jobNumber: string
  }
}

// ============================================================================
// Database Row Types (for Supabase responses)
// ============================================================================

export interface InventoryAllocationRow {
  id: string
  tenant_id: string
  item_id: string
  jobcard_id: string
  estimate_item_id: string | null
  task_id: string | null  // Link to job_card_tasks
  quantity_reserved: number
  quantity_consumed: number | null
  status: AllocationStatus
  reserved_at: string
  consumed_at: string | null
  released_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AllocationDbInsert {
  tenant_id: string
  item_id: string
  jobcard_id: string
  estimate_item_id?: string
  task_id?: string  // Link to job_card_tasks
  quantity_reserved: number
  quantity_consumed: number
  status: AllocationStatus
  created_by?: string
}

export interface AllocationDbUpdate {
  quantity_consumed?: number
  status?: AllocationStatus
  consumed_at?: string
  released_at?: string
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateAllocationInput {
  itemId: string
  jobcardId: string
  estimateItemId?: string
  taskId?: string  // Link to job_card_tasks
  quantityReserved: number
  createdBy?: string
}

export interface UpdateAllocationInput {
  quantityConsumed?: number
  status?: AllocationStatus
  consumedAt?: Date
  releasedAt?: Date
}

/**
 * Custom error for insufficient stock
 */
export class InsufficientStockError extends Error {
  public readonly itemId: string
  public readonly requested: number
  public readonly available: number

  constructor(itemId: string, requested: number, available: number, reason?: string) {
    super(reason || `Cannot reserve ${requested} units. Only ${available} available for item ${itemId}.`)
    this.name = 'InsufficientStockError'
    this.itemId = itemId
    this.requested = requested
    this.available = available
  }
}

/**
 * Custom error for already consumed allocation
 */
export class AllocationAlreadyConsumedError extends Error {
  public readonly allocationId: string

  constructor(allocationId: string) {
    super(`Allocation ${allocationId} has already been consumed.`)
    this.name = 'AllocationAlreadyConsumedError'
    this.allocationId = allocationId
  }
}

/**
 * Custom error for allocation not found
 */
export class AllocationNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Allocation not found: ${identifier}`)
    this.name = 'AllocationNotFoundError'
  }
}
