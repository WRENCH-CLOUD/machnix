import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { createInventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'
import { AllocationAlreadyConsumedError, AllocationNotFoundError } from '@/modules/inventory/domain/allocation.entity'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

const consumeSchema = z.object({
  allocationId: z.string().uuid().optional(),
  jobcardId: z.string().uuid().optional(),
  itemId: z.string().uuid().optional(),
  quantity: z.number().int().positive().optional(),
}).refine(
  data => data.allocationId || (data.jobcardId && data.itemId),
  { message: 'Must provide allocationId OR (jobcardId and itemId)' }
)

/**
 * POST /api/inventory/allocations/consume
 * Consume reserved stock (when part is actually used)
 */
export async function POST(request: Request) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

    const json = await request.json()
    const result = consumeSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const { allocationId, jobcardId, itemId, quantity } = result.data

    const service = createInventoryAllocationService(supabase, tenantId)
    
    let consumeResult
    if (allocationId) {
      consumeResult = await service.consumeAllocation(allocationId, quantity, userId)
    } else if (jobcardId && itemId) {
      consumeResult = await service.consumeForTodo(jobcardId, itemId, quantity, userId)
    } else {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      allocationId: consumeResult.allocation.id,
      quantityConsumed: consumeResult.quantityConsumed,
      transactionId: consumeResult.transactionId,
    })

  } catch (error: unknown) {
    console.error('Error consuming stock:', error)
    
    if (error instanceof AllocationNotFoundError) {
      return NextResponse.json({
        error: error.message,
        code: 'ALLOCATION_NOT_FOUND',
      }, { status: 404 })
    }

    if (error instanceof AllocationAlreadyConsumedError) {
      return NextResponse.json({
        error: error.message,
        code: 'ALREADY_CONSUMED',
      }, { status: 409 })
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
