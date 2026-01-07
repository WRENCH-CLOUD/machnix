import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { AuthError } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Use the standard anon key for client-side operations
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Allow build to succeed without env vars (they'll be available at runtime)
const isBuildTime = !supabaseUrl || !supabaseKey

const AUTH_STORAGE_KEY = 'machnix-auth'

// Create a single supabase client for interacting with your database
// Use placeholder values during build time to avoid breaking the build
export const supabase: SupabaseClient<Database> = isBuildTime
  ? (null as unknown as SupabaseClient<Database>)
  : createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: AUTH_STORAGE_KEY,
      },
    })

// Helper to get the supabase client with runtime validation
export const getSupabase = (): SupabaseClient<Database> => {
  if (!supabase) {
    throw new Error('Missing Supabase environment variables. Please check your environment configuration.')
  }
  return supabase
}

// Tenant context management
let currentTenantId: string | null = null

export const setTenantContext = async (tenantId: string) => {
  currentTenantId = tenantId
  // Store tenant ID in local storage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('tenantId', tenantId)
  }
}

export const getTenantContext = (): string | null => {
  if (currentTenantId) return currentTenantId
  
  // Try to get from local storage
  if (typeof window !== 'undefined') {
    currentTenantId = localStorage.getItem('tenantId')
  }
  
  return currentTenantId
}

export const clearTenantContext = () => {
  currentTenantId = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tenantId')
  }
}

const isRefreshTokenError = (error?: Pick<AuthError, 'code' | 'message'> | null) => {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  return error.code === 'refresh_token_not_found' || message.includes('invalid refresh token')
}

const clearLocalAuthState = () => {
  clearTenantContext()
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export const getSafeSession = async () => {
  // Avoid throwing during build where supabase is a placeholder
  if (!supabase) {
    return { session: null, error: new Error('Supabase client not initialized'), recovered: false }
  }

  try {
    const { data, error } = await supabase.auth.getSession()

    if (isRefreshTokenError(error)) {
      console.warn('[Supabase] Refresh token missing/invalid. Forcing sign-out.')
      try {
        await supabase.auth.signOut()
      } catch (signOutError) {
        console.error('[Supabase] Sign-out after refresh error failed:', signOutError)
      }
      clearLocalAuthState()
      return { session: null, error: null, recovered: true }
    }

    return { session: data.session, error: error ?? null, recovered: false }
  } catch (err) {
    return { session: null, error: err as Error, recovered: false }
  }
}

// Helper to ensure tenant context is set
export const ensureTenantContext = (): string => {
  const tenantId = getTenantContext()
  if (!tenantId) {
    const error = new Error('Tenant context not set. Please select a tenant or log in again.')
    error.name = 'TenantContextError'
    throw error
  }
  return tenantId
}

// Enhanced fetch that automatically includes tenant-id header
export async function fetchWithTenant(url: string, options: RequestInit = {}): Promise<Response> {
  const tenantId = getTenantContext()
  
  const headers = new Headers(options.headers)
  
  // Add tenant-id header if available
  if (tenantId) {
    headers.set('x-tenant-id', tenantId)
  }
  
  // Ensure Content-Type is set for POST/PUT/PATCH
  if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

// API helper methods with automatic tenant context
export const api = {
  get: (url: string, options?: RequestInit) => 
    fetchWithTenant(url, { ...options, method: 'GET' }),
  
  post: (url: string, body?: any, options?: RequestInit) => 
    fetchWithTenant(url, { 
      ...options, 
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  put: (url: string, body?: any, options?: RequestInit) => 
    fetchWithTenant(url, { 
      ...options, 
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  patch: (url: string, body?: any, options?: RequestInit) => 
    fetchWithTenant(url, { 
      ...options, 
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  delete: (url: string, options?: RequestInit) => 
    fetchWithTenant(url, { ...options, method: 'DELETE' }),
}

// Example usage:
// import { api } from '@/lib/supabase/client'
// const response = await api.get('/api/invoices/123')
// const data = await response.json()
