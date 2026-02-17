import { 
  JobCardTask, 
  JobCardTaskWithItem,
  CreateTaskInput, 
  UpdateTaskInput, 
  UpdateTaskStatusInput,
  TaskStatus 
} from './task.entity'

/**
 * Repository interface for Job Card Tasks
 */
export interface TaskRepository {
  // Basic CRUD
  findById(id: string): Promise<JobCardTask | null>
  findByJobcardId(jobcardId: string): Promise<JobCardTask[]>
  findByJobcardIdWithItems(jobcardId: string): Promise<JobCardTaskWithItem[]>
  create(input: CreateTaskInput): Promise<JobCardTask>
  update(id: string, input: UpdateTaskInput): Promise<JobCardTask>
  updateStatus(id: string, input: UpdateTaskStatusInput): Promise<JobCardTask>
  softDelete(id: string, deletedBy?: string): Promise<void>
  
  // Bulk operations
  findByJobcardIds(jobcardIds: string[]): Promise<JobCardTask[]>
  
  // Status-specific queries
  findByStatus(status: TaskStatus): Promise<JobCardTask[]>
  findPendingApproval(jobcardId: string): Promise<JobCardTask[]>
  findInProgress(jobcardId: string): Promise<JobCardTask[]>
  
  // Inventory-related queries
  findByInventoryItemId(inventoryItemId: string): Promise<JobCardTask[]>
  findWithReservedInventory(jobcardId: string): Promise<JobCardTask[]>
  
  // Allocation linkage
  linkAllocation(taskId: string, allocationId: string): Promise<void>
  unlinkAllocation(taskId: string): Promise<void>
  
  // Estimate item linkage
  linkEstimateItem(taskId: string, estimateItemId: string): Promise<void>
  unlinkEstimateItem(taskId: string): Promise<void>
}
