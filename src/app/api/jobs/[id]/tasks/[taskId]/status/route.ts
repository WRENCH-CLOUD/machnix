import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'
import { SupabaseTaskRepository } from '@/modules/job/infrastructure/task.repository.supabase'
import { InventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'
import { SupabaseInventoryRepository } from '@/modules/inventory/infrastructure/inventory.repository.supabase'
import { z } from 'zod'
import type { TaskStatus } from '@/modules/job/domain/task.entity'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

// Simplified status transitions (manager workflow)
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  'DRAFT': ['APPROVED'],
  'APPROVED': ['DRAFT', 'COMPLETED'],
  'COMPLETED': [], // Terminal state
}

const updateStatusSchema = z.object({
  taskStatus: z.enum(['DRAFT', 'APPROVED', 'COMPLETED']),
})

type RouteContext = { params: { id: string; taskId: string } } | { params: Promise<{ id: string; taskId: string }> }

/**
 * PATCH /api/jobs/[id]/tasks/[taskId]/status
 * Update task status with inventory side effects
 * 
 * Simplified transitions:
 * - DRAFT → APPROVED: Reserve inventory (if task has linked inventory item)
 * - APPROVED → DRAFT: Release reservation
 * - APPROVED → COMPLETED: Lock task (consumption happens on job completion)
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

    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    // Rate limit
    const rateLimitResult = checkUserRateLimit(userId, RATE_LIMITS.WRITE, 'update-task-status')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const supabase = await createClient()

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
    const allocationService = new InventoryAllocationService(supabase, tenantId)
    const inventoryRepository = new SupabaseInventoryRepository(supabase, tenantId)

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

    // Handle inventory side effects for tasks with linked inventory
    let updatedInventory = null

    if (task.actionType === 'REPLACED' && task.inventoryItemId && task.qty) {
      try {
        // DRAFT → APPROVED: Reserve inventory
        if (currentStatus === 'DRAFT' && newStatus === 'APPROVED') {
          const canReserveResult = await allocationService.canReserve(task.inventoryItemId, task.qty)
          if (!canReserveResult.canReserve) {
            return NextResponse.json(
              {
                error: 'INSUFFICIENT_STOCK',
                message: `Cannot reserve ${task.qty} units. Only ${canReserveResult.available} available.`,
                stockAvailable: canReserveResult.available,
                stockRequested: task.qty,
              },
              { status: 409 }
            )
          }

          // Reserve via service (creates allocation + transaction record)
          const reserveResult = await allocationService.reserveForTask(
            taskId,
            task.inventoryItemId,
            task.qty,
            task.jobcardId,
            userId,
          )

          // Link allocation to task
          await taskRepository.linkAllocation(taskId, reserveResult.allocation.id)

          // Get updated inventory for response
          updatedInventory = await inventoryRepository.findById(task.inventoryItemId)
        }

        // APPROVED → DRAFT: Release reservation
        if (currentStatus === 'APPROVED' && newStatus === 'DRAFT' && task.allocationId) {
          await allocationService.releaseForTask(taskId)

          // Unlink allocation from task
          await taskRepository.unlinkAllocation(taskId)

          // Get updated inventory for response
          updatedInventory = await inventoryRepository.findById(task.inventoryItemId)
        }

        // APPROVED → COMPLETED: No-op here. Consumption handled by job completion.

      } catch (error: unknown) {
        console.error('Inventory operation error:', error)
        const allocationError = error instanceof Error ? error.message : 'Unknown error'
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
      approvedBy: newStatus === 'APPROVED' ? userId : undefined,
      completedBy: newStatus === 'COMPLETED' ? userId : undefined,
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
