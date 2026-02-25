import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUserRateLimit, RATE_LIMITS, createRateLimitResponse } from '@/lib/rate-limiter'

export async function PATCH(
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

    // Rate limit by user
    const rateLimitResult = checkUserRateLimit(user.id, RATE_LIMITS.WRITE, 'update-job-notes')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const tenantId = user.app_metadata.tenant_id || user.user_metadata.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

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
