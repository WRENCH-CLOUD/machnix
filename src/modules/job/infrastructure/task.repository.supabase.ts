import { BaseSupabaseRepository } from '@/shared/infrastructure/base-supabase.repository'
import { TaskRepository } from '../domain/task.repository'
import {
  JobCardTask,
  JobCardTaskWithItem,
  JobCardTaskRow,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  TaskStatus,
  TaskActionType,
} from '../domain/task.entity'

/**
 * Supabase implementation of TaskRepository
 */
export class SupabaseTaskRepository extends BaseSupabaseRepository<JobCardTask, JobCardTaskRow> implements TaskRepository {

  protected toDomain(row: JobCardTaskRow): JobCardTask {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      jobcardId: row.jobcard_id,
      taskName: row.task_name,
      description: row.description ?? undefined,
      actionType: row.action_type as TaskActionType,
      inventoryItemId: row.inventory_item_id ?? undefined,
      qty: row.qty ?? undefined,
      unitPriceSnapshot: row.unit_price_snapshot ? Number(row.unit_price_snapshot) : undefined,
      laborCostSnapshot: row.labor_cost_snapshot ? Number(row.labor_cost_snapshot) : 0,
      taxRateSnapshot: row.tax_rate_snapshot ? Number(row.tax_rate_snapshot) : 0,
      taskStatus: row.task_status as TaskStatus,
      allocationId: row.allocation_id ?? undefined,
      createdBy: row.created_by ?? undefined,
      approvedBy: row.approved_by ?? undefined,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      completedBy: row.completed_by ?? undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      deletedBy: row.deleted_by ?? undefined,
    }
  }

  protected toDatabase(entity: Omit<JobCardTask, 'id' | 'createdAt' | 'updatedAt'>): JobCardTaskRow {
    return {
      id: '', // placeholder - not used for inserts
      tenant_id: entity.tenantId,
      jobcard_id: entity.jobcardId,
      task_name: entity.taskName,
      description: entity.description ?? null,
      action_type: entity.actionType,
      inventory_item_id: entity.inventoryItemId ?? null,
      qty: entity.qty ?? null,
      unit_price_snapshot: entity.unitPriceSnapshot ?? null,
      labor_cost_snapshot: entity.laborCostSnapshot ?? null,
      tax_rate_snapshot: entity.taxRateSnapshot ?? null,
      task_status: entity.taskStatus,
      allocation_id: entity.allocationId ?? null,
      created_by: entity.createdBy ?? null,
      approved_by: entity.approvedBy ?? null,
      approved_at: entity.approvedAt?.toISOString() ?? null,
      completed_by: entity.completedBy ?? null,
      completed_at: entity.completedAt?.toISOString() ?? null,
      created_at: new Date().toISOString(), // placeholder
      updated_at: new Date().toISOString(), // placeholder
      deleted_at: entity.deletedAt?.toISOString() ?? null,
      deleted_by: entity.deletedBy ?? null,
    }
  }

  // ============================================================================
  // Basic CRUD
  // ============================================================================

  async findById(id: string): Promise<JobCardTask | null> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data ? this.toDomain(data) : null
  }

  async findByJobcardId(jobcardId: string): Promise<JobCardTask[]> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .select('*')
      .eq('jobcard_id', jobcardId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findByJobcardIdWithItems(jobcardId: string): Promise<JobCardTaskWithItem[]> {
    const tenantId = this.getContextTenantId()
    
    // Get tasks
    const { data: tasks, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .select('*')
      .eq('jobcard_id', jobcardId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    if (!tasks || tasks.length === 0) return []

    // Get inventory items for tasks with inventory linkage
    const inventoryItemIds = tasks
      .map(t => t.inventory_item_id)
      .filter((id): id is string => id !== null)
    
    interface InventoryItemPartial {
      id: string
      name: string
      stock_keeping_unit: string | null
      stock_on_hand: number
      stock_reserved: number | null
    }
    let inventoryMap = new Map<string, InventoryItemPartial>()
    if (inventoryItemIds.length > 0) {
      const { data: items, error: itemsError } = await this.supabase
        .schema('tenant')
        .from('inventory_items')
        .select('id, name, stock_keeping_unit, stock_on_hand, stock_reserved')
        .in('id', inventoryItemIds)
        .eq('tenant_id', tenantId)

      if (itemsError) throw itemsError
      inventoryMap = new Map((items || []).map((i: InventoryItemPartial) => [i.id, i]))
    }

    return tasks.map(row => {
      const task = this.toDomain(row)
      const item = row.inventory_item_id ? inventoryMap.get(row.inventory_item_id) : undefined
      
      return {
        ...task,
        inventoryItem: item ? {
          id: item.id,
          name: item.name,
          stockKeepingUnit: item.stock_keeping_unit ?? undefined,
          stockOnHand: Number(item.stock_on_hand),
          stockReserved: Number(item.stock_reserved || 0),
          stockAvailable: Number(item.stock_on_hand) - Number(item.stock_reserved || 0),
        } : undefined,
      }
    })
  }

  async create(input: CreateTaskInput): Promise<JobCardTask> {
    const tenantId = this.getContextTenantId()
    
    const dbInput = {
      tenant_id: tenantId,
      jobcard_id: input.jobcardId,
      task_name: input.taskName,
      description: input.description ?? null,
      action_type: input.actionType,
      inventory_item_id: input.inventoryItemId ?? null,
      qty: input.qty ?? null,
      unit_price_snapshot: input.unitPriceSnapshot ?? null,
      labor_cost_snapshot: input.laborCostSnapshot ?? 0,
      tax_rate_snapshot: input.taxRateSnapshot ?? 0,
      task_status: 'DRAFT' as TaskStatus,
      created_by: input.createdBy ?? null,
    }

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .insert(dbInput)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, input: UpdateTaskInput): Promise<JobCardTask> {
    const tenantId = this.getContextTenantId()
    
    // Build update object only with provided fields
    const updates: Record<string, unknown> = {}
    if (input.taskName !== undefined) updates.task_name = input.taskName
    if (input.description !== undefined) updates.description = input.description
    if (input.actionType !== undefined) updates.action_type = input.actionType
    if (input.inventoryItemId !== undefined) updates.inventory_item_id = input.inventoryItemId
    if (input.qty !== undefined) updates.qty = input.qty
    if (input.unitPriceSnapshot !== undefined) updates.unit_price_snapshot = input.unitPriceSnapshot
    if (input.laborCostSnapshot !== undefined) updates.labor_cost_snapshot = input.laborCostSnapshot
    if (input.taxRateSnapshot !== undefined) updates.tax_rate_snapshot = input.taxRateSnapshot

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async updateStatus(id: string, input: UpdateTaskStatusInput): Promise<JobCardTask> {
    const tenantId = this.getContextTenantId()
    
    const updates: Record<string, unknown> = {
      task_status: input.taskStatus,
    }

    // Set timestamps and actors based on status
    if (input.taskStatus === 'APPROVED' && input.approvedBy) {
      updates.approved_by = input.approvedBy
      updates.approved_at = new Date().toISOString()
    }

    if (input.taskStatus === 'COMPLETED' && input.completedBy) {
      updates.completed_by = input.completedBy
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async softDelete(id: string, deletedBy?: string): Promise<void> {
    const tenantId = this.getContextTenantId()
    
    const { error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy ?? null,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  async findByJobcardIds(jobcardIds: string[]): Promise<JobCardTask[]> {
    if (jobcardIds.length === 0) return []
    
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .select('*')
      .in('jobcard_id', jobcardIds)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  // ============================================================================
  // Status-specific Queries
  // ============================================================================

  async findByStatus(status: TaskStatus): Promise<JobCardTask[]> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .select('*')
      .eq('task_status', status)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findPendingApproval(jobcardId: string): Promise<JobCardTask[]> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .select('*')
      .eq('jobcard_id', jobcardId)
      .eq('task_status', 'DRAFT')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findInProgress(jobcardId: string): Promise<JobCardTask[]> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .select('*')
      .eq('jobcard_id', jobcardId)
      .eq('task_status', 'IN_PROGRESS')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  // ============================================================================
  // Inventory-related Queries
  // ============================================================================

  async findByInventoryItemId(inventoryItemId: string): Promise<JobCardTask[]> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .select('*')
      .eq('inventory_item_id', inventoryItemId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findWithReservedInventory(jobcardId: string): Promise<JobCardTask[]> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .select('*')
      .eq('jobcard_id', jobcardId)
      .eq('tenant_id', tenantId)
      .not('inventory_item_id', 'is', null)
      .not('allocation_id', 'is', null)
      .in('task_status', ['APPROVED', 'IN_PROGRESS'])
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  // ============================================================================
  // Allocation Linkage
  // ============================================================================

  async linkAllocation(taskId: string, allocationId: string): Promise<void> {
    const tenantId = this.getContextTenantId()
    
    const { error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .update({ allocation_id: allocationId })
      .eq('id', taskId)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  async unlinkAllocation(taskId: string): Promise<void> {
    const tenantId = this.getContextTenantId()
    
    const { error } = await this.supabase
      .schema('tenant')
      .from('job_card_tasks')
      .update({ allocation_id: null })
      .eq('id', taskId)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }
}
