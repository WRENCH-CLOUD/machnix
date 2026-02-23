import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseInventoryRepository } from '@/modules/inventory/infrastructure/inventory.repository.supabase'
import { 
  InventoryDeltaResponse, 
  InventorySnapshotItem,
  DELTA_SYNC_THRESHOLD_PERCENT 
} from '@/modules/inventory/domain/inventory.entity'
import { getRouteUser } from '@/lib/auth/get-route-user'

/**
 * GET /api/inventory/items/delta?since=<ISO timestamp>
 * 
 * Returns incremental changes since the given timestamp
 * Use this for background sync after initial snapshot is loaded
 * 
 * Query Parameters:
 * - since: ISO timestamp of last sync (required)
 * 
 * Response:
 * - upserted: Items created or updated since 'since'
 * - deleted: IDs of items soft-deleted since 'since'
 * - syncedAt: New timestamp for next delta request
 * - requiresFullSync: If true, client should discard cache and fetch full snapshot
 */
export async function GET(request: NextRequest) {
  try {
    // Read user from middleware-injected headers (avoids redundant getUser() call)
    const user = getRouteUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    // Parse 'since' parameter
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    if (!since) {
      return NextResponse.json(
        { error: 'Missing required parameter: since (ISO timestamp)' }, 
        { status: 400 }
      )
    }

    // Validate timestamp format
    const sinceDate = new Date(since)
    if (isNaN(sinceDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid timestamp format. Use ISO 8601 format.' }, 
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const repository = new SupabaseInventoryRepository(supabase, tenantId)
    const { upserted, deleted, syncedAt, totalCount } = await repository.getDelta(since)

    // Check if delta is too large (should do full sync instead)
    const changeCount = upserted.length + deleted.length
    const changePercent = totalCount > 0 ? (changeCount / totalCount) * 100 : 0
    const requiresFullSync = changePercent > DELTA_SYNC_THRESHOLD_PERCENT

    // Transform to lightweight snapshot format
    const upsertedItems: InventorySnapshotItem[] = upserted.map(item => ({
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

    const response: InventoryDeltaResponse = {
      upserted: upsertedItems,
      deleted,
      syncedAt,
      requiresFullSync,
    }

    return NextResponse.json(response, {
      headers: {
        // Short cache for deltas (they're meant to be fresh)
        'Cache-Control': 'private, max-age=30',
      }
    })
  } catch (error) {
    console.error('Error fetching inventory delta:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
