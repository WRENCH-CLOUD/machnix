import { EstimateRepository } from '../domain/estimate.repository'
import { Estimate, EstimateWithRelations, EstimateStatus } from '../domain/estimate.entity'
import { supabase, ensureTenantContext } from '@/lib/supabase/client'

/**
 * Supabase implementation of EstimateRepository
 */
export class SupabaseEstimateRepository implements EstimateRepository {
  private toDomain(row: any): Estimate {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      customerId: row.customer_id,
      vehicleId: row.vehicle_id,
      jobcardId: row.jobcard_id,
      estimateNumber: row.estimate_number,
      status: row.status as EstimateStatus,
      description: row.description,
      laborTotal: row.labor_total,
      partsTotal: row.parts_total,
      subtotal: row.subtotal,
      taxAmount: row.tax_amount,
      discountAmount: row.discount_amount,
      totalAmount: row.total_amount,
      currency: row.currency,
      validUntil: row.valid_until ? new Date(row.valid_until) : undefined,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      approvedBy: row.approved_by,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at) : undefined,
      rejectedBy: row.rejected_by,
      rejectionReason: row.rejection_reason,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      deletedBy: row.deleted_by,
    }
  }

  private toDomainWithRelations(row: any): EstimateWithRelations {
    return {
      ...this.toDomain(row),
      customer: row.customer,
      vehicle: row.vehicle,
      jobcard: row.jobcard,
      items: row.items || [],
    }
  }

  private toDatabase(estimate: Omit<Estimate, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      tenant_id: estimate.tenantId,
      customer_id: estimate.customerId,
      vehicle_id: estimate.vehicleId,
      jobcard_id: estimate.jobcardId,
      estimate_number: estimate.estimateNumber,
      status: estimate.status,
      description: estimate.description,
      labor_total: estimate.laborTotal,
      parts_total: estimate.partsTotal,
      subtotal: estimate.subtotal,
      tax_amount: estimate.taxAmount,
      discount_amount: estimate.discountAmount,
      total_amount: estimate.totalAmount,
      currency: estimate.currency,
      valid_until: estimate.validUntil?.toISOString(),
      created_by: estimate.createdBy,
    }
  }

  async findAll(): Promise<EstimateWithRelations[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('estimates')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        jobcard:jobcards(*),
        items:estimate_items(*)
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomainWithRelations(row))
  }

  async findByStatus(status: EstimateStatus): Promise<EstimateWithRelations[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('estimates')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        jobcard:jobcards(*),
        items:estimate_items(*)
      `)
      .eq('tenant_id', tenantId)
      .eq('status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomainWithRelations(row))
  }

  async findById(id: string): Promise<EstimateWithRelations | null> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('estimates')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        jobcard:jobcards(*),
        items:estimate_items(*)
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

  async findByCustomerId(customerId: string): Promise<Estimate[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('estimates')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findByJobcardId(jobcardId: string): Promise<Estimate[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('estimates')
      .select('*')
      .eq('jobcard_id', jobcardId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async create(estimate: Omit<Estimate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Estimate> {
    const { data, error } = await supabase
      .schema('tenant')
      .from('estimates')
      .insert(this.toDatabase(estimate))
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, updates: Partial<Estimate>): Promise<Estimate> {
    const tenantId = ensureTenantContext()

    const dbUpdates: any = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.laborTotal !== undefined) dbUpdates.labor_total = updates.laborTotal
    if (updates.partsTotal !== undefined) dbUpdates.parts_total = updates.partsTotal
    if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal
    if (updates.taxAmount !== undefined) dbUpdates.tax_amount = updates.taxAmount
    if (updates.discountAmount !== undefined) dbUpdates.discount_amount = updates.discountAmount
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount
    if (updates.validUntil !== undefined) dbUpdates.valid_until = updates.validUntil?.toISOString()
    if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt?.toISOString()
    if (updates.approvedBy !== undefined) dbUpdates.approved_by = updates.approvedBy
    if (updates.rejectedAt !== undefined) dbUpdates.rejected_at = updates.rejectedAt?.toISOString()
    if (updates.rejectedBy !== undefined) dbUpdates.rejected_by = updates.rejectedBy
    if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason

    const { data, error } = await supabase
      .schema('tenant')
      .from('estimates')
      .update(dbUpdates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async updateStatus(id: string, status: EstimateStatus): Promise<Estimate> {
    return this.update(id, { status })
  }

  async approve(id: string, approvedBy: string): Promise<Estimate> {
    return this.update(id, {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy,
    })
  }

  async reject(id: string, rejectedBy: string, reason?: string): Promise<Estimate> {
    return this.update(id, {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy,
      rejectionReason: reason,
    })
  }

  async delete(id: string): Promise<void> {
    const tenantId = ensureTenantContext()

    const { error } = await supabase
      .schema('tenant')
      .from('estimates')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }
}
