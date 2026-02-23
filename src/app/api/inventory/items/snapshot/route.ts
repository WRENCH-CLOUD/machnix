import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseInventoryRepository } from '@/modules/inventory/infrastructure/inventory.repository.supabase'
import { 
  InventorySnapshotResponse, 
  InventorySnapshotItem 
} from '@/modules/inventory/domain/inventory.entity'

/**
 * GET /api/inventory/items/snapshot
 * 
 * Returns full inventory snapshot for initial client-side cache
 * Use this on first load or when delta sync indicates full resync is needed
 */
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

    const repository = new SupabaseInventoryRepository(supabase, tenantId)
    const { items, syncedAt } = await repository.getSnapshot()

    // Transform to lightweight snapshot format
    const snapshotItems: InventorySnapshotItem[] = items.map(item => ({
      id: item.id,
      name: item.name,
      stockKeepingUnit: item.stockKeepingUnit,
      unitCost: item.unitCost,
      sellPrice: item.sellPrice,
      stockOnHand: item.stockOnHand,
      stockReserved: item.stockReserved || 0,
      stockAvailable: item.stockOnHand - (item.stockReserved || 0),
      reorderLevel: item.reorderLevel,
      updatedAt: item.updatedAt.toISOString(),
    }))

    const response: InventorySnapshotResponse = {
      items: snapshotItems,
      syncedAt,
      totalCount: items.length,
    }

    return NextResponse.json(response, {
      headers: {
        // Allow client to cache for 5 minutes, but revalidate in background
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
      }
    })
  } catch (error) {
    console.error('Error fetching inventory snapshot:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
