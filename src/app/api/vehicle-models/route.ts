import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const makeId = searchParams.get('makeId')

    if (!makeId) {
      return NextResponse.json({ error: 'makeId is required' }, { status: 400 })
    }

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
