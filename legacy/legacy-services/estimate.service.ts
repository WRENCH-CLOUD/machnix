import { supabase, ensureTenantContext } from '../../lib/supabase/client'
import type { Database } from '../../lib/supabase/types'

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
   * Get estimate by jobcard ID
   */
  static async getEstimateByJobcard(jobcardId: string): Promise<EstimateWithRelations | null> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('estimates')
      .select(`
        *,
        estimate_items(*)
      `)
      .eq('jobcard_id', jobcardId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) {
      console.error('[EstimateService.getEstimateByJobcard] Error:', error)
      // Don't throw on 404/406 - just return null
      if (error.code === 'PGRST116' || error.status === 406 || error.status === 404) {
        return null
      }
      throw error
    }
    
    console.log('[EstimateService.getEstimateByJobcard] Data:', data)
    return data as EstimateWithRelations | null
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
   * Add a single estimate item
   */
  static async addEstimateItem(
    estimateId: string,
    item: {
      custom_name: string
      custom_part_number?: string
      description?: string
      qty: number
      unit_price: number
      labor_cost?: number
    }
  ): Promise<EstimateItem> {
    const { data, error } = await supabase
      .schema('tenant')
      .from('estimate_items')
      .insert({
        estimate_id: estimateId,
        part_id: null,
        custom_name: item.custom_name,
        custom_part_number: item.custom_part_number || null,
        description: item.description || null,
        qty: item.qty,
        unit_price: item.unit_price,
        labor_cost: item.labor_cost || 0,
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Update estimate totals
    await this.recalculateEstimateTotals(estimateId)
    
    return data
  }

  /**
   * Update an estimate item
   */
  static async updateEstimateItem(
    itemId: string,
    updates: {
      custom_name?: string
      custom_part_number?: string
      description?: string
      qty?: number
      unit_price?: number
      labor_cost?: number
    }
  ): Promise<EstimateItem> {
    // Get the estimate_id first
    const { data: item, error: fetchError } = await supabase
      .schema('tenant')
      .from('estimate_items')
      .select('estimate_id')
      .eq('id', itemId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Update the item
    const { data, error } = await supabase
      .schema('tenant')
      .from('estimate_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()
    
    if (error) throw error
    
    // Recalculate estimate totals
    if (item?.estimate_id) {
      await this.recalculateEstimateTotals(item.estimate_id)
    }
    
    return data
  }

  /**
   * Delete an estimate item
   */
  static async deleteEstimateItem(itemId: string): Promise<void> {
    const { data: item, error: fetchError } = await supabase
      .schema('tenant')
      .from('estimate_items')
      .select('estimate_id')
      .eq('id', itemId)
      .single()
    
    if (fetchError) throw fetchError
    
    const { error } = await supabase
      .schema('tenant')
      .from('estimate_items')
      .delete()
      .eq('id', itemId)
    
    if (error) throw error
    
    // Update estimate totals
    if (item?.estimate_id) {
      await this.recalculateEstimateTotals(item.estimate_id)
    }
  }

  /**
   * Recalculate estimate totals from items
   */
  static async recalculateEstimateTotals(estimateId: string): Promise<void> {
    const { data: items } = await supabase
      .schema('tenant')
      .from('estimate_items')
      .select('qty, unit_price, labor_cost')
      .eq('estimate_id', estimateId)
    
    if (!items) return
    
    const parts_total = items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0)
    const labor_total = items.reduce((sum, item) => sum + (item.labor_cost || 0), 0)
    const subtotal = parts_total + labor_total
    const tax_amount = subtotal * 0.18 // 18% GST
    const total_amount = subtotal + tax_amount
    
    await supabase
      .schema('tenant')
      .from('estimates')
      .update({
        parts_total,
        labor_total,
        tax_amount,
        total_amount,
      })
      .eq('id', estimateId)
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
