import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Supabase Admin Client
 * 
 * This client uses the service role key which bypasses Row Level Security (RLS).
 * 
 * ⚠️ WARNING: Only use this for admin operations that require bypassing RLS
 * 
 * Use cases:
 * - Creating new tenants and their admin users
 * - Cross-tenant admin operations
 * - User management (create, delete, update auth users)
 * - System-level reports and analytics
 * 
 * DO NOT use for:
 * - Regular tenant-scoped operations
 * - User-facing API endpoints
 * - Any operation that should respect tenant isolation
 * 
 * @returns Supabase client with admin privileges
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
