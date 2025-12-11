/**
 * Quick script to verify platform admin exists in database
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkPlatformAdmin() {
  console.log('🔍 Checking platform_admins table...\n')

  // Check with service role (bypasses RLS)
  const { data: admins, error } = await supabase
    .from('platform_admins')
    .select('*')

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('📊 Platform Admins Found:', admins?.length || 0)
  console.log('\n')
  
  admins?.forEach((admin, i) => {
    console.log(`Admin #${i + 1}:`)
    console.log('  ID:', admin.id)
    console.log('  Auth User ID:', admin.auth_user_id)
    console.log('  Email:', admin.email)
    console.log('  Name:', admin.name)
    console.log('  Role:', admin.role)
    console.log('  Is Active:', admin.is_active)
    console.log('  Created:', admin.created_at)
    console.log('\n')
  })

  // Now test with anon key (what the app uses)
  console.log('🔑 Testing with ANON key (simulating app login)...\n')
  
  const anonClient = createClient(
    SUPABASE_URL, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  // First, try to authenticate
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email: 'admin@mechanix.com',
    password: 'admin123'
  })

  if (authError) {
    console.error('❌ Auth failed:', authError.message)
    return
  }

  console.log('✅ Auth successful for:', authData.user.email)
  console.log('User ID:', authData.user.id)
  console.log('\n')

  // Now try to query platform_admins with authenticated user
  const { data: adminCheck, error: adminError } = await anonClient
    .from('platform_admins')
    .select('id, is_active, role')
    .eq('auth_user_id', authData.user.id)
    .eq('is_active', true)
    .single()

  console.log('🔍 Query result (what the app sees):')
  if (adminError) {
    console.error('❌ Error:', adminError.message)
    console.error('   Code:', adminError.code)
    console.error('   Details:', adminError.details)
    console.error('   Hint:', adminError.hint)
  } else {
    console.log('✅ Platform admin found!')
    console.log('   Data:', adminCheck)
  }
}

checkPlatformAdmin()
