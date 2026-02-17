import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'
import { SupabaseTaskRepository } from '@/modules/job/infrastructure/task.repository.supabase'
import { TaskEstimateSyncService } from '@/modules/job/application/task-estimate-sync.service'
import { z } from 'zod'
import type { TaskActionType } from '@/modules/job/domain/task.entity'

// Validation schemas
const createTaskSchema = z.object({
  taskName: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  actionType: z.enum(['NO_CHANGE', 'REPAIRED', 'REPLACED']),
  inventoryItemId: z.string().uuid().optional(),
  qty: z.number().int().positive().optional(),
  unitPriceSnapshot: z.number().min(0).optional(),
  laborCostSnapshot: z.number().min(0).optional(),
  taxRateSnapshot: z.number().min(0).max(100).optional(),
}).refine(
  (data) => {
    // If action is REPLACED, inventory info is required
    if (data.actionType === 'REPLACED') {
      return data.inventoryItemId && data.qty && data.qty > 0
    }
    return true
  },
  { message: 'REPLACED action requires inventoryItemId and qty > 0' }
)

/**
 * GET /api/jobs/[id]/tasks
 * Get all tasks for a job card
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any)
    const jobcardId = (resolvedParams as { id: string }).id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!jobcardId || !uuidRegex.test(jobcardId)) {
      return NextResponse.json({ error: 'Invalid job ID format' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    // Check if we want items included
    const { searchParams } = new URL(request.url)
    const withItems = searchParams.get('with_items') === 'true'

    const repository = new SupabaseTaskRepository(supabase, tenantId)
    
    const tasks = withItems
      ? await repository.findByJobcardIdWithItems(jobcardId)
      : await repository.findByJobcardId(jobcardId)

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/jobs/[id]/tasks
 * Create a new task for a job card
 */
export async function POST(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any)
    const jobcardId = (resolvedParams as { id: string }).id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!jobcardId || !uuidRegex.test(jobcardId)) {
      return NextResponse.json({ error: 'Invalid job ID format' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit
    const rateLimitResult = checkUserRateLimit(user.id, RATE_LIMITS.WRITE, 'create-task')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    // Parse and validate body
    const body = await request.json()
    const validationResult = createTaskSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const input = validationResult.data

    // Verify job exists and belongs to tenant
    const { data: job, error: jobError } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select('id, tenant_id, status')
      .eq('id', jobcardId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Don't allow adding tasks to completed jobs
    if (job.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot add tasks to a completed job' },
        { status: 400 }
      )
    }

    // If inventory item specified, verify it exists and get price
    if (input.inventoryItemId) {
      const { data: item, error: itemError } = await supabase
        .schema('tenant')
        .from('inventory_items')
        .select('id, sell_price, stock_on_hand, stock_reserved')
        .eq('id', input.inventoryItemId)
        .eq('tenant_id', tenantId)
        .single()

      if (itemError || !item) {
        return NextResponse.json({ error: 'Inventory item not found' }, { status: 400 })
      }

      // Auto-fill price snapshot if not provided
      if (input.unitPriceSnapshot === undefined) {
        input.unitPriceSnapshot = Number(item.sell_price)
      }

      // Warn if stock is low (but don't block)
      const available = Number(item.stock_on_hand) - Number(item.stock_reserved || 0)
      if (input.qty && input.qty > available) {
        // Include warning in response
        console.warn(`Low stock warning: requested ${input.qty}, available ${available}`)
      }
    }

    const repository = new SupabaseTaskRepository(supabase, tenantId)
    const task = await repository.create({
      jobcardId,
      taskName: input.taskName,
      description: input.description,
      actionType: input.actionType as TaskActionType,
      inventoryItemId: input.inventoryItemId,
      qty: input.qty,
      unitPriceSnapshot: input.unitPriceSnapshot,
      laborCostSnapshot: input.laborCostSnapshot,
      taxRateSnapshot: input.taxRateSnapshot,
      createdBy: user.id,
    })

    // Sync task to estimate for customer visibility
    try {
      const syncService = new TaskEstimateSyncService(supabase, tenantId)
      await syncService.syncTaskToEstimate(task)
    } catch (syncError) {
      // Log but don't fail - estimate sync is non-critical
      console.warn('[Tasks API] Failed to sync task to estimate:', syncError)
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
