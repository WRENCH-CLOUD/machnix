import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createInventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/inventory/items/:id/availability
 * Get stock availability for an item including all reservations
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const service = createInventoryAllocationService(supabase, tenantId)
    const availability = await service.getAvailableStock(id)

    return NextResponse.json(availability)

  } catch (error: unknown) {
    console.error('Error fetching item availability:', error)
    
    if (error instanceof Error && error.message?.includes('not found')) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
