import { SupabaseClient } from '@supabase/supabase-js'
import { JobCardTask } from '@/modules/job/domain/task.entity'
import { SupabaseTaskRepository } from '@/modules/job/infrastructure/task.repository.supabase'
import { SupabaseEstimateRepository } from '@/modules/estimate/infrastructure/estimate.repository.supabase'

/**
 * Task-Estimate Sync Service
 * 
 * Keeps tasks and estimate items in sync so customers can see
 * the work items before the job starts.
 * 
 * Sync rules:
 * - REPLACED tasks → estimate item with part and labor
 * - LABOR_ONLY tasks → estimate item with labor only
 */
export class TaskEstimateSyncService {
  private supabase: SupabaseClient
  private tenantId: string
  private taskRepository: SupabaseTaskRepository
  private estimateRepository: SupabaseEstimateRepository

  constructor(supabase: SupabaseClient, tenantId: string) {
    this.supabase = supabase
    this.tenantId = tenantId
    this.taskRepository = new SupabaseTaskRepository(supabase, tenantId)
    this.estimateRepository = new SupabaseEstimateRepository(supabase, tenantId)
  }

  /**
   * Sync a task to the estimate
   * Creates or updates the corresponding estimate_item
   */
  async syncTaskToEstimate(task: JobCardTask): Promise<string | null> {
    // If task is not flagged for estimate, remove any existing estimate item
    if (task.showInEstimate === false) {
      if (task.estimateItemId) {
        await this.removeEstimateItemForTask(task)
      }
      return null
    }

    // All tasks flagged for estimate get estimate items (REPLACED or LABOR_ONLY)

    // Get the estimate for this job
    const estimate = await this.getEstimateForJob(task.jobcardId)
    if (!estimate) {
      console.warn(`[TaskEstimateSync] No estimate found for job ${task.jobcardId}`)
      return null
    }

    // If task has an inventory item, look up its name for the estimate
    let inventoryItemName: string | undefined
    if (task.inventoryItemId) {
      const { data: item } = await this.supabase
        .schema('tenant')
        .from('inventory_items')
        .select('name')
        .eq('id', task.inventoryItemId)
        .eq('tenant_id', this.tenantId)
        .single()

      if (item) {
        inventoryItemName = item.name
      }
    }

    // Build estimate item data from task
    const itemData = this.buildEstimateItemFromTask(task, inventoryItemName)

    if (task.estimateItemId) {
      // Update existing estimate item
      await this.updateEstimateItem(task.estimateItemId, itemData, task.id)
      return task.estimateItemId
    } else {
      // Create new estimate item
      const estimateItem = await this.createEstimateItem(estimate.id, itemData, task.id)

      // Link the estimate item back to the task
      await this.taskRepository.linkEstimateItem(task.id, estimateItem.id)

      return estimateItem.id
    }
  }

  /**
   * Remove the estimate item when a task is deleted
   */
  async removeEstimateItemForTask(task: JobCardTask): Promise<void> {
    if (!task.estimateItemId) return

    await this.removeEstimateItem(task.estimateItemId)
    await this.taskRepository.unlinkEstimateItem(task.id)
  }

  /**
   * Sync all tasks for a job to its estimate
   * Useful for bulk operations or initial sync
   */
  async syncAllTasksForJob(jobcardId: string): Promise<void> {
    const tasks = await this.taskRepository.findByJobcardId(jobcardId)

    for (const task of tasks) {
      await this.syncTaskToEstimate(task)
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private async getEstimateForJob(jobcardId: string): Promise<{ id: string } | null> {
    const estimates = await this.estimateRepository.findByJobcardId(jobcardId)
    // Return the first (most recent) estimate for this job
    return estimates.length > 0 ? { id: estimates[0].id } : null
  }

  private buildEstimateItemFromTask(task: JobCardTask, inventoryItemName?: string): EstimateItemInput {
    const isReplaced = task.actionType === 'REPLACED'

    // Use inventory item name for the estimate when available, fall back to task name
    const displayName = (isReplaced && inventoryItemName) ? inventoryItemName : task.taskName

    return {
      partId: isReplaced ? task.inventoryItemId : undefined,
      customName: displayName,
      description: task.description || (isReplaced ? 'Part replacement' : 'Repair service'),
      qty: isReplaced ? (task.qty || 1) : 1,
      unitPrice: isReplaced ? (task.unitPriceSnapshot || 0) : 0,
      laborCost: task.laborCostSnapshot || 0,
    }
  }

  private async createEstimateItem(
    estimateId: string,
    item: EstimateItemInput,
    taskId: string
  ): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('estimate_items')
      .insert({
        tenant_id: this.tenantId,
        estimate_id: estimateId,
        part_id: item.partId || null,
        custom_name: item.customName,
        description: item.description,
        qty: item.qty,
        unit_price: item.unitPrice,
        labor_cost: item.laborCost,
        task_id: taskId,
      })
      .select('id')
      .single()

    if (error) throw error

    // Recalculate estimate totals
    await this.recalculateEstimateTotals(estimateId)

    return { id: data.id }
  }

  private async updateEstimateItem(
    itemId: string,
    item: EstimateItemInput,
    taskId: string
  ): Promise<void> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('estimate_items')
      .update({
        part_id: item.partId || null,
        custom_name: item.customName,
        description: item.description,
        qty: item.qty,
        unit_price: item.unitPrice,
        labor_cost: item.laborCost,
        task_id: taskId,
      })
      .eq('id', itemId)
      .eq('tenant_id', this.tenantId)
      .select('estimate_id')
      .single()

    if (error) throw error

    // Recalculate estimate totals
    if (data?.estimate_id) {
      await this.recalculateEstimateTotals(data.estimate_id)
    }
  }

  private async removeEstimateItem(itemId: string): Promise<void> {
    // Get estimate ID before deletion for recalculation
    const { data: item } = await this.supabase
      .schema('tenant')
      .from('estimate_items')
      .select('estimate_id')
      .eq('id', itemId)
      .single()

    // Hard delete the estimate item (table has no deleted_at column)
    const { error } = await this.supabase
      .schema('tenant')
      .from('estimate_items')
      .delete()
      .eq('id', itemId)
      .eq('tenant_id', this.tenantId)

    if (error) throw error

    // Recalculate estimate totals
    if (item?.estimate_id) {
      await this.recalculateEstimateTotals(item.estimate_id)
    }
  }

  private async recalculateEstimateTotals(estimateId: string): Promise<void> {
    // Get all items for this estimate
    const { data: items, error } = await this.supabase
      .schema('tenant')
      .from('estimate_items')
      .select('qty, unit_price, labor_cost')
      .eq('estimate_id', estimateId)

    if (error) throw error

    let partsTotal = 0
    let laborTotal = 0

    for (const item of items || []) {
      partsTotal += (item.qty || 0) * (item.unit_price || 0)
      laborTotal += item.labor_cost || 0
    }

    const subtotal = partsTotal + laborTotal

    // Update the estimate totals
    await this.supabase
      .schema('tenant')
      .from('estimates')
      .update({
        parts_total: partsTotal,
        labor_total: laborTotal,
        subtotal: subtotal,
        total_amount: subtotal, // Tax handled separately
      })
      .eq('id', estimateId)
      .eq('tenant_id', this.tenantId)
  }
}

/**
 * Input type for creating/updating estimate items
 */
interface EstimateItemInput {
  partId?: string
  customName: string
  description?: string
  qty: number
  unitPrice: number
  laborCost: number
}
