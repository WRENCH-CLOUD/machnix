import { VehicleRepository } from '../domain/vehicle.repository'
import { Vehicle, VehicleWithCustomer } from '../domain/vehicle.entity'
import { supabase, ensureTenantContext } from '@/lib/supabase/client'

/**
 * Supabase implementation of VehicleRepository
 */
export class SupabaseVehicleRepository implements VehicleRepository {
  private toDomain(row: any): Vehicle {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      customerId: row.customer_id,
      make: row.make,
      model: row.model,
      year: row.year,
      vin: row.vin,
      licensePlate: row.license_plate,
      color: row.color,
      mileage: row.mileage,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      deletedBy: row.deleted_by,
    }
  }

  private toDomainWithCustomer(row: any): VehicleWithCustomer {
    return {
      ...this.toDomain(row),
      customer: row.customer,
    }
  }

  private toDatabase(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      tenant_id: vehicle.tenantId,
      customer_id: vehicle.customerId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      license_plate: vehicle.licensePlate,
      color: vehicle.color,
      mileage: vehicle.mileage,
    }
  }

  async findAll(): Promise<VehicleWithCustomer[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomainWithCustomer(row))
  }

  async findById(id: string): Promise<VehicleWithCustomer | null> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data ? this.toDomainWithCustomer(data) : null
  }

  async findByCustomerId(customerId: string): Promise<Vehicle[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async search(query: string): Promise<VehicleWithCustomer[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .or(`make.ilike.%${query}%,model.ilike.%${query}%,license_plate.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomainWithCustomer(row))
  }

  async create(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .insert(this.toDatabase(vehicle))
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    const tenantId = ensureTenantContext()

    const dbUpdates: any = {}
    if (updates.customerId !== undefined) dbUpdates.customer_id = updates.customerId
    if (updates.make !== undefined) dbUpdates.make = updates.make
    if (updates.model !== undefined) dbUpdates.model = updates.model
    if (updates.year !== undefined) dbUpdates.year = updates.year
    if (updates.vin !== undefined) dbUpdates.vin = updates.vin
    if (updates.licensePlate !== undefined) dbUpdates.license_plate = updates.licensePlate
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.mileage !== undefined) dbUpdates.mileage = updates.mileage

    const { data, error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .update(dbUpdates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async delete(id: string): Promise<void> {
    const tenantId = ensureTenantContext()

    const { error } = await supabase
      .schema('tenant')
      .from('vehicles')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }
}
