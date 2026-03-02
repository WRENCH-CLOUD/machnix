import { JobRepository } from '@/modules/job/domain/job.repository'
import { JobCard, JobCardWithRelations, JobStatus } from '@/modules/job/domain/job.entity'
import { BaseSupabaseRepository } from '@/shared/infrastructure/base-supabase.repository'

/**
 * Supabase implementation of JobRepository
 */
export class SupabaseJobRepository extends BaseSupabaseRepository<JobCard> implements JobRepository {
  protected toDomain(row: any): JobCard {
    const details = row.details || {}

    return {
      id: row.id,
      tenantId: row.tenant_id,
      jobNumber: row.job_number,
      customerId: row.customer_id,
      vehicleId: row.vehicle_id,
      status: row.status as JobStatus,
      createdBy: row.created_by,
      assignedMechanicId: row.assigned_mechanic_id,
      description: details.description,
      notes: details.notes,
      details,
      startedAt: details.startedAt ? new Date(details.startedAt) : undefined,
      completedAt: details.completedAt ? new Date(details.completedAt) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: undefined,
      deletedBy: undefined,
    }
  }

  private toDomainWithRelations(row: any): JobCardWithRelations {
    return {
      ...this.toDomain(row),
      customer: row.customer,
      vehicle: row.vehicle,
      mechanic: row.mechanic,
    }
  }

  /**
   * Helper to fetch vehicles from tenant.vehicles for a list of vehicle IDs
   */
  private async fetchVehicles(vehicleIds: string[]): Promise<Map<string, any>> {
    const uniqueIds = [...new Set(vehicleIds.filter(Boolean))]
    if (uniqueIds.length === 0) return new Map()
    
    const { data } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select('*')
      .in('id', uniqueIds)
    
    const vehicleMap = new Map<string, any>()
    for (const v of data || []) {
      vehicleMap.set(v.id, v)
    }
    return vehicleMap
  }

  protected toDatabase(job: Omit<JobCard, 'id' | 'createdAt' | 'updatedAt'>): any {
    const baseDetails = job.details || {}
    const details: any = {
      ...baseDetails,
    }

    if (job.description) {
      details.description = job.description
    }

    if (job.notes) {
      details.notes = job.notes
    }

    if (job.startedAt) {
      details.startedAt = job.startedAt.toISOString()
    }

    if (job.completedAt) {
      details.completedAt = job.completedAt.toISOString()
    }

    return {
      tenant_id: job.tenantId,
      job_number: job.jobNumber,
      customer_id: job.customerId,
      vehicle_id: job.vehicleId,
      status: job.status,
      created_by: job.createdBy,
      assigned_mechanic_id: job.assignedMechanicId,
      details,
    }
  }

  async findAll(): Promise<JobCardWithRelations[]> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .select(`
        *,
        customer:customers(*),
        mechanic:mechanics(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!data?.length) return []

    // Fetch vehicles separately (cross-schema FK not detected by PostgREST)
    const vehicleMap = await this.fetchVehicles(data.map(row => row.vehicle_id))
    
    return data.map(row => ({
      ...this.toDomain(row),
      customer: row.customer,
      vehicle: vehicleMap.get(row.vehicle_id) || null,
      mechanic: row.mechanic,
    }))
  }

  async findByStatus(status: JobStatus): Promise<JobCardWithRelations[]> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .select(`
        *,
        customer:customers(*),
        mechanic:mechanics(*)
      `)
      .eq('tenant_id', tenantId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!data?.length) return []

    // Fetch vehicles separately (cross-schema FK not detected by PostgREST)
    const vehicleMap = await this.fetchVehicles(data.map(row => row.vehicle_id))
    
    return data.map(row => ({
      ...this.toDomain(row),
      customer: row.customer,
      vehicle: vehicleMap.get(row.vehicle_id) || null,
      mechanic: row.mechanic,
    }))
  }

  async findById(id: string): Promise<JobCardWithRelations | null> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .select(`
        *,
        customer:customers(*),
        mechanic:mechanics(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    if (!data) return null

    // Fetch vehicle separately (cross-schema FK not detected by PostgREST)
    const vehicleMap = await this.fetchVehicles([data.vehicle_id])
    
    return {
      ...this.toDomain(data),
      customer: data.customer,
      vehicle: vehicleMap.get(data.vehicle_id) || null,
      mechanic: data.mechanic,
    }
  }

  async findByCustomerId(customerId: string): Promise<JobCard[]> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findByVehicleId(vehicleId: string): Promise<JobCard[]> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findByMechanicId(mechanicId: string): Promise<JobCard[]> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('assigned_mechanic_id', mechanicId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async create(job: Omit<JobCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobCard> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .insert(this.toDatabase(job))
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, job: Partial<JobCard>): Promise<JobCard> {
    const tenantId = this.getContextTenantId()

    const existing = await this.findById(id)
    if (!existing) {
      throw new Error('Job not found')
    }

    const mergedDetailsBase = job.details !== undefined ? job.details : existing.details
    const mergedDetails: any = {
      ...mergedDetailsBase,
    }

    const description = job.description !== undefined ? job.description : existing.description
    const notes = job.notes !== undefined ? job.notes : existing.notes
    const startedAt = job.startedAt !== undefined ? job.startedAt : existing.startedAt
    const completedAt = job.completedAt !== undefined ? job.completedAt : existing.completedAt

    if (description) {
      mergedDetails.description = description
    }

    if (notes) {
      mergedDetails.notes = notes
    }

    if (startedAt) {
      mergedDetails.startedAt = startedAt.toISOString()
    }

    if (completedAt) {
      mergedDetails.completedAt = completedAt.toISOString()
    }

    const updates: any = {
      status: job.status !== undefined ? job.status : existing.status,
      assigned_mechanic_id: job.assignedMechanicId !== undefined
        ? job.assignedMechanicId
        : existing.assignedMechanicId,
      created_by: existing.createdBy,
      details: mergedDetails,
    }

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async updateStatus(id: string, status: JobStatus): Promise<JobCard> {
    const tenantId = this.getContextTenantId()

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .update({ status })
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
      .from('jobcards')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }
}
