import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isAuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const makeId = searchParams.get('makeId')

    if (!makeId) {
      return NextResponse.json({ error: 'makeId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    // Vehicle models are in the public schema and available to all tenants
    const { data, error } = await supabase
      .from('vehicle_model')
      .select('id, name, model_code, vehicle_category')
      .eq('make_id', makeId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching vehicle models:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle models' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: unknown) {
    console.error('Error fetching vehicle models:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch vehicle models'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
