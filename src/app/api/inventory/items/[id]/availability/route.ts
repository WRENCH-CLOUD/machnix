import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createInventoryAllocationService } from '@/modules/inventory/application/inventory-allocation.service'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

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
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

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
