import { supabase, ensureTenantContext } from '../client'
import type { Database } from '../types'

type Estimate = Database['tenant']['Tables']['estimates']['Row']
type EstimateInsert = Database['tenant']['Tables']['estimates']['Insert']
type EstimateUpdate = Database['tenant']['Tables']['estimates']['Update']
type EstimateItem = Database['tenant']['Tables']['estimate_items']['Row']
type EstimateItemInsert = Database['tenant']['Tables']['estimate_items']['Insert']
type Customer = Database['tenant']['Tables']['customers']['Row']
type Vehicle = Database['tenant']['Tables']['vehicles']['Row']

export interface EstimateWithRelations extends Estimate {
  customer?: Customer
  vehicle?: Vehicle
  estimate_items?: EstimateItem[]
}

export class EstimateService {
  /**
   * Get all estimates for the current tenant
   */
  static async getEstimates(status?: string): Promise<EstimateWithRelations[]> {
    const tenantId = ensureTenantContext()
    
    let query = supabase
      .schema('tenant')
      .from('estimates')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        estimate_items:estimate_items(*)
      `)
      .eq('tenant_id', tenantId)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data as EstimateWithRelations[]
  }

  /**
   * Get a single estimate by ID
   */
  static async getEstimateById(estimateId: string): Promise<EstimateWithRelations> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('estimates')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        estimate_items:estimate_items(*)
      `)
      .eq('id', estimateId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) throw error
    return data as EstimateWithRelations
  }

  /**
   * Create a new estimate
   */
  static async createEstimate(
    estimate: Omit<EstimateInsert, 'tenant_id' | 'id' | 'created_at' | 'updated_at'>
  ): Promise<Estimate> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('estimates')
      .insert({
        ...estimate,
        tenant_id: tenantId,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update an estimate
   */
  static async updateEstimate(estimateId: string, updates: EstimateUpdate): Promise<Estimate> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('estimates')
      .update(updates)
      .eq('id', estimateId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete an estimate
   */
  static async deleteEstimate(estimateId: string): Promise<void> {
    const tenantId = ensureTenantContext()
    
    const { error } = await supabase
      .schema('tenant')
      .from('estimates')
      .delete()
      .eq('id', estimateId)
      .eq('tenant_id', tenantId)
    
    if (error) throw error
  }

  /**
   * Add items to an estimate
   */
  static async addEstimateItems(
    estimateId: string,
    items: Omit<EstimateItemInsert, 'id' | 'estimate_id' | 'created_at'>[]
  ): Promise<EstimateItem[]> {
    const { data, error } = await supabase
      .schema('tenant')
      .from('estimate_items')
      .insert(items.map(item => ({ ...item, estimate_id: estimateId })))
      .select()
    
    if (error) throw error
    return data
  }

  /**
   * Approve an estimate
   */
  static async approveEstimate(estimateId: string): Promise<Estimate> {
    return this.updateEstimate(estimateId, {
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
  }

  /**
   * Reject an estimate
   */
  static async rejectEstimate(estimateId: string, reason?: string): Promise<Estimate> {
    return this.updateEstimate(estimateId, {
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
  }
}
