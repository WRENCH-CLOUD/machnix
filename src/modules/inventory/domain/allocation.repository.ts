import { AllocationStatus, CreateAllocationInput, InventoryAllocation, UpdateAllocationInput } from './allocation.entity'

export interface AllocationRepository {
  // CRUD
  findById(id: string): Promise<InventoryAllocation | null>
  findByJobcardId(jobcardId: string): Promise<InventoryAllocation[]>
  findByItemId(itemId: string): Promise<InventoryAllocation[]>
  findByEstimateItemId(estimateItemId: string): Promise<InventoryAllocation | null>
  findByTaskId(taskId: string): Promise<InventoryAllocation | null>
  findByStatus(status: AllocationStatus): Promise<InventoryAllocation[]>
  
  // Query methods
  findReservedByJobcard(jobcardId: string): Promise<InventoryAllocation[]>
  findByItemAndJobcard(itemId: string, jobcardId: string): Promise<InventoryAllocation | null>
  
  // Mutations
  create(input: CreateAllocationInput): Promise<InventoryAllocation>
  update(id: string, input: UpdateAllocationInput): Promise<InventoryAllocation>
  
  // Status transitions
  markConsumed(id: string, quantityConsumed?: number): Promise<InventoryAllocation>
  markReleased(id: string): Promise<InventoryAllocation>
  
  // Bulk operations
  releaseAllForJobcard(jobcardId: string): Promise<number>
}
