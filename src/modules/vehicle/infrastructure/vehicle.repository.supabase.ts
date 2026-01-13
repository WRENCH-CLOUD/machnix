import { VehicleRepository } from '../domain/vehicle.repository'
import { Vehicle, VehicleWithCustomer } from '../domain/vehicle.entity'
import { BaseSupabaseRepository } from '@/shared/infrastructure/base-supabase.repository'

/**
 * Supabase implementation of VehicleRepository
 */
export class SupabaseVehicleRepository extends BaseSupabaseRepository<Vehicle> implements VehicleRepository {
  protected toDomain(row: any): Vehicle {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      customerId: row.customer_id,
      make: row.make,
      model: row.model,
      year: row.year,
      vin: row.vin,
      licensePlate: row.license_plate || row.reg_no,
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

  protected toDatabase(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): any {
    const v: any = vehicle as any
    const licensePlate =
      vehicle.licensePlate ||
      v.regNo ||
      v.reg_no ||
      null

    return {
      tenant_id: vehicle.tenantId,
      customer_id: vehicle.customerId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      reg_no: licensePlate,
      license_plate: licensePlate,
      color: vehicle.color,
      mileage: vehicle.mileage,
    }
  }

  async findAll(): Promise<VehicleWithCustomer[]> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomainWithCustomer(row))
  }

  async findById(id: string): Promise<VehicleWithCustomer | null> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data ? this.toDomainWithCustomer(data) : null
  }

  async findByCustomerId(customerId: string): Promise<Vehicle[]> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async search(query: string): Promise<VehicleWithCustomer[]> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('tenant_id', tenantId)
      .or(`license_plate.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomainWithCustomer(row))
  }

  async create(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .insert(this.toDatabase(vehicle))
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('vehicles')
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
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }
}
