/**
 * scripts/check-platform-admin.ts
 * Safe check script that avoids using global console (uses direct stdout/stderr).
 *
 * Run: npx tsx scripts/check-platform-admin.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) dotenv.config({ path: envPath })

// Simple safe logger that writes directly to stdout / stderr to avoid any global console mutation.
const logger = {
  log: (...args: any[]) => process.stdout.write(args.map(String).join(' ') + '\n'),
  info: (...args: any[]) => process.stdout.write(args.map(String).join(' ') + '\n'),
  warn: (...args: any[]) => process.stderr.write(args.map(String).join(' ') + '\n'),
  error: (...args: any[]) => process.stderr.write(args.map(String).join(' ') + '\n'),
}

// Use nullish coalescing consistently to avoid mixing "??" with "||"
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}
if (!SUPABASE_ANON_KEY) {
  logger.warn('Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. The anon test will be skipped.')
}

// Prefer explicit token behavior in Node scripts
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

async function checkPlatformAdmin() {
  try {
    logger.info('🔍 Checking platform_admins table (service_role)...')
    const { data: admins, error: adminListErr } = await adminClient
      .from('platform_admins')
      .select('id, auth_user_id, email, name, role, is_active')

    if (adminListErr) {
      logger.error('❌ Error fetching platform_admins with service_role:', JSON.stringify(adminListErr))
      process.exit(2)
    }

    // logger.info('📊 Platform Admins Found:', Array.isArray(admins) ? admins.length : 0)
    (admins || []).forEach((a: any, i: number) => {
      logger.info(`Admin #${i + 1}: id=${a.id} auth_user_id=${a.auth_user_id} email=${a.email} role=${a.role} active=${a.is_active}`)
    })

    if (!SUPABASE_ANON_KEY) {
      logger.warn('Skipping anon sign-in test because anon key missing.')
      process.exit(0)
    }

    // Use the same SUPABASE_URL and disable autoRefreshToken for Node
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

    logger.info('\n🔑 Signing in (anon client) as admin to test RLS...')
    const email = process.env.CHECK_ADMIN_EMAIL || 'admin@mechanix.com'
    const password = process.env.CHECK_ADMIN_PASSWORD || 'admin123'

    let signInRes
    try {
      signInRes = await anonClient.auth.signInWithPassword({ email, password })
    } catch (e) {
      logger.error('❌ Sign-in threw an exception (anon client):', String(e))
      logger.error('   Check SUPABASE_URL and ANON key are from the same project.')
      process.exit(3)
    }

    if (signInRes.error) {
      logger.error('❌ Sign-in failed (anon client):', JSON.stringify(signInRes.error))
      logger.error('   If status=500/unexpected_failure, verify:')
      logger.error('   - SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY point to the same project')
      logger.error('   - Email/password auth is enabled and password policy allows the provided password')
      logger.error('   - The user exists and email is confirmed (this script sets email_confirm: true in creation)')
      process.exit(3)
    }

    const session = signInRes.data.session
    const user = signInRes.data.user
    if (!session || !user) {
      logger.error('❌ Sign-in succeeded but no session/user returned.')
      process.exit(4)
    }

    logger.info('✅ Signed in as:', user.email, 'user id:', user.id)
    // print token partially (trimmed) and full to file for decoding if needed
    const token = session.access_token || ''
    logger.info('ℹ️  Access token (trim 160 chars):', String(token).slice(0, 160))
    try {
      // optionally write full token to a local file so you can decode safely (local only)
      const dumpPath = path.join(process.cwd(), '.last_admin_token.txt')
      fs.writeFileSync(dumpPath, token, { encoding: 'utf8' })
      logger.info(`Wrote full access token to ${dumpPath} (local only). You can decode it with jwt.io or jose.`)
    } catch (e) {
      logger.warn('Could not write token to file:', String(e))
    }

    logger.info('\n🔍 Querying platform_admins as signed-in user (via anon client)...')
    const { data: visibleAdmin, error: visibleErr } = await anonClient
      .from('platform_admins')
      .select('id, auth_user_id, role, is_active')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (visibleErr) {
      logger.error('❌ Error querying platform_admins as user:', JSON.stringify(visibleErr))
      process.exit(5)
    }

    if (!visibleAdmin) {
      logger.warn('⚠️  No platform_admin row visible to the signed-in user. Possible causes:')
      logger.warn('  - Missing role in JWT (app_metadata not present in token), or')
      logger.warn('  - RLS policies blocking the view, or')
      logger.warn('  - platform_admins row missing for this auth_user_id')
      process.exit(6)
    }

    logger.info('✅ Platform admin visible to user:', JSON.stringify(visibleAdmin))
    logger.info('🎉 RLS check passed: signed-in user can see their platform_admins row.')
    process.exit(0)
  } catch (err) {
    logger.error('❌ Unexpected error in checkPlatformAdmin:', String(err))
    process.exit(99)
  }
}

checkPlatformAdmin()
