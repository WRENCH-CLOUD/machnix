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
      makeId: row.make_id,
      modelId: row.model_id,
      make: row.make || row.vehicle_make?.name || '',
      model: row.model || row.vehicle_model?.name || '',
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
      // Map PostgREST embedded 'customers' relation to 'customer' for the transformer
      customer: row.customers ? {
        id: row.customers.id,
        name: row.customers.name,
        phone: row.customers.phone,
        email: row.customers.email,
      } : undefined,
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
      make_id: vehicle.makeId || null,
      model_id: vehicle.modelId || null,
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

  async findAll(customerId?: string): Promise<VehicleWithCustomer[]> {
    const tenantId = this.getContextTenantId()

    let query = this.supabase
      .schema('tenant')
      .from('vehicles')
      .select('*, customers(*)')  // PostgREST embedded relation
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    if (!data?.length) return []

    // Fetch jobs for each vehicle to calculate service history
    const vehicleIds = data.map(v => v.id)
    const { data: jobcards } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .select('id, vehicle_id, created_at, status')
      .eq('tenant_id', tenantId)
      .in('vehicle_id', vehicleIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Group jobs by vehicle_id
    const jobsByVehicle = (jobcards || []).reduce((acc: Record<string, any[]>, j) => {
      if (!acc[j.vehicle_id]) acc[j.vehicle_id] = []
      acc[j.vehicle_id].push(j)
      return acc
    }, {})

    return data.map(row => ({
      ...this.toDomainWithCustomer(row),
      jobs: jobsByVehicle[row.id] || [],
    }))
  }


  async findById(id: string): Promise<VehicleWithCustomer | null> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select('*, customers(*)')  // PostgREST embedded relation
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
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
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
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select('*, customers(*)')  // PostgREST embedded relation
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .or(`license_plate.ilike.%${query}%,reg_no.ilike.%${query}%`)
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
