import { SupabaseClient } from '@supabase/supabase-js'
import { Tenant, TenantStatus } from '../domain/tenant.entity'
import { TenantStats } from '../domain/tenant-stats.entity'
import { TenantRepository } from './tenant.repository'

import { TenantSettings } from '../domain/tenant-settings.entity'

export class AdminSupabaseTenantRepository implements TenantRepository {
  constructor(private readonly supabase: SupabaseClient) {}
  
  async getSettings(tenantId: string): Promise<TenantSettings | null> {
    return null
  }

  async updateSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<void> {
    // Not implemented for admin
  }

  async markOnboarded(tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .update({ is_onboarded: true })
      .eq('id', tenantId)

    if (error) throw error
  }

  /**
   * Transform database row to domain entity
   * Converts snake_case to camelCase
   */
  private toDomain(row: any): Tenant {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug || '',
      status: row.status,
      subscription: row.subscription,
      isOnboarded: row.is_onboarded ?? false,
      createdAt: new Date(row.created_at),
    }
  }

  async findById(id: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? this.toDomain(data) : null
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    return data ? this.toDomain(data) : null
  }

  async findAll(): Promise<Tenant[]> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map((row) => this.toDomain(row))
  }

  async getStats(tenantId: string): Promise<TenantStats> {
    // Use the admin overview view for consistent stats without per-table queries
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('admin_tenant_overview')
      .select('customer_count, active_jobs, completed_jobs, mechanic_count, total_revenue')
      .eq('id', tenantId)
      .maybeSingle()

    if (error) throw error

    return {
      customer_count: data?.customer_count || 0,
      active_jobs: data?.active_jobs || 0,
      completed_jobs: data?.completed_jobs || 0,
      mechanic_count: data?.mechanic_count || 0,
      total_revenue: data?.total_revenue || 0,
    }
  }

  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .select('id')
      .eq('slug', slug)

    if (error) throw error
    return (data || []).length === 0
  }

  async create(input: { name: string; slug: string; subscription: string; status: TenantStatus }): Promise<Tenant> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .insert(input as any)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getRecentJobs(tenantId: string, limit: number = 5): Promise<any[]> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .select(`
        id,
        job_number,
        status,
        created_at,
        vehicle_id,
        customer:customers(name)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    if (!data?.length) return []

    // Fetch vehicles separately (now in tenant schema)
    const vehicleIds = data.map(job => job.vehicle_id).filter(Boolean)
    const { data: vehicles } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select('id, reg_no')
      .in('id', vehicleIds)
    
    const vehicleMap = new Map((vehicles || []).map(v => [v.id, v]))

    return data.map(job => {
      const vehicle = vehicleMap.get(job.vehicle_id)
      const customer = job.customer as unknown as { name: string } | null
      return {
        id: job.job_number || job.id,
        customer: customer?.name || 'Unknown',
        vehicle: vehicle?.reg_no || 'Unknown',
        status: job.status,
        priority: 'Medium' // Default since it's not in schema
      }
    })
  }
}