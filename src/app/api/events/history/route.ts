/**
 * Event History API Route
 * 
 * GET /api/events/history?entityType=jobcard&entityId=<uuid>
 * GET /api/events/history?tenantId=<uuid>&limit=50
 * 
 * Returns event audit trail for debugging and monitoring.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { SupabaseEventRepository } from '@/modules/event/infrastructure/event.repository.supabase'
import { GetEventHistoryUseCase } from '@/modules/event/application/get-event-history.use-case'
import { EntityType } from '@/modules/event/domain/event-types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') as EntityType | null
    const entityId = searchParams.get('entityId')
    const tenantId = searchParams.get('tenantId')
    const limit = parseInt(searchParams.get('limit') ?? '100', 10)

    const adminClient = getSupabaseAdmin()
    const eventRepo = new SupabaseEventRepository(adminClient)
    const useCase = new GetEventHistoryUseCase(eventRepo)

    if (entityType && entityId) {
      const events = await useCase.byEntity(entityType, entityId)
      return NextResponse.json({ events })
    }

    if (tenantId) {
      const events = await useCase.byTenant(tenantId, limit)
      return NextResponse.json({ events })
    }

    return NextResponse.json(
      { error: 'Provide entityType+entityId or tenantId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[EventHistoryAPI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event history' },
      { status: 500 }
    )
  }
}
