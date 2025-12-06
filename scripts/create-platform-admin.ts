/**
 * DISPOSABLE SCRIPT - Create Platform Admin
 * 
 * This script creates a platform admin user with an entry in both:
 * - auth.users (Supabase authentication)
 * - public.platform_admins (platform admin table)
 * 
 * Usage:
 * 1. Set your environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 * 2. Run: npx tsx scripts/create-platform-admin.ts
 * 3. Delete this script after use
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.warn('⚠️  .env.local not found, using system environment variables\n')
}

// Configuration - UPDATE THESE VALUES
const ADMIN_EMAIL = 'admin@mechanix.com'
const ADMIN_PASSWORD = 'admin123' 
const ADMIN_NAME = 'Super Admin'
const ADMIN_PHONE = '' // Optional

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗')
  process.exit(1)
}

// Create admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createPlatformAdmin() {


  try {
    // Step 1: Create auth.users entry
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: ADMIN_NAME,
        phone: ADMIN_PHONE
      }
    })

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message)
      
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists. Attempting to retrieve user ID...')
        
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) {
          console.error('❌ Error listing users:', listError.message)
          process.exit(1)
        }
        
        const existingUser = users.find(u => u.email === ADMIN_EMAIL)
        if (!existingUser) {
          console.error('❌ Could not find existing user')
          process.exit(1)
        }
        
        console.log('✅ Found existing user:', existingUser.id)
        
        // Step 2: Create platform_admins entry
        console.log('\n📝 Step 2: Creating platform_admins entry...')
        const { data: adminData, error: adminError } = await supabase
          .from('platform_admins')
          .insert({
            auth_user_id: existingUser.id,
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            role: 'admin', // Uses platform_admin_role enum
            phone: ADMIN_PHONE,
            is_active: true,
            metadata: {
              created_via: 'disposable_script',
              created_at: new Date().toISOString(),
              initial_admin: true
            }
          })
          .select()
          .single()

        if (adminError) {
          console.error('❌ Error creating platform_admins entry:', adminError.message)
          process.exit(1)
        }

        console.log('✅ Platform admin entry created:', adminData.id)
        printSuccessMessage(existingUser.id, adminData.id)
        return
      }
      
      process.exit(1)
    }

    if (!authData.user) {
      console.error('❌ No user data returned')
      process.exit(1)
    }

    console.log('✅ Auth user created:', authData.user.id)
    console.log('   Email:', authData.user.email)

    // Step 2: Create platform_admins entry
    console.log('\n📝 Step 2: Creating platform_admins entry...')
    const { data: adminData, error: adminError } = await supabase
      .from('platform_admins')
      .insert({
        auth_user_id: authData.user.id,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: 'admin', // Uses platform_admin_role enum
        phone: ADMIN_PHONE,
        is_active: true,
        metadata: {
          created_via: 'disposable_script',
          created_at: new Date().toISOString(),
          initial_admin: true
        }
      })
      .select()
      .single()

    if (adminError) {
      console.error('❌ Error creating platform_admins entry:', adminError.message)
      process.exit(1)
    }

    // Success!
    printSuccessMessage(authData.user.id, adminData.id)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

function printSuccessMessage(authUserId: string, platformAdminId: string) {
  console.log('\n🎉 Platform admin created successfully!')
}

// Run the script
createPlatformAdmin()
