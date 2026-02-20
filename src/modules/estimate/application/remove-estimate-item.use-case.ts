import { EstimateRepository } from '../domain/estimate.repository'
import { InventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'
import { SupabaseClient } from '@supabase/supabase-js'

export interface RemoveEstimateItemResult {
  success: boolean
  releasedStock?: number
  unllinkedTaskId?: string
}

export class RemoveEstimateItemUseCase {
  constructor(
    private readonly repository: EstimateRepository,
    private readonly allocationService?: InventoryAllocationService,
    private readonly supabase?: SupabaseClient,
    private readonly tenantId?: string
  ) { }

  async execute(itemId: string, createdBy?: string): Promise<RemoveEstimateItemResult> {
    let releasedStock: number | undefined
    let unllinkedTaskId: string | undefined

    // Release any stock allocation for this estimate item BEFORE removal
    if (this.allocationService) {
      try {
        const allocation = await this.allocationService.getAllocationByEstimateItem(itemId)
        if (allocation && allocation.status === 'reserved') {
          const releaseResult = await this.allocationService.releaseForEstimateItem(itemId, createdBy)
          releasedStock = releaseResult.totalQuantityReleased
        }
      } catch (error) {
        // Log but don't fail the removal - allocation might not exist
        console.warn('Failed to release allocation for estimate item:', error)
      }
    }

    // Before removal, check if this estimate item is linked to a task
    // If so, reverse-sync: set task's show_in_estimate = false and unlink
    if (this.supabase && this.tenantId) {
      try {
        const { data: estimateItem } = await this.supabase
          .schema('tenant')
          .from('estimate_items')
          .select('task_id')
          .eq('id', itemId)
          .single()

        if (estimateItem?.task_id) {
          unllinkedTaskId = estimateItem.task_id

          // Update the linked task: turn off showInEstimate and clear estimateItemId
          await this.supabase
            .schema('tenant')
            .from('job_card_tasks')
            .update({
              show_in_estimate: false,
              estimate_item_id: null,
            })
            .eq('id', estimateItem.task_id)
            .eq('tenant_id', this.tenantId)
        }
      } catch (error) {
        console.warn('[RemoveEstimateItem] Failed to reverse-sync task:', error)
      }
    }

    // Remove the item from the estimate
    await this.repository.removeItem(itemId)

    return {
      success: true,
      releasedStock,
      unllinkedTaskId,
    }
  }
}
