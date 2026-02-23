import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { createInventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'
import { InsufficientStockError } from '@/modules/inventory/domain/allocation.entity'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

const reserveSchema = z.object({
  itemId: z.string().uuid(),
  jobcardId: z.string().uuid(),
  quantity: z.number().int().positive(),
  estimateItemId: z.string().uuid().optional(),
})

/**
 * POST /api/inventory/allocations/reserve
 * Reserve stock for a job card
 */
export async function POST(request: Request) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

    const json = await request.json()
    const result = reserveSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const { itemId, jobcardId, quantity, estimateItemId } = result.data

    const service = createInventoryAllocationService(supabase, tenantId)

    const reserveResult = await service.reserveForEstimateItem(
      estimateItemId ?? '',
      itemId,
      quantity,
      jobcardId,
      userId
    )

    return NextResponse.json({
      allocationId: reserveResult.allocation.id,
      itemId: reserveResult.allocation.itemId,
      quantityReserved: reserveResult.allocation.quantityReserved,
      stockRemaining: reserveResult.stockRemaining,
      stockAvailable: reserveResult.stockAvailable,
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('Error reserving stock:', error)

    // Handle insufficient stock error
    if (error instanceof InsufficientStockError) {
      return NextResponse.json({
        error: error.message,
        code: 'INSUFFICIENT_STOCK',
        itemId: error.itemId,
        requested: error.requested,
        available: error.available,
      }, { status: 409 })
    }

    // Handle duplicate reservation
    if (error instanceof Error && error.message?.includes('already reserved')) {
      return NextResponse.json({
        error: error.message,
        code: 'ALREADY_RESERVED'
      }, { status: 409 })
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
