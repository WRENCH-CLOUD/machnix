import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'
import { SupabaseTaskRepository } from '@/modules/job/infrastructure/task.repository.supabase'
import { SupabaseInventoryRepository } from '@/modules/inventory/infrastructure/inventory.repository.supabase'
import { SupabaseAllocationRepository } from '@/modules/inventory/infrastructure/allocation.repository.supabase'
import { z } from 'zod'
import type { TaskStatus } from '@/modules/job/domain/task.entity'

// Status transition validation
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  'DRAFT': ['APPROVED', 'CANCELLED'],
  'APPROVED': ['IN_PROGRESS', 'CANCELLED'],
  'IN_PROGRESS': ['COMPLETED', 'APPROVED'], // Can go back to APPROVED
  'COMPLETED': [], // Terminal state
  'CANCELLED': ['DRAFT'], // Can reactivate
}

const updateStatusSchema = z.object({
  taskStatus: z.enum(['DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
})

type RouteContext = { params: { id: string; taskId: string } } | { params: Promise<{ id: string; taskId: string }> }

/**
 * PATCH /api/jobs/[id]/tasks/[taskId]/status
 * Update task status with inventory side effects
 * 
 * Status transitions and effects:
 * - DRAFT → APPROVED: Reserve inventory (if REPLACED)
 * - APPROVED → IN_PROGRESS: No inventory effect
 * - IN_PROGRESS → COMPLETED: Consume inventory (if REPLACED)
 * - Any → CANCELLED: Release reservation (if exists)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const resolvedParams = await context.params as { id: string; taskId: string }
    const { id: jobcardId, taskId } = resolvedParams

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
    const rateLimitResult = checkUserRateLimit(user.id, RATE_LIMITS.WRITE, 'update-task-status')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    // Parse and validate body
    const body = await request.json()
    const validationResult = updateStatusSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { taskStatus: newStatus } = validationResult.data

    const taskRepository = new SupabaseTaskRepository(supabase, tenantId)
    const inventoryRepository = new SupabaseInventoryRepository(supabase, tenantId)
    const allocationRepository = new SupabaseAllocationRepository(supabase, tenantId)
    
    // Get existing task
    const task = await taskRepository.findById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify task belongs to the specified job
    if (task.jobcardId !== jobcardId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const currentStatus = task.taskStatus

    // Validate transition
    const validNextStates = VALID_TRANSITIONS[currentStatus]
    if (!validNextStates.includes(newStatus)) {
      return NextResponse.json(
        { 
          error: `Invalid status transition: ${currentStatus} → ${newStatus}`,
          allowedTransitions: validNextStates,
        },
        { status: 400 }
      )
    }

    // Handle inventory side effects for REPLACED tasks
    let updatedInventory = null
    let allocationError = null

    if (task.actionType === 'REPLACED' && task.inventoryItemId && task.qty) {
      try {
        // DRAFT → APPROVED: Reserve inventory
        if (currentStatus === 'DRAFT' && newStatus === 'APPROVED') {
          // Check stock availability
          const item = await inventoryRepository.findById(task.inventoryItemId)
          if (!item) {
            return NextResponse.json({ error: 'Inventory item not found' }, { status: 400 })
          }

          const available = item.stockOnHand - (item.stockReserved || 0)
          if (task.qty > available) {
            return NextResponse.json(
              { 
                error: 'INSUFFICIENT_STOCK',
                message: `Cannot reserve ${task.qty} units. Only ${available} available.`,
                stockAvailable: available,
                stockRequested: task.qty,
              },
              { status: 409 }
            )
          }

          // Reserve stock
          await inventoryRepository.reserveStock(task.inventoryItemId, task.qty)

          // Create allocation record
          const allocation = await allocationRepository.create({
            itemId: task.inventoryItemId,
            jobcardId: task.jobcardId,
            taskId: taskId, // Link allocation to task
            quantityReserved: task.qty,
            createdBy: user.id,
          })

          // Link allocation to task
          await taskRepository.linkAllocation(taskId, allocation.id)

          // Get updated inventory for response
          updatedInventory = await inventoryRepository.findById(task.inventoryItemId)
        }

        // → COMPLETED: Consume inventory
        if (newStatus === 'COMPLETED' && task.allocationId) {
          const allocation = await allocationRepository.findById(task.allocationId)
          if (allocation && allocation.status === 'reserved') {
            // Consume the allocation
            await allocationRepository.markConsumed(task.allocationId, task.qty)

            // Deduct from stock (both on-hand and reserved)
            await inventoryRepository.consumeReservedStock(task.inventoryItemId, task.qty)

            // Get updated inventory for response
            updatedInventory = await inventoryRepository.findById(task.inventoryItemId)
          }
        }

        // → CANCELLED: Release reservation
        if (newStatus === 'CANCELLED' && task.allocationId) {
          const allocation = await allocationRepository.findById(task.allocationId)
          if (allocation && allocation.status === 'reserved') {
            // Release the allocation
            await allocationRepository.markReleased(task.allocationId)

            // Unreserve stock
            await inventoryRepository.unreserveStock(task.inventoryItemId, allocation.quantityReserved)

            // Unlink allocation from task
            await taskRepository.unlinkAllocation(taskId)

            // Get updated inventory for response
            updatedInventory = await inventoryRepository.findById(task.inventoryItemId)
          }
        }

        // APPROVED → DRAFT (via CANCELLED → DRAFT): already handled by CANCELLED
        // IN_PROGRESS → APPROVED: Release and re-reserve would be same, no action needed

      } catch (error: unknown) {
        console.error('Inventory operation error:', error)
        allocationError = error instanceof Error ? error.message : 'Unknown error'
        // Don't proceed if inventory operation failed
        return NextResponse.json(
          { 
            error: 'Inventory operation failed',
            details: allocationError,
          },
          { status: 500 }
        )
      }
    }

    // Update task status
    const updatedTask = await taskRepository.updateStatus(taskId, {
      taskStatus: newStatus,
      approvedBy: newStatus === 'APPROVED' ? user.id : undefined,
      completedBy: newStatus === 'COMPLETED' ? user.id : undefined,
    })

    return NextResponse.json({ 
      task: updatedTask,
      ...(updatedInventory && {
        inventoryUpdate: {
          id: updatedInventory.id,
          stockOnHand: updatedInventory.stockOnHand,
          stockReserved: updatedInventory.stockReserved,
          stockAvailable: updatedInventory.stockOnHand - (updatedInventory.stockReserved || 0),
        }
      }),
    })
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
