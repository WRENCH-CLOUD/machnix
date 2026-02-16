import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseAllocationRepository } from '@/modules/inventory/infrastructure/allocation.repository.supabase'
import { AllocationStatus } from '@/modules/inventory/domain/allocation.entity'

const validStatuses: AllocationStatus[] = ['reserved', 'consumed', 'released']

function isValidAllocationStatus(status: string): status is AllocationStatus {
  return validStatuses.includes(status as AllocationStatus)
}

/**
 * GET /api/inventory/allocations
 * List allocations, optionally filtered by jobcard_id or item_id
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const jobcardId = searchParams.get('jobcard_id')
    const itemId = searchParams.get('item_id')
    const status = searchParams.get('status')

    const repository = new SupabaseAllocationRepository(supabase, tenantId)
    
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
