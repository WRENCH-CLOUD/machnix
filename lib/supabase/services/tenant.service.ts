import { supabase } from '../client'
import type { Database } from '../types'

export type Tenant = Database['tenant']['Tables']['tenants']['Row']
export type TenantInsert = Database['tenant']['Tables']['tenants']['Insert']
export type TenantUpdate = Database['tenant']['Tables']['tenants']['Update']

// Extended tenant type with computed stats
// Note: status and subscription are now actual columns in the database, not computed
export interface TenantWithStats extends Tenant {
  customer_count?: number
  active_jobs?: number
  completed_jobs?: number
  mechanic_count?: number
  total_revenue?: number
}

/**
 * Fetch all tenants with their stats
 */
export async function getAllTenants(): Promise<TenantWithStats[]> {
  const { data, error } = await supabase
    .schema('tenant')
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tenants:', error)
    throw error
  }

  // Fetch stats for each tenant in parallel
  const tenantsWithStats = await Promise.all(
    data.map(async (tenant) => {
      try {
        // Get customer count
        const { count: customerCount } = await supabase
          .schema('tenant')
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)

        // Get active jobs count (using jobcards table)
        const { count: activeJobsCount } = await supabase
          .schema('tenant')
          .from('jobcards')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .in('status', ['pending', 'in_progress', 'on_hold'])

        // Get completed jobs count
        const { count: completedJobsCount } = await supabase
          .schema('tenant')
          .from('jobcards')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'completed')

        // Get mechanic count
        const { count: mechanicCount } = await supabase
          .schema('tenant')
          .from('mechanics')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)

        // Get total revenue from transactions
        const { data: payments } = await supabase
          .schema('tenant')
          .from('payments')
          .select('amount')
          .eq('tenant_id', tenant.id)

        const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

        return {
          ...tenant,
          customer_count: customerCount || 0,
          active_jobs: activeJobsCount || 0,
          completed_jobs: completedJobsCount || 0,
          mechanic_count: mechanicCount || 0,
          total_revenue: totalRevenue,
        }
      } catch (err) {
        console.error(`Error fetching stats for tenant ${tenant.id}:`, err)
        return {
          ...tenant,
          customer_count: 0,
          active_jobs: 0,
          completed_jobs: 0,
          mechanic_count: 0,
          total_revenue: 0,
        }
      }
    })
  )

  return tenantsWithStats
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
  const tenant = await getTenantById(tenantId)
  
  if (!tenant) {
    return null
  }

  // Get customer count
  const { count: customerCount } = await supabase
    .schema('tenant')
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  // Get active jobs count
  const { count: activeJobsCount } = await supabase
    .schema('tenant')
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'in_progress', 'on_hold'])

  // Get completed jobs count
  const { count: completedJobsCount } = await supabase
    .schema('tenant')
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')

  // Get mechanic count
  const { count: mechanicCount } = await supabase
    .schema('tenant')
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('role', 'mechanic')
    .eq('is_active', true)

  // Get total revenue from invoices
  const { data: invoices } = await supabase
    .schema('tenant')
    .from('invoices')
    .select('total_amount')
    .eq('tenant_id', tenantId)
    .eq('status', 'paid')

  const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

  return {
    ...tenant,
    customer_count: customerCount || 0,
    active_jobs: activeJobsCount || 0,
    completed_jobs: completedJobsCount || 0,
    mechanic_count: mechanicCount || 0,
    total_revenue: totalRevenue,
    status: 'active',
    subscription: 'pro',
  }
}

/**
 * Create a new tenant
 */
export async function createTenant(tenant: Omit<TenantInsert, 'id' | 'created_at'>): Promise<Tenant> {
  // Generate slug if not provided
  let slug = tenant.slug
  if (!slug && tenant.name) {
    slug = generateSlug(tenant.name)
    
    // Ensure slug is unique
    let counter = 1
    let finalSlug = slug
    while (!(await isSlugAvailable(finalSlug))) {
      finalSlug = `${slug}-${counter}`
      counter++
    }
    slug = finalSlug
  }

  const { data, error } = await supabase
    .schema('tenant')
    .from('tenants')
    .insert({ ...tenant, slug })
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
 * Get tenant by slug (for subdomain routing)
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .schema('tenant')
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching tenant by slug:', error)
    return null
  }
  return data
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string, excludeTenantId?: string): Promise<boolean> {
  let query = supabase
    .schema('tenant')
    .from('tenants')
    .select('id')
    .eq('slug', slug)

  if (excludeTenantId) {
    query = query.neq('id', excludeTenantId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error checking slug availability:', error)
    return false
  }

  return data.length === 0
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-')  // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
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
