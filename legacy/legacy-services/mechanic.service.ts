import { supabase, ensureTenantContext } from '../../lib/supabase/client'
import type { Database } from '../../lib/supabase/types'

type Mechanic = Database['tenant']['Tables']['mechanics']['Row']
type MechanicInsert = Database['tenant']['Tables']['mechanics']['Insert']
type MechanicUpdate = Database['tenant']['Tables']['mechanics']['Update']
type User = Database['tenant']['Tables']['users']['Row']

export class MechanicService {
  /**
   * Get all mechanics for the current tenant
   */
  static async getMechanics(): Promise<Mechanic[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('mechanics')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  }

  /**
   * Get all active mechanics for the current tenant
   * Alias for getMechanics - can be filtered if there's an is_active column
   */
  static async getActive(): Promise<Mechanic[]> {
    return this.getMechanics()
  }

  /**
   * Get a single mechanic by ID
   */
  static async getMechanicById(mechanicId: string): Promise<Mechanic> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('mechanics')
      .select('*')
      .eq('id', mechanicId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Create a new mechanic
   */
  static async createMechanic(mechanic: Omit<MechanicInsert, 'tenant_id' | 'id' | 'created_at'>): Promise<Mechanic> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('mechanics')
      .insert({
        ...mechanic,
        tenant_id: tenantId,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update a mechanic
   */
  static async updateMechanic(mechanicId: string, updates: MechanicUpdate): Promise<Mechanic> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('mechanics')
      .update(updates)
      .eq('id', mechanicId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete a mechanic
   */
  static async deleteMechanic(mechanicId: string): Promise<void> {
    const tenantId = ensureTenantContext()
    
    const { error } = await supabase
      .schema('tenant')
      .from('mechanics')
      .delete()
      .eq('id', mechanicId)
      .eq('tenant_id', tenantId)
    
    if (error) throw error
  }

  /**
   * Get all users (all roles) for the current tenant
   */
  static async getAllUsers(): Promise<User[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  }

  /**
   * Get current user's profile
   */
  static async getCurrentUserProfile(authUserId: string): Promise<User | null> {
    const { data, error } = await supabase
      .schema('tenant')
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('users')
      .update(updates)
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
