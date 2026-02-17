import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'
import { SupabaseTaskRepository } from '@/modules/job/infrastructure/task.repository.supabase'
import { TaskEstimateSyncService } from '@/modules/job/application/task-estimate-sync.service'
import { z } from 'zod'
import type { TaskActionType } from '@/modules/job/domain/task.entity'

// Validation schema for updates
const updateTaskSchema = z.object({
  taskName: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional().nullable(),
  actionType: z.enum(['NO_CHANGE', 'REPAIRED', 'REPLACED']).optional(),
  inventoryItemId: z.string().uuid().optional().nullable(),
  qty: z.number().int().positive().optional().nullable(),
  unitPriceSnapshot: z.number().min(0).optional(),
  laborCostSnapshot: z.number().min(0).optional(),
  taxRateSnapshot: z.number().min(0).max(100).optional(),
})

type RouteContext = { params: { id: string; taskId: string } } | { params: Promise<{ id: string; taskId: string }> }

/**
 * GET /api/jobs/[id]/tasks/[taskId]
 * Get a specific task
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const resolvedParams = await (context.params as any)
    const { id: jobcardId, taskId } = resolvedParams as { id: string; taskId: string }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!jobcardId || !uuidRegex.test(jobcardId) || !taskId || !uuidRegex.test(taskId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const repository = new SupabaseTaskRepository(supabase, tenantId)
    const task = await repository.findById(taskId)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify task belongs to the specified job
    if (task.jobcardId !== jobcardId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * PATCH /api/jobs/[id]/tasks/[taskId]
 * Update a task's details (not status - use /status endpoint)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const resolvedParams = await (context.params as any)
    const { id: jobcardId, taskId } = resolvedParams as { id: string; taskId: string }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!jobcardId || !uuidRegex.test(jobcardId) || !taskId || !uuidRegex.test(taskId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit
    const rateLimitResult = checkUserRateLimit(user.id, RATE_LIMITS.WRITE, 'update-task')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    // Parse and validate body
    const body = await request.json()
    const validationResult = updateTaskSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const input = validationResult.data

    const repository = new SupabaseTaskRepository(supabase, tenantId)
    
    // Get existing task
    const existingTask = await repository.findById(taskId)
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify task belongs to the specified job
    if (existingTask.jobcardId !== jobcardId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Don't allow editing approved/completed tasks (prices are locked)
    if (['APPROVED', 'COMPLETED'].includes(existingTask.taskStatus)) {
      return NextResponse.json(
        { error: 'Cannot modify an approved or completed task' },
        { status: 400 }
      )
    }

    // Validate REPLACED action has inventory info
    const finalActionType = input.actionType ?? existingTask.actionType
    const finalInventoryId = input.inventoryItemId !== undefined ? input.inventoryItemId : existingTask.inventoryItemId
    const finalQty = input.qty !== undefined ? input.qty : existingTask.qty
    
    if (finalActionType === 'REPLACED' && (!finalInventoryId || !finalQty)) {
      return NextResponse.json(
        { error: 'REPLACED action requires inventoryItemId and qty > 0' },
        { status: 400 }
      )
    }

    // If inventory item changed, verify and get price
    if (input.inventoryItemId && input.inventoryItemId !== existingTask.inventoryItemId) {
      const { data: item, error: itemError } = await supabase
        .schema('tenant')
        .from('inventory_items')
        .select('id, sell_price')
        .eq('id', input.inventoryItemId)
        .eq('tenant_id', tenantId)
        .single()

      if (itemError || !item) {
        return NextResponse.json({ error: 'Inventory item not found' }, { status: 400 })
      }

      // Auto-fill price if not provided
      if (input.unitPriceSnapshot === undefined) {
        input.unitPriceSnapshot = Number(item.sell_price)
      }
    }

    const task = await repository.update(taskId, {
      taskName: input.taskName,
      description: input.description ?? undefined,
      actionType: input.actionType as TaskActionType | undefined,
      inventoryItemId: input.inventoryItemId ?? undefined,
      qty: input.qty ?? undefined,
      unitPriceSnapshot: input.unitPriceSnapshot,
      laborCostSnapshot: input.laborCostSnapshot,
      taxRateSnapshot: input.taxRateSnapshot,
    })

    // Sync updated task to estimate
    try {
      const syncService = new TaskEstimateSyncService(supabase, tenantId)
      await syncService.syncTaskToEstimate(task)
    } catch (syncError) {
      console.warn('[Task API] Failed to sync task to estimate:', syncError)
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * DELETE /api/jobs/[id]/tasks/[taskId]
 * Soft delete a task
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const resolvedParams = await (context.params as any)
    const { id: jobcardId, taskId } = resolvedParams as { id: string; taskId: string }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!jobcardId || !uuidRegex.test(jobcardId) || !taskId || !uuidRegex.test(taskId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit
    const rateLimitResult = checkUserRateLimit(user.id, RATE_LIMITS.WRITE, 'delete-task')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const repository = new SupabaseTaskRepository(supabase, tenantId)
    
    // Get existing task
    const existingTask = await repository.findById(taskId)
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify task belongs to the specified job
    if (existingTask.jobcardId !== jobcardId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Don't allow deleting completed tasks
    if (existingTask.taskStatus === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot delete a completed task' },
        { status: 400 }
      )
    }

    // TODO: If task has allocation, release it before deleting
    // if (existingTask.allocationId) {
    //   await allocationService.release(existingTask.allocationId)
    // }

    // Remove the corresponding estimate item
    try {
      const syncService = new TaskEstimateSyncService(supabase, tenantId)
      await syncService.removeEstimateItemForTask(existingTask)
    } catch (syncError) {
      console.warn('[Task API] Failed to remove estimate item for task:', syncError)
    }

    await repository.softDelete(taskId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
