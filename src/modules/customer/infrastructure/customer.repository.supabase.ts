import { CustomerRepository } from '../domain/customer.repository'
import { Customer, CustomerWithVehicles } from '../domain/customer.entity'
import { BaseSupabaseRepository } from '@/shared/infrastructure/base-supabase.repository'
import { escapePostgrestOperator } from '@/lib/utils/escape-postgrest'

/**
 * Supabase implementation of CustomerRepository
 */
export class SupabaseCustomerRepository extends BaseSupabaseRepository<Customer> implements CustomerRepository {
  /**
   * Transform database row to domain entity
   */
  protected toDomain(row: any): Customer {
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
  protected toDatabase(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): any {
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

    // Fetch customers
    const { data: customers, error } = await this.supabase
      .schema('tenant')
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (error) throw error
    if (!customers?.length) return []

    // Fetch vehicles separately (now in tenant schema)
    const customerIds = customers.map(c => c.id)
    const { data: vehicles } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('customer_id', customerIds)

    // Fetch jobcards for job count stats
    const { data: jobcards } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .select('id, customer_id, created_at')
      .eq('tenant_id', tenantId)
      .in('customer_id', customerIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Group vehicles by customer_id
    const vehiclesByCustomer = (vehicles || []).reduce((acc: Record<string, any[]>, v) => {
      if (!acc[v.customer_id]) acc[v.customer_id] = []
      acc[v.customer_id].push(v)
      return acc
    }, {})

    // Group jobcards by customer_id
    const jobcardsByCustomer = (jobcards || []).reduce((acc: Record<string, any[]>, j) => {
      if (!acc[j.customer_id]) acc[j.customer_id] = []
      acc[j.customer_id].push(j)
      return acc
    }, {})

    return customers.map(row => ({
      ...this.toDomain(row),
      vehicles: vehiclesByCustomer[row.id] || [],
      jobcards: jobcardsByCustomer[row.id] || [],
    }))
  }


  async findById(id: string): Promise<CustomerWithVehicles | null> {
    const tenantId = this.getContextTenantId()

    const { data: customer, error } = await this.supabase
      .schema('tenant')
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    if (!customer) return null

    // Fetch vehicles separately (now in tenant schema)
    const { data: vehicles } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_id', id)

    return {
      ...this.toDomain(customer),
      vehicles: vehicles || [],
    }
  }

  async search(query: string): Promise<Customer[]> {
    const tenantId = this.getContextTenantId()
    // Escape special characters to prevent filter injection
    const safeQuery = escapePostgrestOperator(query.trim())

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`name.ilike.%${safeQuery}%,phone.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%`)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async searchByPhone(phone: string): Promise<Customer | null> {
    const tenantId = this.getContextTenantId()

    // Clean up phone number
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    // Escape special characters to prevent filter injection
    const safePhone = escapePostgrestOperator(phone)
    const safeCleanPhone = escapePostgrestOperator(cleanPhone)

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`phone.eq.${safePhone},phone.eq.${safeCleanPhone},phone.ilike.%${safeCleanPhone}%`)
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
