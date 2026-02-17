import { BaseSupabaseRepository } from '@/shared/infrastructure/base-supabase.repository'
import { CreateItemInput, CreateTransactionInput, InventoryItem, InventoryTransaction, ReferenceType, TransactionType, UpdateItemInput } from '../domain/inventory.entity'
import { InventoryRepository } from '../domain/inventory.repository'

export class SupabaseInventoryRepository extends BaseSupabaseRepository<InventoryItem> implements InventoryRepository {
  protected toDomain(row: Record<string, unknown>): InventoryItem {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      stockKeepingUnit: (row.stock_keeping_unit as string | null) ?? undefined,
      name: row.name as string,
      unitCost: Number(row.unit_cost),
      sellPrice: Number(row.sell_price),
      stockOnHand: Number(row.stock_on_hand),
      stockReserved: Number(row.stock_reserved || 0),
      reorderLevel: Number(row.reorder_level),
      metadata: row.metadata as Record<string, unknown>,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : undefined,
      deletedBy: (row.deleted_by as string | null) ?? undefined,
    }
  }

  protected toDatabase(entity: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Record<string, unknown> {
    return {
      tenant_id: entity.tenantId,
      stock_keeping_unit: entity.stockKeepingUnit ?? null,
      name: entity.name,
      unit_cost: entity.unitCost,
      sell_price: entity.sellPrice,
      stock_on_hand: entity.stockOnHand,
      stock_reserved: entity.stockReserved,
      reorder_level: entity.reorderLevel,
      metadata: entity.metadata,
      deleted_at: entity.deletedAt?.toISOString() ?? null,
      deleted_by: entity.deletedBy ?? null,
    }
  }

  // --- Inventory Item Methods ---

  async findAll(): Promise<InventoryItem[]> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) throw error
    return data ? this.toDomain(data) : null
  }

  async findByStockKeepingUnit(stockKeepingUnit: string): Promise<InventoryItem | null> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .select('*')
      .eq('stock_keeping_unit', stockKeepingUnit)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) throw error
    return data ? this.toDomain(data) : null
  }

  async create(input: CreateItemInput): Promise<InventoryItem> {
    const tenantId = this.getContextTenantId()
    const dbInput = {
      tenant_id: tenantId,
      stock_keeping_unit: input.stockKeepingUnit,
      name: input.name,
      unit_cost: input.unitCost,
      sell_price: input.sellPrice,
      stock_on_hand: input.stockOnHand,
      reorder_level: input.reorderLevel,
      metadata: input.metadata || {},
    }

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .insert(dbInput)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, input: UpdateItemInput): Promise<InventoryItem> {
    const tenantId = this.getContextTenantId()
    const updates: Record<string, unknown> = {}
    if (input.stockKeepingUnit !== undefined) updates.stock_keeping_unit = input.stockKeepingUnit ?? null
    if (input.name !== undefined) updates.name = input.name
    if (input.unitCost !== undefined) updates.unit_cost = input.unitCost
    if (input.sellPrice !== undefined) updates.sell_price = input.sellPrice
    if (input.stockOnHand !== undefined) updates.stock_on_hand = input.stockOnHand
    if (input.reorderLevel !== undefined) updates.reorder_level = input.reorderLevel
    if (input.metadata !== undefined) updates.metadata = input.metadata

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    const tenantId = this.getContextTenantId()
    const { error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  // --- Stock Operations ---

  async adjustStock(itemId: string, quantity: number, type: 'in' | 'out'): Promise<void> {
    const item = await this.findById(itemId)
    if (!item) throw new Error('Item not found')

    console.log('[adjustStock] Before adjustment:', {
      itemId,
      currentStock: item.stockOnHand,
      quantity,
      type
    })

    // Explicitly calculate new stock based on type
    let newStock: number
    if (type === 'in') {
      newStock = item.stockOnHand + quantity
    } else if (type === 'out') {
      newStock = item.stockOnHand - quantity
    } else {
      throw new Error(`Invalid adjustment type: ${type}`)
    }

    console.log('[adjustStock] Calculated newStock:', newStock)

    // Prevent negative stock
    if (newStock < 0) {
      throw new Error('Insufficient stock')
    }

    // Simple update - race condition possible but acceptable for MVP
    await this.update(itemId, { stockOnHand: newStock })
  }

  /**
   * Reserve stock for a job card allocation
   * Increments stock_reserved without changing stock_on_hand
   */
  async reserveStock(itemId: string, quantity: number): Promise<void> {
    const item = await this.findById(itemId)
    if (!item) throw new Error('Item not found')

    const newReserved = (item.stockReserved || 0) + quantity
    
    // Check that reserved doesn't exceed on-hand
    if (newReserved > item.stockOnHand) {
      throw new Error(`Cannot reserve ${quantity} units. Only ${item.stockOnHand - item.stockReserved} available.`)
    }

    const tenantId = this.getContextTenantId()
    const { error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .update({ stock_reserved: newReserved })
      .eq('id', itemId)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  /**
   * Unreserve stock (release reservation)
   * Decrements stock_reserved without changing stock_on_hand
   */
  async unreserveStock(itemId: string, quantity: number): Promise<void> {
    const item = await this.findById(itemId)
    if (!item) throw new Error('Item not found')

    const newReserved = Math.max(0, (item.stockReserved || 0) - quantity)

    const tenantId = this.getContextTenantId()
    const { error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .update({ stock_reserved: newReserved })
      .eq('id', itemId)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  /**
   * Consume reserved stock (part was used)
   * Decrements both stock_on_hand and stock_reserved
   */
  async consumeReservedStock(itemId: string, quantity: number): Promise<void> {
    const item = await this.findById(itemId)
    if (!item) throw new Error('Item not found')

    const newOnHand = item.stockOnHand - quantity
    const newReserved = Math.max(0, (item.stockReserved || 0) - quantity)

    if (newOnHand < 0) {
      throw new Error('Insufficient stock to consume')
    }

    const tenantId = this.getContextTenantId()
    const { error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .update({ 
        stock_on_hand: newOnHand,
        stock_reserved: newReserved 
      })
      .eq('id', itemId)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  // --- Transactions ---

  private toTransactionDomain(row: Record<string, unknown>): InventoryTransaction {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      itemId: row.part_id as string,
      transactionType: row.transaction_type as TransactionType,
      quantity: Number(row.quantity),
      unitCost: row.unit_cost ? Number(row.unit_cost) : undefined,
      referenceType: (row.reference_type as ReferenceType | null) ?? undefined,
      referenceId: (row.reference_id as string | null) ?? undefined,
      createdBy: (row.created_by as string | null) ?? undefined,
      createdAt: new Date(row.created_at as string),
    }
  }

  async findTransactionsByItem(itemId: string): Promise<InventoryTransaction[]> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('inventory_transactions')
      .select('*')
      .eq('part_id', itemId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toTransactionDomain(row))
  }

  async findTransactionsByReference(type: ReferenceType, id: string): Promise<InventoryTransaction[]> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('inventory_transactions')
      .select('*')
      .eq('reference_type', type)
      .eq('reference_id', id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toTransactionDomain(row))
  }

  async createTransaction(input: CreateTransactionInput): Promise<InventoryTransaction> {
    const tenantId = this.getContextTenantId()
    const dbInput = {
      tenant_id: tenantId,
      part_id: input.itemId,
      transaction_type: input.transactionType,
      quantity: input.quantity,
      unit_cost: input.unitCost,
      reference_type: input.referenceType,
      reference_id: input.referenceId,
      created_by: input.createdBy,
    }

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('inventory_transactions')
      .insert(dbInput)
      .select()
      .single()

    if (error) throw error
    return this.toTransactionDomain(data)
  }

  /**
   * Get recent transactions across all items with item details
   * Note: Uses separate queries since there may not be FK relationships defined
   */
  async findRecentTransactions(limit: number = 20): Promise<(InventoryTransaction & { itemName?: string })[]> {
    const tenantId = this.getContextTenantId()
    
    // Get transactions
    const { data: transactions, error } = await this.supabase
      .schema('tenant')
      .from('inventory_transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    if (!transactions || transactions.length === 0) return []

    // Get unique item IDs
    const itemIds = [...new Set(transactions.map(t => t.part_id).filter(Boolean))]
    
    // Fetch items for names
    const { data: items, error: itemsError } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .select('id, name')
      .in('id', itemIds)
      .eq('tenant_id', tenantId)

    if (itemsError) throw itemsError
    const itemMap = new Map((items || []).map(i => [i.id, i.name]))

    return transactions.map(row => ({
      ...this.toTransactionDomain(row),
      itemName: itemMap.get(row.part_id),
    }))
  }

  // ============================================================================
  // Delta Sync Methods
  // ============================================================================

  /**
   * Get full inventory snapshot for initial load
   * Returns lightweight items with computed available stock
   */
  async getSnapshot(): Promise<{ items: InventoryItem[], syncedAt: string }> {
    const tenantId = this.getContextTenantId()
    const syncedAt = new Date().toISOString()
    
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    return { 
      items: (data || []).map(row => this.toDomain(row)),
      syncedAt 
    }
  }

  /**
   * Get delta (changes since a given timestamp)
   * Returns upserted items and deleted IDs
   */
  async getDelta(since: string): Promise<{ 
    upserted: InventoryItem[], 
    deleted: string[], 
    syncedAt: string,
    totalCount: number 
  }> {
    const tenantId = this.getContextTenantId()
    const syncedAt = new Date().toISOString()
    const sinceDate = new Date(since).toISOString()

    // Get updated/created items (not deleted, updated after 'since')
    const { data: upsertedData, error: upsertedError } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gt('updated_at', sinceDate)
      .order('updated_at', { ascending: true })

    if (upsertedError) throw upsertedError

    // Get deleted items (deleted after 'since')
    const { data: deletedData, error: deletedError } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .select('id')
      .eq('tenant_id', tenantId)
      .not('deleted_at', 'is', null)
      .gt('deleted_at', sinceDate)

    if (deletedError) throw deletedError

    // Get total count for threshold check
    const { count, error: countError } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    if (countError) throw countError

    return {
      upserted: (upsertedData || []).map(row => this.toDomain(row)),
      deleted: (deletedData || []).map(row => row.id),
      syncedAt,
      totalCount: count || 0
    }
  }

  /**
   * Get items by multiple IDs (for targeted refresh after operations)
   */
  async findByIds(ids: string[]): Promise<InventoryItem[]> {
    if (ids.length === 0) return []
    
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('id', ids)

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }
}
