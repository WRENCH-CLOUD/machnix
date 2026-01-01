import { supabase } from '../client'
import type { Database } from '../types'

export type Tenant = Database['tenant']['Tables']['tenants']['Row']
export type TenantInsert = Database['tenant']['Tables']['tenants']['Insert']
export type TenantUpdate = Database['tenant']['Tables']['tenants']['Update']

// Extended tenant type with computed stats
export interface TenantWithStats extends Tenant {
  customer_count?: number
  active_jobs?: number
  completed_jobs?: number
  mechanic_count?: number
  total_revenue?: number
  status?: 'active' | 'suspended' | 'trial'
  subscription?: 'starter' | 'pro' | 'enterprise'
}

/**
 * Fetch all tenants with their stats
 */
export async function getAllTenants(): Promise<TenantWithStats[]> {
  const { data, error } = await supabase
    .schema('tenant')
    .from('tenant_stats_view')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tenants:', error)
    throw error
  }

  // Map the view data to TenantWithStats
  // The view returns: id, name, slug, created_at, metadata, customer_count, active_jobs, completed_jobs, mechanic_count, total_revenue
  return data.map((tenant: any) => ({
    ...tenant,
    // Add missing fields not in the view (status, subscription)
    status: 'active' as const,
    subscription: 'pro' as const,
  }))
}

/**
 * Get a single tenant by ID
 */
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .schema('tenant')
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error) {
    console.error('Error fetching tenant:', error)
    throw error
  }

  return data
}

/**
 * Get tenant with detailed stats
 */
export async function getTenantWithStats(tenantId: string): Promise<TenantWithStats | null> {
  const { data, error } = await supabase
    .schema('tenant')
    .from('tenant_stats_view')
    .select('*')
    .eq('id', tenantId)
    .single()
  
  if (error) {
    console.error('Error fetching tenant with stats:', error)
    throw error
  }

  if (!data) {
    return null
  }

  return {
    ...data,
    status: 'active',
    subscription: 'pro',
  } as TenantWithStats
}

/**
 * Create a new tenant
 */
export async function createTenant(tenant: TenantInsert): Promise<Tenant> {
  const { data, error } = await supabase
    .schema('tenant')
    .from('tenants')
    .insert(tenant)
    .select()
    .single()

  if (error) {
    console.error('Error creating tenant:', error)
    throw error
  }

  return data
}

/**
 * Update a tenant
 */
export async function updateTenant(tenantId: string, updates: TenantUpdate): Promise<Tenant> {
  const { data, error } = await supabase
    .schema('tenant')
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)
    .select()
    .single()

  if (error) {
    console.error('Error updating tenant:', error)
    throw error
  }

  return data
}

/**
 * Delete a tenant
 */
export async function deleteTenant(tenantId: string): Promise<void> {
  const { error } = await supabase
    .schema('tenant')
    .from('tenants')
    .delete()
    .eq('id', tenantId)

  if (error) {
    console.error('Error deleting tenant:', error)
    throw error
  }
}

/**
 * Get tenant count by status
 */
export async function getTenantStats() {
  const { data: allTenants } = await supabase
    .schema('tenant')
    .from('tenants')
    .select('*')

  // For now, return basic stats
  // In production, this would calculate actual stats based on metadata
  return {
    total: allTenants?.length || 0,
    active: allTenants?.length || 0,
    trial: 0,
    suspended: 0,
  }
}
