import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
export const ensureTenantContext = () => {
  const tenantId = getTenantContext()
  if (!tenantId) {
    throw new Error('Tenant context not set. Please select a tenant.')
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
