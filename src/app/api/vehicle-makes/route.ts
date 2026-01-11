import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Vehicle makes are in the public schema and available to all tenants
    const { data, error } = await supabase
      .from('vehicle_make')
      .select('id, name, code')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching vehicle makes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle makes' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data || [])
  } catch (error: unknown) {
    console.error('Error fetching vehicle makes:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch vehicle makes'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
