import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { createInventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'
import { AllocationNotFoundError } from '@/modules/inventory/domain/allocation.entity'

const releaseSchema = z.object({
  allocationId: z.string().uuid().optional(),
  estimateItemId: z.string().uuid().optional(),
  jobcardId: z.string().uuid().optional(),
}).refine(
  data => data.allocationId || data.estimateItemId || data.jobcardId,
  { message: 'Must provide allocationId, estimateItemId, or jobcardId' }
)

/**
 * POST /api/inventory/allocations/release
 * Release reserved stock back to available
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
    const result = releaseSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const { allocationId, estimateItemId, jobcardId } = result.data

    const service = createInventoryAllocationService(supabase, tenantId)

    let releaseResult
    if (allocationId) {
      releaseResult = await service.releaseByAllocationId(allocationId, user.id)
    } else if (estimateItemId) {
      releaseResult = await service.releaseForEstimateItem(estimateItemId, user.id)
    } else if (jobcardId) {
      releaseResult = await service.releaseForJob(jobcardId, user.id)
    } else {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      releasedCount: releaseResult.releasedAllocations.length,
      totalQuantityReleased: releaseResult.totalQuantityReleased,
      releasedAllocations: releaseResult.releasedAllocations.map(a => ({
        id: a.id,
        itemId: a.itemId,
        quantityReleased: a.quantityReserved,
      })),
    })

  } catch (error: unknown) {
    console.error('Error releasing stock:', error)

    if (error instanceof AllocationNotFoundError) {
      return NextResponse.json({
        error: error.message,
        code: 'ALLOCATION_NOT_FOUND',
      }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
