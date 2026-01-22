import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'

interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
  completedAt?: string
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any)
    const id = (resolvedParams as { id: string }).id

    console.log('[todos/PATCH] Updating todos for job:', id)

    // Validate ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      console.log('[todos/PATCH] Invalid job ID format:', id)
      return NextResponse.json({ error: 'Invalid job ID format' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[todos/PATCH] Unauthorized - no user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit by user
    const rateLimitResult = checkUserRateLimit(user.id, RATE_LIMITS.WRITE, 'update-job-todos')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
    if (!tenantId) {
      console.log('[todos/PATCH] Tenant context missing for user:', user.id)
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    console.log('[todos/PATCH] User:', user.id, 'Tenant:', tenantId)

    const body = await request.json()
    const { todos } = body as { todos: TodoItem[] }

    console.log('[todos/PATCH] Received todos:', JSON.stringify(todos).substring(0, 200))

    if (!Array.isArray(todos)) {
      return NextResponse.json(
        { error: 'todos must be an array' },
        { status: 400 }
      )
    }

    // Get current job to merge with existing details
    // RLS policy handles tenant isolation, but we add tenant_id for safety
    const { data: existingJob, error: fetchError } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select('details, tenant_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching job for todos update:', fetchError)
      return NextResponse.json(
        { error: 'Job not found', details: fetchError.message },
        { status: 404 }
      )
    }
    
    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Verify tenant matches (defense in depth)
    if (existingJob.tenant_id !== tenantId) {
      console.error('[todos/PATCH] Tenant mismatch:', existingJob.tenant_id, '!=', tenantId)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Merge todos into existing details JSONB
    const currentDetails = existingJob.details || {}
    const updatedDetails = {
      ...currentDetails,
      todos,
    }

    console.log('[todos/PATCH] Updating with details:', JSON.stringify(updatedDetails).substring(0, 300))

    // Update the job with new details
    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .update({
        details: updatedDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, details')
      .single()

    if (error) {
      console.error('Error updating job todos:', error)
      return NextResponse.json(
        { error: 'Failed to update todos', details: error.message, code: error.code },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Update returned no data - possible RLS policy issue' },
        { status: 500 }
      )
    }

    console.log('[todos/PATCH] Successfully updated todos for job:', id)

    return NextResponse.json({
      success: true,
      todos: data.details?.todos || [],
    })
  } catch (error) {
    console.error('Error in PATCH /api/jobs/[id]/todos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any)
    const id = (resolvedParams as { id: string }).id

    // Validate ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid job ID format' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const { data: job, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select('details')
      .eq('id', id)
      .single()

    if (error || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      todos: job.details?.todos || [],
    })
  } catch (error) {
    console.error('Error in GET /api/jobs/[id]/todos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
