/**
 * Job Card Task Entity
 * Represents a task/todo item within a job card with inventory linkage
 */

/**
 * Action types determine inventory behavior
 * - NO_CHANGE: Inspection only, no action taken
 * - REPAIRED: Part/component was repaired (no inventory impact)
 * - REPLACED: Part was replaced (inventory consumption required)
 */
export type TaskActionType = 'NO_CHANGE' | 'REPAIRED' | 'REPLACED'

/**
 * Task lifecycle status
 * - DRAFT: Task created but not yet confirmed
 * - APPROVED: Customer approved, inventory reserved
 * - IN_PROGRESS: Mechanic working on task
 * - COMPLETED: Task done, inventory consumed (if REPLACED)
 * - CANCELLED: Task cancelled, reservations released
 */
export type TaskStatus = 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

/**
 * Job Card Task Entity
 */
export interface JobCardTask {
  id: string
  tenantId: string
  jobcardId: string
  
  // Task description
  taskName: string
  description?: string
  
  // Action type determines inventory behavior
  actionType: TaskActionType
  
  // Inventory linkage (only when actionType = 'REPLACED')
  inventoryItemId?: string
  qty?: number
  
  // Price snapshot (immutable after approval)
  unitPriceSnapshot?: number
  laborCostSnapshot: number
  taxRateSnapshot: number
  
  // Task lifecycle status
  taskStatus: TaskStatus
  
  // Allocation reference (for inventory reservation tracking)
  allocationId?: string
  
  // Estimate item linkage (for customer-facing estimates)
  estimateItemId?: string
  
  // Audit fields
  createdBy?: string
  approvedBy?: string
  approvedAt?: Date
  completedBy?: string
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  
  // Soft delete
  deletedAt?: Date
  deletedBy?: string
}

/**
 * Task with inventory item details (for display)
 */
export interface JobCardTaskWithItem extends JobCardTask {
  inventoryItem?: {
    id: string
    name: string
    stockKeepingUnit?: string
    stockOnHand: number
    stockReserved: number
    stockAvailable: number
  }
}

/**
 * Computed properties for a task
 */
export function getTaskTotal(task: JobCardTask): number {
  if (task.actionType !== 'REPLACED' || !task.unitPriceSnapshot || !task.qty) {
    return task.laborCostSnapshot || 0
  }
  const partsTotal = task.unitPriceSnapshot * task.qty
  const taxAmount = partsTotal * (task.taxRateSnapshot / 100)
  return partsTotal + taxAmount + (task.laborCostSnapshot || 0)
}

export function getTaskPartsTotal(task: JobCardTask): number {
  if (task.actionType !== 'REPLACED' || !task.unitPriceSnapshot || !task.qty) {
    return 0
  }
  return task.unitPriceSnapshot * task.qty
}

export function getTaskLaborTotal(task: JobCardTask): number {
  return task.laborCostSnapshot || 0
}

export function getTaskTaxAmount(task: JobCardTask): number {
  const partsTotal = getTaskPartsTotal(task)
  return partsTotal * (task.taxRateSnapshot / 100)
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateTaskInput {
  jobcardId: string
  taskName: string
  description?: string
  actionType: TaskActionType
  inventoryItemId?: string
  qty?: number
  unitPriceSnapshot?: number
  laborCostSnapshot?: number
  taxRateSnapshot?: number
  createdBy?: string
}

export interface UpdateTaskInput {
  taskName?: string
  description?: string
  actionType?: TaskActionType
  inventoryItemId?: string
  qty?: number
  unitPriceSnapshot?: number
  laborCostSnapshot?: number
  taxRateSnapshot?: number
}

export interface UpdateTaskStatusInput {
  taskStatus: TaskStatus
  completedBy?: string
  approvedBy?: string
}

// ============================================================================
// Database Row Type (for repository mapping)
// ============================================================================

export interface JobCardTaskRow {
  id: string
  tenant_id: string
  jobcard_id: string
  task_name: string
  description: string | null
  action_type: TaskActionType
  inventory_item_id: string | null
  qty: number | null
  unit_price_snapshot: number | null
  labor_cost_snapshot: number | null
  tax_rate_snapshot: number | null
  task_status: TaskStatus
  allocation_id: string | null
  estimate_item_id: string | null
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  completed_by: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  deleted_by: string | null
}
