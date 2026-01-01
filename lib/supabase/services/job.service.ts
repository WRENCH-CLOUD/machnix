import { supabase, ensureTenantContext } from '../client'
import type { Database } from '../types'

type Jobcard = Database['tenant']['Tables']['jobcards']['Row']
type JobcardInsert = Database['tenant']['Tables']['jobcards']['Insert']
type JobcardUpdate = Database['tenant']['Tables']['jobcards']['Update']
type PartUsage = Database['tenant']['Tables']['part_usages']['Row']
type Customer = Database['tenant']['Tables']['customers']['Row']
type Vehicle = Database['tenant']['Tables']['vehicles']['Row']
type Mechanic = Database['tenant']['Tables']['mechanics']['Row']
type VehicleMake = Database['public']['Tables']['vehicle_make']['Row']
type VehicleModel = Database['public']['Tables']['vehicle_model']['Row']

export interface JobcardWithRelations extends Jobcard {
  customer?: Customer
  vehicle?: Vehicle & {
    make?: VehicleMake
    model?: VehicleModel
  }
  mechanic?: Mechanic | null
  part_usages?: PartUsage[]
}

export class JobService {
  /**
   * Get all jobcards for the current tenant
   */
  static async getJobs(): Promise<JobcardWithRelations[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(
          *,
          make:vehicle_make(*),
          model:vehicle_model(*)
        ),
        mechanic:mechanics(*),
        part_usages:part_usages(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as JobcardWithRelations[]
  }

  /**
   * Get a single jobcard by ID with full relations
   */
  static async getJobById(jobId: string): Promise<JobcardWithRelations> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(
          *,
          make:vehicle_make(*),
          model:vehicle_model(*)
        ),
        mechanic:mechanics(*),
        part_usages:part_usages(*)
      `)
      .eq('id', jobId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) throw error
    return data as JobcardWithRelations
  }

  /**
   * Create a new jobcard
   */
  static async createJob(job: Omit<JobcardInsert, 'tenant_id' | 'id' | 'created_at' | 'updated_at'>): Promise<Jobcard> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .insert({
        ...job,
        tenant_id: tenantId,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update a jobcard
   */
  static async updateJob(jobId: string, updates: JobcardUpdate): Promise<Jobcard> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .update(updates)
      .eq('id', jobId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update job status
   */
  static async updateStatus(jobId: string, status: string, userId?: string): Promise<Jobcard> {
    // We could log the status change activity here using userId
    return this.updateJob(jobId, { status })
  }

  /**
   * Assign mechanic to job
   */
  static async assignMechanic(jobId: string, mechanicId: string, userId?: string): Promise<Jobcard> {
    // We could log the assignment activity here using userId
    return this.updateJob(jobId, { assigned_mechanic_id: mechanicId })
  }

  /**
   * Delete a jobcard
   */
  static async deleteJob(jobId: string): Promise<void> {
    const tenantId = ensureTenantContext()
    
    const { error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .delete()
      .eq('id', jobId)
      .eq('tenant_id', tenantId)
    
    if (error) throw error
  }

  /**
   * Add part usages to a jobcard
   */
  static async addPartUsages(
    jobcardId: string, 
    parts: Omit<PartUsage, 'id' | 'jobcard_id' | 'created_at' | 'tenant_id'>[]
  ): Promise<PartUsage[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('part_usages')
      .insert(parts.map(part => ({ 
        ...part, 
        jobcard_id: jobcardId,
        tenant_id: tenantId 
      })))
      .select()
    
    if (error) throw error
    return data
  }

  /**
   * Subscribe to jobcard changes
   */
  static subscribeToJobs(callback: (payload: any) => void) {
    const tenantId = ensureTenantContext()
    
    return supabase
      .channel('jobcards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'tenant',
          table: 'jobcards',
          filter: `tenant_id=eq.${tenantId}`,
        },
        callback
      )
      .subscribe()
  }
}
