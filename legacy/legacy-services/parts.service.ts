import { supabase, ensureTenantContext } from '../../lib/supabase/client'
import type { Database } from '../../lib/supabase/types'

type Part = Database['tenant']['Tables']['parts']['Row']
type PartInsert = Database['tenant']['Tables']['parts']['Insert']
type PartUpdate = Database['tenant']['Tables']['parts']['Update']
type InventoryTransaction = Database['tenant']['Tables']['inventory_transactions']['Row']
type InventoryTransactionInsert = Database['tenant']['Tables']['inventory_transactions']['Insert']

export interface PartWithInventory extends Part {
  recent_transactions?: InventoryTransaction[]
}

export class PartsService {
  /**
   * Get all parts for the current tenant
   */
  static async getParts(): Promise<Part[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('parts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  }

  /**
   * Get a single part by ID
   */
  static async getPartById(partId: string): Promise<PartWithInventory> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('parts')
      .select(`
        *,
        recent_transactions:inventory_transactions(*)
      `)
      .eq('id', partId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) throw error
    return data as PartWithInventory
  }

  /**
   * Search parts by name or SKU
   */
  static async searchParts(query: string): Promise<Part[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('parts')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  }

  /**
   * Get low stock parts
   */
  static async getLowStockParts(): Promise<Part[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('parts')
      .select('*')
      .eq('tenant_id', tenantId)
      .filter('stock_on_hand', 'lte', 'reorder_level')
      .order('stock_on_hand', { ascending: true })
    
    if (error) throw error
    return data
  }

  /**
   * Create a new part
   */
  static async createPart(part: Omit<PartInsert, 'tenant_id' | 'id' | 'created_at' | 'updated_at'>): Promise<Part> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('parts')
      .insert({
        ...part,
        tenant_id: tenantId,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update a part
   */
  static async updatePart(partId: string, updates: PartUpdate): Promise<Part> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('parts')
      .update(updates)
      .eq('id', partId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete a part
   */
  static async deletePart(partId: string): Promise<void> {
    const tenantId = ensureTenantContext()
    
    const { error } = await supabase
      .schema('tenant')
      .from('parts')
      .delete()
      .eq('id', partId)
      .eq('tenant_id', tenantId)
    
    if (error) throw error
  }

  /**
   * Add inventory transaction (stock in/out/adjustment)
   */
  static async addInventoryTransaction(
    transaction: Omit<InventoryTransactionInsert, 'tenant_id' | 'id' | 'created_at'>
  ): Promise<InventoryTransaction> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('inventory_transactions')
      .insert({
        ...transaction,
        tenant_id: tenantId,
      })
      .select()
      .single()
    
    if (error) throw error

    // Update part stock based on transaction type
    const part = await this.getPartById(transaction.part_id)
    let newStock = part.stock_on_hand
    
    if (transaction.transaction_type === 'in' || transaction.transaction_type === 'purchase') {
      newStock += transaction.quantity
    } else if (transaction.transaction_type === 'out' || transaction.transaction_type === 'usage') {
      newStock -= transaction.quantity
    } else if (transaction.transaction_type === 'adjustment') {
      newStock = transaction.quantity
    }

    await this.updatePart(transaction.part_id, { stock_on_hand: newStock })
    
    return data
  }

  /**
   * Get inventory transactions for a part
   */
  static async getPartTransactions(partId: string, limit = 50): Promise<InventoryTransaction[]> {
    const tenantId = ensureTenantContext()
    
    const { data, error } = await supabase
      .schema('tenant')
      .from('inventory_transactions')
      .select('*')
      .eq('part_id', partId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }
}
