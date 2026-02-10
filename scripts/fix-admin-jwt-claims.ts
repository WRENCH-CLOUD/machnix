/**
 * Quick Fix Script - Set JWT Claims for Existing Admin
 * 
 * Run this to fix the existing platform admin user by setting their JWT claims.
 * This resolves the infinite recursion error.
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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixAdminJwtClaims() {
  console.log('🔧 Fixing JWT claims for existing platform admins...\n')

  try {
    // Get all platform admins
    const { data: admins, error: fetchError } = await supabaseAdmin
      .from('platform_admins')
      .select('auth_user_id, email, name')

    if (fetchError) {
      console.error('❌ Error fetching admins:', fetchError.message)
      process.exit(1)
    }

    if (!admins || admins.length === 0) {
      console.log('⚠️  No platform admins found')
      return
    }

    console.log(`📊 Found ${admins.length} platform admin(s)\n`)

    for (const admin of admins) {
      console.log(`Processing: ${admin.email} (${admin.name})`)

      // Set JWT claims
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        admin.auth_user_id,
        {
          app_metadata: {
            role: 'platform_admin'
          }
        }
      )

      if (error) {
        console.log(`  ❌ Failed: ${error.message}\n`)
      } else {
        console.log(`  ✅ JWT claims set successfully`)
        console.log(`  📋 Claims: { role: 'platform_admin' }\n`)
      }
    }

    console.log('✅ All platform admins updated!')
    console.log('\n💡 Next steps:')
    console.log('   1. Log out and log back in')
    console.log('   2. Your JWT will now contain role: platform_admin')
    console.log('   3. RLS policies will work without infinite recursion')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

fixAdminJwtClaims()
