import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseAllocationRepository } from '@/modules/inventory/infrastructure/allocation.repository.supabase'
import { AllocationStatus } from '@/modules/inventory/domain/allocation.entity'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

const validStatuses: AllocationStatus[] = ['reserved', 'consumed', 'released']

function isValidAllocationStatus(status: string): status is AllocationStatus {
  return validStatuses.includes(status as AllocationStatus)
}

/**
 * GET /api/inventory/allocations
 * List allocations, optionally filtered by jobcard_id or item_id
 * Use ?with_relations=true to include item and job names
 */
export async function GET(request: Request) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth
    const { userId, tenantId } = auth

    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const jobcardId = searchParams.get('jobcard_id')
    const itemId = searchParams.get('item_id')
    const status = searchParams.get('status')
    const withRelations = searchParams.get('with_relations') === 'true'
    const limit = searchParams.get('limit')

    const repository = new SupabaseAllocationRepository(supabase, tenantId)
    
    // If with_relations is true, use the new method
    if (withRelations) {
      const statusFilter = status && isValidAllocationStatus(status) ? status : undefined
      const limitNum = limit ? parseInt(limit, 10) : 50
      const allocations = await repository.findWithRelations(statusFilter, limitNum)
      return NextResponse.json(allocations)
    }

    let allocations
    if (jobcardId) {
      allocations = await repository.findByJobcardId(jobcardId)
    } else if (itemId) {
      allocations = await repository.findByItemId(itemId)
    } else if (status && isValidAllocationStatus(status)) {
      allocations = await repository.findByStatus(status)
    } else {
      // Return all reserved allocations by default
      allocations = await repository.findByStatus('reserved')
    }

    return NextResponse.json(allocations)
  } catch (error: unknown) {
    console.error('Error fetching allocations:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
