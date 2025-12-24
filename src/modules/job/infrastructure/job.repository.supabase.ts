import { JobRepository } from '@/modules/job/domain/job.repository'
import { JobCard, JobCardWithRelations, JobStatus } from '@/modules/job/domain/job.entity'
import { supabase, ensureTenantContext } from '@/lib/supabase/client'

/**
 * Supabase implementation of JobRepository
 */
export class SupabaseJobRepository implements JobRepository {
  private toDomain(row: any): JobCard {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      jobNumber: row.job_number,
      customerId: row.customer_id,
      vehicleId: row.vehicle_id,
      status: row.status as JobStatus,
      createdBy: row.created_by,
      assignedMechanicId: row.assigned_mechanic_id,
      description: row.description,
      notes: row.notes,
      details: row.details || {},
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      deletedBy: row.deleted_by,
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

  private toDatabase(job: Omit<JobCard, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      tenant_id: job.tenantId,
      job_number: job.jobNumber,
      customer_id: job.customerId,
      vehicle_id: job.vehicleId,
      status: job.status,
      created_by: job.createdBy,
      assigned_mechanic_id: job.assignedMechanicId,
      description: job.description,
      notes: job.notes,
      details: job.details,
      started_at: job.startedAt?.toISOString(),
      completed_at: job.completedAt?.toISOString(),
    }
  }

  async findAll(): Promise<JobCardWithRelations[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        mechanic:users(*)
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomainWithRelations(row))
  }

  async findByStatus(status: JobStatus): Promise<JobCardWithRelations[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        mechanic:users(*)
      `)
      .eq('tenant_id', tenantId)
      .eq('status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomainWithRelations(row))
  }

  async findById(id: string): Promise<JobCardWithRelations | null> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        mechanic:users(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data ? this.toDomainWithRelations(data) : null
  }

  async findByCustomerId(customerId: string): Promise<JobCard[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findByVehicleId(vehicleId: string): Promise<JobCard[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findByMechanicId(mechanicId: string): Promise<JobCard[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select('*')
      .eq('assigned_mechanic_id', mechanicId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async create(job: Omit<JobCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobCard> {
    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .insert(this.toDatabase(job))
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, updates: Partial<JobCard>): Promise<JobCard> {
    const tenantId = ensureTenantContext()

    const dbUpdates: any = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.assignedMechanicId !== undefined) dbUpdates.assigned_mechanic_id = updates.assignedMechanicId
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.details !== undefined) dbUpdates.details = updates.details
    if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt?.toISOString()
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt?.toISOString()

    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .update(dbUpdates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async updateStatus(id: string, status: JobStatus): Promise<JobCard> {
    return this.update(id, { status })
  }

  async delete(id: string): Promise<void> {
    const tenantId = ensureTenantContext()

    const { error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }
}
