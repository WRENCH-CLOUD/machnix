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
   * Get all vehicle makes from public schema
   */
  static async getMakes(): Promise<VehicleMake[]> {
    const { data, error } = await supabase
      .from('vehicle_make')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  }

  /**
   * Get vehicle models by make ID from public schema
   */
  static async getModelsByMakeId(makeId: string): Promise<VehicleModel[]> {
    const { data, error } = await supabase
      .from('vehicle_model')
      .select('*')
      .eq('make_id', makeId)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  }

  /**
   * Get all vehicles for the current tenant
   */
  static async getVehicles(): Promise<Vehicle[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  /**
   * Get vehicles by customer ID
   */
  static async getByCustomerId(customerId: string): Promise<Vehicle[]> {
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
   * Create a new vehicle
   */
  static async create(vehicle: Omit<VehicleInsert, 'id' | 'created_at'>): Promise<Vehicle> {
    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Get all vehicles for the current tenant (with relations - legacy)
   */
  static async getVehiclesWithRelations(): Promise<VehicleWithRelations[]> {
    const tenantId = ensureTenantContext()
    
    // Note: Cross-schema joins don't work, so we fetch vehicles without make/model relations
    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .select(`
        *,
        customer:customers(*)
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
