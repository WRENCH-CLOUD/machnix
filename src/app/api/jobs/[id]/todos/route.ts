import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, validateRouteId, RATE_LIMITS } from '@/lib/auth/api-guard'

interface TodoItem {
  id: string
  text: string
  completed: boolean
  status: "changed" | "repaired" | "no_change" | null
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

    const idError = validateRouteId(id, 'job')
    if (idError) return idError

    const guard = await apiGuard(request, { rateLimitAction: 'update-job-todos' })
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const body = await request.json()
    const { todos } = body as { todos: TodoItem[] }

    if (!Array.isArray(todos)) {
      
      return NextResponse.json(
        { error: 'todos must be an array' },
        { status: 400 }
      )
    }

    // Validate todos payload (align with create job constraints)
    const MAX_TODOS = 50
    const MAX_TEXT_LENGTH = 500
    if (todos.length > MAX_TODOS) {
      return NextResponse.json(
        { error: `A maximum of ${MAX_TODOS} todos is allowed` },
        { status: 400 }
      )
    }
    for (let index = 0; index < todos.length; index++) {
      const todo = todos[index] as TodoItem
      if (!todo || typeof todo.text !== 'string') {
        return NextResponse.json(
          { error: `Todo at index ${index} must have a text property of type string` },
          { status: 400 }
        )
      }
      const text = todo.text.trim()
      if (text.length === 0 || text.length > MAX_TEXT_LENGTH) {
        return NextResponse.json(
          { error: `Todo text at index ${index} must be between 1 and ${MAX_TEXT_LENGTH} characters` },
          { status: 400 }
        )
      }
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

    const idError = validateRouteId(id, 'job')
    if (idError) return idError

    const guard = await apiGuard(request, { rateLimit: RATE_LIMITS.READ, rateLimitAction: 'get-job-todos' })
    if (!guard.ok) return guard.response
    const { supabase } = guard

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
