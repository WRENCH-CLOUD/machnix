/**
 * scripts/check-platform-admin-raw.ts
 * Ultra-minimal, raw-I/O check to bypass any global console/logger mutation.
 * Run: npx tsx scripts/check-platform-admin-raw.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

// tiny raw writers
function out(...parts: any[]) { try { fs.writeSync(1, parts.map(String).join(' ') + '\n'); } catch (e) { /* ignore */ } }
function err(...parts: any[]) { try { fs.writeSync(2, parts.map(String).join(' ') + '\n'); } catch (e) { /* ignore */ } }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  err('FATAL: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function run() {
  try {
    out('STEP 1: listing platform_admins (service_role)');
    const { data: admins, error: adminErr } = await adminClient
      .from('platform_admins')
      .select('id, auth_user_id, email, name, role, is_active');

    if (adminErr) {
      err('ERROR: fetching platform_admins:', JSON.stringify(adminErr));
      process.exit(2);
    }

    out('platform_admins count:', Array.isArray(admins) ? admins.length : 0);
    if (admins && admins.length) {
      for (let i = 0; i < admins.length; i++) {
        const a = admins[i];
        out(`admin[${i}] id=${a.id} auth_user_id=${a.auth_user_id} email=${a.email} role=${a.role} active=${a.is_active}`);
      }
    }

    if (!SUPABASE_ANON_KEY) {
      out('WARN: NEXT_PUBLIC_SUPABASE_ANON_KEY missing; skipping anon sign-in test.');
      process.exit(0);
    }

    out('STEP 2: signing in as admin via anon client (to test RLS)');

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

    const email = process.env.CHECK_ADMIN_EMAIL || 'admin@machnix.com';
    const password = process.env.CHECK_ADMIN_PASSWORD || 'admin123';

    const signIn = await anonClient.auth.signInWithPassword({ email, password });

    if (signIn.error) {
      err('ERROR: signIn failed:', JSON.stringify(signIn.error));
      process.exit(3);
    }

    const session = signIn.data?.session;
    const user = signIn.data?.user;
    if (!session || !user) {
      err('ERROR: no session/user returned from signIn response');
      process.exit(4);
    }

    out('Signed-in user id:', user.id, 'email:', user.email);
    // write full access token to local file for offline decoding
    try {
      fs.writeFileSync(path.join(process.cwd(), '.last_admin_token.txt'), session.access_token || '', { encoding: 'utf8' });
      out('Wrote full token to .last_admin_token.txt (local only)');
    } catch (e) {
      err('WARN: could not write token file:', String(e));
    }

    out('STEP 3: query platform_admins as signed-in user (RLS path)');
    const { data: visible, error: visibleErr } = await anonClient
      .from('platform_admins')
      .select('id, auth_user_id, role, is_active')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (visibleErr) {
      err('ERROR: query as user failed:', JSON.stringify(visibleErr));
      process.exit(5);
    }

    if (!visible) {
      out('RESULT: No platform_admin row visible to the signed-in user. Possible reasons:');
      out(' - JWT does not carry "role" claim (app_metadata not in token)');
      out(' - RLS policy blocks the query');
      out(' - platform_admins row missing for this auth_user_id');
      process.exit(6);
    }

    out('SUCCESS: platform_admins visible to signed-in user:', JSON.stringify(visible));
    process.exit(0);

  } catch (e) {
    err('UNEXPECTED ERROR:', String(e));
    process.exit(99);
  }
}

run();
