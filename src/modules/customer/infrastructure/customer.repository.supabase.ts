import { CustomerRepository } from '../domain/customer.repository'
import { Customer, CustomerWithVehicles } from '../domain/customer.entity'
import { supabase as defaultSupabase, ensureTenantContext } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase implementation of CustomerRepository
 */
export class SupabaseCustomerRepository implements CustomerRepository {
  private supabase: SupabaseClient;
  private tenantId?: string;

  constructor(supabase?: SupabaseClient, tenantId?: string) {
    this.supabase = supabase || defaultSupabase;
    this.tenantId = tenantId;
  }

  private getContextTenantId(): string {
    return this.tenantId || ensureTenantContext();
  }

  /**
   * Transform database row to domain entity
   */
  private toDomain(row: any): Customer {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      deletedBy: row.deleted_by,
    }
  }

  /**
   * Transform database row with vehicles to domain entity
   */
  private toDomainWithVehicles(row: any): CustomerWithVehicles {
    return {
      ...this.toDomain(row),
      vehicles: row.vehicles || [],
    }
  }

  /**
   * Transform domain entity to database insert format
   */
  private toDatabase(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      tenant_id: customer.tenantId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
    }
  }

  async findAll(): Promise<CustomerWithVehicles[]> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('customers')
      .select(`
        *,
        vehicles:vehicles(*)
      `)
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomainWithVehicles(row))
  }

  async findById(id: string): Promise<CustomerWithVehicles | null> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('customers')
      .select(`
        *,
        vehicles:vehicles(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data ? this.toDomainWithVehicles(data) : null
  }

  async search(query: string): Promise<Customer[]> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async searchByPhone(phone: string): Promise<Customer | null> {
    const tenantId = this.getContextTenantId()

    // Clean up phone number
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`phone.eq.${phone},phone.eq.${cleanPhone},phone.ilike.%${cleanPhone}%`)
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data ? this.toDomain(data) : null
  }

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('customers')
      .insert(this.toDatabase(customer))
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('customers')
      .update(updates as any)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async delete(id: string): Promise<void> {
    const tenantId = this.getContextTenantId()

    const { error } = await this.supabase
      .schema('tenant')
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }
}
