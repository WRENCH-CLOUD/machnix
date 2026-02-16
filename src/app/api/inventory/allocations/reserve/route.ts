import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { createInventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'
import { InsufficientStockError } from '@/modules/inventory/domain/allocation.entity'

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
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const json = await request.json()
    const result = reserveSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const { itemId, jobcardId, quantity, estimateItemId } = result.data

    const service = createInventoryAllocationService(supabase, tenantId)
    
    const reserveResult = await service.reserveForEstimateItem(
      estimateItemId || '',
      itemId,
      quantity,
      jobcardId,
      user.id
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
