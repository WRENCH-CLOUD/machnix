import { supabase, ensureTenantContext } from '../../lib/supabase/client'
import type { Database } from '../../lib/supabase/types'

type Customer = Database['tenant']['Tables']['customers']['Row']
type CustomerInsert = Database['tenant']['Tables']['customers']['Insert']
type CustomerUpdate = Database['tenant']['Tables']['customers']['Update']
type Vehicle = Database['tenant']['Tables']['vehicles']['Row']

export interface CustomerWithVehicles extends Customer {
  vehicles?: Vehicle[]
}

export class CustomerService {
  /**
   * Get all customers for the current tenant
   */
  static async getCustomers(): Promise<CustomerWithVehicles[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('customers')
      .select(`
        *,
        vehicles:vehicles(*)
      `)
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data as CustomerWithVehicles[]
  }

  /**
   * Get a single customer by ID
   */
  static async getCustomerById(customerId: string): Promise<CustomerWithVehicles> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('customers')
      .select(`
        *,
        vehicles:vehicles(*)
      `)
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) throw error
    return data as CustomerWithVehicles
  }

  /**
   * Search customers by name, phone, or email
   */
  static async searchCustomers(query: string): Promise<Customer[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  }

  /**
   * Search customer by phone number (exact or partial match)
   */
  static async searchByPhone(phone: string): Promise<Customer | null> {
    const tenantId = ensureTenantContext()
    
    // Clean up phone number - remove spaces and special chars for comparison
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`phone.eq.${phone},phone.eq.${cleanPhone},phone.ilike.%${cleanPhone}%`)
      .limit(1)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  /**
   * Create a new customer (alias)
   */
  static async create(customer: Omit<CustomerInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const { data, error } = await supabase
      .schema('tenant')
      .from('customers')
      .insert(customer)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Create a new customer
   */
  static async createCustomer(customer: Omit<CustomerInsert, 'tenant_id' | 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('customers')
      .insert({
        ...customer,
        tenant_id: tenantId,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update a customer
   */
  static async updateCustomer(customerId: string, updates: CustomerUpdate): Promise<Customer> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(customerId: string): Promise<void> {
    const tenantId = ensureTenantContext()
    
    const { error } = await supabase
      .schema('tenant')
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
    
    if (error) throw error
  }
}
