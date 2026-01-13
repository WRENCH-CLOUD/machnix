import { supabase, ensureTenantContext } from '../../lib/supabase/client'
import type { Database } from '../../lib/supabase/types'

type Jobcard = Database['tenant']['Tables']['jobcards']['Row']
type JobcardInsert = Database['tenant']['Tables']['jobcards']['Insert']
type JobcardUpdate = Database['tenant']['Tables']['jobcards']['Update']
type PartUsage = Database['tenant']['Tables']['part_usages']['Row']
type Customer = Database['tenant']['Tables']['customers']['Row']
type Vehicle = Database['tenant']['Tables']['vehicles']['Row']
type Mechanic = Database['tenant']['Tables']['mechanics']['Row']

export interface JobcardWithRelations extends Jobcard {
  customer?: Customer | null
  vehicle?: Vehicle | null
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
        vehicle:vehicles(*),
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
        vehicle:vehicles(*),
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
   * Create a new jobcard and auto-create an empty estimate
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
    
    // Auto-create empty estimate for this job
    const estimateNumber = `EST-${Date.now()}`
    await supabase
      .schema('tenant')
      .from('estimates')
      .insert({
        tenant_id: tenantId,
        jobcard_id: data.id,
        customer_id: job.customer_id,
        vehicle_id: job.vehicle_id,
        estimate_number: estimateNumber,
        status: 'draft',
        total_amount: 0,
        tax_amount: 0,
        labor_total: 0,
        parts_total: 0,
      })
    
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
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Assign a mechanic to a job
   */
  static async assignMechanic(jobId: string, mechanicId: string, userId?: string): Promise<Jobcard> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('jobcards')
      .update({ 
        assigned_mechanic_id: mechanicId,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
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
   * Get part usages for a jobcard
   */
  static async getPartUsages(jobcardId: string) {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('part_usages')
      .select('*')
      .eq('jobcard_id', jobcardId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  /**
   * Add a single part usage (manual entry)
   */
  static async addManualPart(
    jobcardId: string,
    partData: {
      name: string
      partNumber?: string
      qty: number
      unitPrice: number
      laborCost?: number
    }
  ) {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('part_usages')
      .insert({
        jobcard_id: jobcardId,
        tenant_id: tenantId,
        part_id: null, // Manual entry, no inventory reference
        part_name: partData.name,
        part_number: partData.partNumber || null,
        qty: partData.qty,
        unit_price: partData.unitPrice,
        labor_cost: partData.laborCost || 0,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update a part usage
   */
  static async updatePartUsage(
    partUsageId: string,
    updates: {
      part_name?: string
      part_number?: string
      qty?: number
      unit_price?: number
      labor_cost?: number
    }
  ) {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('part_usages')
      .update(updates)
      .eq('id', partUsageId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete a part usage
   */
  static async deletePartUsage(partUsageId: string): Promise<void> {
    const tenantId = ensureTenantContext()
    
    const { error } = await supabase
      .schema('tenant')
      .from('part_usages')
      .delete()
      .eq('id', partUsageId)
      .eq('tenant_id', tenantId)
    
    if (error) throw error
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
