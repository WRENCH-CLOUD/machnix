import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, validateRouteId, RATE_LIMITS } from '@/lib/auth/api-guard'

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await (context.params as any)
    const id = (resolvedParams as { id: string }).id

    const idError = validateRouteId(id, 'job')
    if (idError) return idError

    const guard = await apiGuard(request, { rateLimit: RATE_LIMITS.WRITE, rateLimitAction: 'update-job-notes' })
    if (!guard.ok) return guard.response
    const { supabase, tenantId } = guard

    const body = await request.json()
    const { notes } = body as { notes: string }

    if (typeof notes !== 'string') {
      return NextResponse.json(
        { error: 'notes must be a string' },
        { status: 400 }
      )
    }

    // Validate notes length
    const MAX_NOTES_LENGTH = 500 // limit to max 500 words length in notes
    if (notes.length > MAX_NOTES_LENGTH) {
      return NextResponse.json(
        { error: `Notes must be at most ${MAX_NOTES_LENGTH} characters` },
        { status: 400 }
      )
    }

    // Get current job to merge with existing details
    // RLS policy handles tenant isolation
    const { data: existingJob, error: fetchError } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select('details, tenant_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Verify tenant matches (defense in depth)
    if (existingJob.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Merge notes into existing details JSONB (stored as complaints for compatibility)
    const currentDetails = existingJob.details || {}
    const updatedDetails = {
      ...currentDetails,
      complaints: notes,
    }

    delete updatedDetails.notes
    delete updatedDetails.description

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
      console.error('Error updating job notes:', error)
      return NextResponse.json(
        { error: 'Failed to update notes', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notes: data?.details?.complaints || '',
    })
  } catch (error) {
    console.error('Error in PATCH /api/jobs/[id]/notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
