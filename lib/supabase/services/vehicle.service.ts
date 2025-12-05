import { supabase, ensureTenantContext } from '../client'
import type { Database } from '../types'

type Vehicle = Database['tenant']['Tables']['vehicles']['Row']
type VehicleInsert = Database['tenant']['Tables']['vehicles']['Insert']
type VehicleUpdate = Database['tenant']['Tables']['vehicles']['Update']
type Customer = Database['tenant']['Tables']['customers']['Row']
type VehicleMake = Database['public']['Tables']['vehicle_make']['Row']
type VehicleModel = Database['public']['Tables']['vehicle_model']['Row']

export interface VehicleWithRelations extends Vehicle {
  customer?: Customer
  make?: VehicleMake
  model?: VehicleModel
}

export class VehicleService {
  /**
   * Get all vehicles for the current tenant
   */
  static async getVehicles(): Promise<VehicleWithRelations[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .select(`
        *,
        customer:customers(*),
        make:vehicle_make(*),
        model:vehicle_model(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as VehicleWithRelations[]
  }

  /**
   * Get a single vehicle by ID
   */
  static async getVehicleById(vehicleId: string): Promise<VehicleWithRelations> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .select(`
        *,
        customer:customers(*),
        make:vehicle_make(*),
        model:vehicle_model(*)
      `)
      .eq('id', vehicleId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) throw error
    return data as VehicleWithRelations[]
  }

  /**
   * Get vehicles by customer ID
   */
  static async getVehiclesByCustomerId(customerId: string): Promise<Vehicle[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  /**
   * Search vehicles by registration number
   */
  static async searchVehicles(query: string): Promise<VehicleWithRelations[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .select(`
        *,
        customer:customers(*),
        make:vehicle_make(*),
        model:vehicle_model(*)
      `)
      .eq('tenant_id', tenantId)
      .ilike('reg_no', `%${query}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as VehicleWithRelations[]
  }

  /**
   * Create a new vehicle
   */
  static async createVehicle(vehicle: Omit<VehicleInsert, 'tenant_id' | 'id' | 'created_at'>): Promise<Vehicle> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .insert({
        ...vehicle,
        tenant_id: tenantId,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update a vehicle
   */
  static async updateVehicle(vehicleId: string, updates: VehicleUpdate): Promise<Vehicle> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .update(updates)
      .eq('id', vehicleId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete a vehicle
   */
  static async deleteVehicle(vehicleId: string): Promise<void> {
    const tenantId = ensureTenantContext()
    
    const { error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('tenant_id', tenantId)
    
    if (error) throw error
  }
}
