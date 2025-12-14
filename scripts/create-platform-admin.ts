/**
 * scripts/create-platform-admin.ts
 * Hardened disposable script to create a platform admin (auth user + platform_admins row)
 *
 * Usage:
 *  - Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *  - Run: npx tsx scripts/create-platform-admin.ts
 *
 * NOTE: This script uses the service_role key. Keep it secret. Run locally or on a secure CI job.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.warn('⚠️  .env.local not found — falling back to process.env')
}

// CONFIG - change only for local testing
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@admin.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123' // change in real use
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Super Admin'
const ADMIN_PHONE = process.env.ADMIN_PHONE ?? ''

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Small helper to set app_metadata (role) via admin API
async function setPlatformAdminClaims(supabaseAdmin: SupabaseClient, userId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: {
        role: 'platform_admin'
      }
    })
    if (error) return { success: false, error }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err }
  }
}

async function run() {
  try {
    console.log('ℹ️  Creating platform admin — using service role (must be local/secure)')
    // 1) Attempt to create the auth user
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: ADMIN_NAME, phone: ADMIN_PHONE }
    })

    let userId: string | null = null

    if (createError) {
      console.warn('⚠️  createUser error:', createError.message)
      // if user already exists, attempt to find it
      if ((createError as any).message?.includes?.('already registered') || (createError as any).status === 400) {
        console.log('ℹ️  User appears to already exist — searching by email...')
        const listResp = await supabase.auth.admin.listUsers()
        if (listResp.error) {
          console.error('❌ Could not list users:', listResp.error.message || listResp.error)
          process.exit(1)
        }
        const users = (listResp.data as any)?.users ?? []
        const existing = users.find((u: any) => u.email === ADMIN_EMAIL)
        if (!existing) {
          console.error('❌ Could not find existing user after createUser error')
          process.exit(1)
        }
        userId = existing.id
        console.log('✅ Found existing user id:', userId)
      } else {
        console.error('❌ createUser failed:', createError)
        process.exit(1)
      }
    } else {
      if (!createData || !createData.user) {
        console.error('❌ createUser returned no user data', createData)
        process.exit(1)
      }
      userId = createData.user.id
      console.log('✅ Auth user created:', userId)
    }

    // 2) Set app_metadata (role = platform_admin)
    console.log('ℹ️  Setting app_metadata.role = platform_admin for user:', userId)
    const setRes = await setPlatformAdminClaims(supabase, userId as string)
    if (!setRes.success) {
      console.error('❌ Failed to set JWT claims:', setRes.error)
      // optional rollback: delete newly created user, but only if we just created it
      process.exit(1)
    }
    console.log('✅ app_metadata updated. (Note: existing tokens need refresh to pick this up)')

    // 3) Insert into public.platform_admins (idempotent insert if exists)
    console.log('ℹ️  Inserting platform_admins row...')
    const { data: existingRow, error: selectErr } = await supabase
      .from('platform_admins')
      .select('id, auth_user_id')
      .eq('auth_user_id', userId)
      .maybeSingle()

    if (selectErr) {
      console.error('❌ Error checking platform_admins table:', selectErr)
      process.exit(1)
    }

    if (existingRow) {
      console.log('ℹ️  platform_admins row already exists for this user:', existingRow.id)
      console.log('🎉 Done — platform admin is configured.')
      process.exit(0)
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('platform_admins')
      .insert([{
        auth_user_id: userId,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: 'platform_admin',
        phone: ADMIN_PHONE,
        is_active: true,
        metadata: { created_via: 'disposable_script', created_at: new Date().toISOString(), initial_admin: true }
      }])
      .select()
      .single()

    if (insertErr) {
      console.error('❌ Failed to insert platform_admins row:', insertErr)
      process.exit(1)
    }

    console.log('✅ platform_admins row inserted with id:', (inserted as any).id)
    console.log('🎉 Platform admin created successfully — userId:', userId)
    console.log('ℹ️  IMPORTANT: Have the new user sign in (or refresh token) to pick up the new app_metadata in JWTs.')

  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

run()
