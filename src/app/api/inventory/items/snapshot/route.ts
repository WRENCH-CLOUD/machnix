import { NextResponse } from 'next/server'
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
export async function GET() {
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
