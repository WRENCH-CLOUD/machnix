import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'mechanix-auth',
  },
})

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
