import { BaseSupabaseRepository } from '@/shared/infrastructure/base-supabase.repository'
import { CreateItemInput, CreateTransactionInput, InventoryItem, InventoryTransaction, ReferenceType, UpdateItemInput } from '../domain/inventory.entity'
import { InventoryRepository } from '../domain/inventory.repository'

export class SupabaseInventoryRepository extends BaseSupabaseRepository<InventoryItem> implements InventoryRepository {
  protected toDomain(row: any): InventoryItem {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      stock_keeping_unit: row.stock_keeping_unit,
      name: row.name,
      unitCost: Number(row.unit_cost),
      sellPrice: Number(row.sell_price),
      stockOnHand: Number(row.stock_on_hand),
      reorderLevel: Number(row.reorder_level),
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      deletedBy: row.deleted_by,
    }
  }

  protected toDatabase(entity: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      tenant_id: entity.tenantId,
      stock_keeping_unit: entity.stock_keeping_unit,
      name: entity.name,
      unit_cost: entity.unitCost,
      sell_price: entity.sellPrice,
      stock_on_hand: entity.stockOnHand,
      reorder_level: entity.reorderLevel,
      metadata: entity.metadata,
      deleted_at: entity.deletedAt,
      deleted_by: entity.deletedBy,
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

  async findBystock_keeping_unit(stock_keeping_unit: string): Promise<InventoryItem | null> {
    const tenantId = this.getContextTenantId()
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('inventory_items')
      .select('*')
      .eq('stock_keeping_unit', stock_keeping_unit)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) throw error
    return data ? this.toDomain(data) : null
  }

  async create(input: CreateItemInput): Promise<InventoryItem> {
    const tenantId = this.getContextTenantId()
    const dbInput = {
      tenant_id: tenantId,
      stock_keeping_unit: input.stock_keeping_unit,
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
    const updates: any = {}
    if (input.stock_keeping_unit !== undefined) updates.stock_keeping_unit = input.stock_keeping_unit
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

    const newStock = type === 'in' ? item.stockOnHand + quantity : item.stockOnHand - quantity

    // Simple update - race condition possible but acceptable for MVP
    await this.update(itemId, { stockOnHand: newStock })
  }

  // --- Transactions ---

  private toTransactionDomain(row: any): InventoryTransaction {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      itemId: row.part_id,
      transactionType: row.transaction_type,
      quantity: Number(row.quantity),
      unitCost: row.unit_cost ? Number(row.unit_cost) : undefined,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
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
      notes: input.notes,
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
}
