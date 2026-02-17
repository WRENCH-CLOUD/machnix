import { SupabaseClient } from '@supabase/supabase-js'
import { Tenant, TenantStatus } from '../domain/tenant.entity'
import { TenantStats } from '../domain/tenant-stats.entity'
import { TenantRepository } from './tenant.repository'

import { TenantSettings } from '../domain/tenant-settings.entity'
import { GupshupSettings } from '../domain/gupshup-settings.entity'
import { normalizeTier } from '@/config/plan-features'
import type {
  SubscriptionOverride,
  CreateOverrideInput,
  SubscriptionInvoice,
  CreateSubscriptionInvoiceInput,
  UsageSnapshot,
  UpdateSubscriptionInput,
} from '@/lib/entitlements/types'

export class AdminSupabaseTenantRepository implements TenantRepository {
  constructor(private readonly supabase: SupabaseClient) { }

  async getSettings(tenantId: string): Promise<TenantSettings | null> {
    return null
  }

  async updateSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<void> {
    // Not implemented for admin
  }

  // Gupshup settings - stub implementations for admin (not used)
  async getGupshupSettings(tenantId: string): Promise<GupshupSettings | null> {
    return null
  }

  async upsertGupshupSettings(tenantId: string, settings: Partial<GupshupSettings>): Promise<void> {
    // Not implemented for admin
  }

  async markOnboarded(tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .update({ is_onboarded: true })
      .eq('id', tenantId)

    if (error) throw error
  }

  /**
   * Transform database row to domain entity
   */
  private toDomain(row: any): Tenant {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug || '',
      status: row.status,
      subscription: normalizeTier(row.subscription),
      subscriptionStatus: row.subscription_status || 'trial',
      usageCounters: row.usage_counters || { job_count: 0, staff_count: 0, whatsapp_count: 0 },
      isOnboarded: row.is_onboarded ?? false,
      createdAt: new Date(row.created_at),
      // Subscription lifecycle fields
      subscriptionStartAt: row.subscription_start_at ? new Date(row.subscription_start_at) : null,
      subscriptionEndAt: row.subscription_end_at ? new Date(row.subscription_end_at) : null,
      gracePeriodEndsAt: row.grace_period_ends_at ? new Date(row.grace_period_ends_at) : null,
      trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at) : null,
      customPrice: row.custom_price ? Number(row.custom_price) : null,
      billingPeriod: row.billing_period || 'monthly',
    }
  }

  async findById(id: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? this.toDomain(data) : null
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    return data ? this.toDomain(data) : null
  }

  async findAll(): Promise<Tenant[]> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map((row) => this.toDomain(row))
  }

  async getStats(tenantId: string): Promise<TenantStats> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('admin_tenant_overview')
      .select('customer_count, active_jobs, completed_jobs, mechanic_count, total_revenue, jobs_this_month, whatsapp_this_month, staff_count, vehicle_count, active_overrides_count')
      .eq('id', tenantId)
      .maybeSingle()

    if (error) throw error

    return {
      customer_count: data?.customer_count || 0,
      active_jobs: data?.active_jobs || 0,
      completed_jobs: data?.completed_jobs || 0,
      mechanic_count: data?.mechanic_count || 0,
      total_revenue: data?.total_revenue || 0,
      jobs_this_month: data?.jobs_this_month || 0,
      whatsapp_this_month: data?.whatsapp_this_month || 0,
      staff_count: data?.staff_count || 0,
      vehicle_count: data?.vehicle_count || 0,
      active_overrides_count: data?.active_overrides_count || 0,
    }
  }

  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .select('id')
      .eq('slug', slug)

    if (error) throw error
    return (data || []).length === 0
  }

  async create(input: { name: string; slug: string; subscription: string; status: TenantStatus }): Promise<Tenant> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .insert(input as any)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getRecentJobs(tenantId: string, limit: number = 5): Promise<any[]> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('jobcards')
      .select(`
        id,
        job_number,
        status,
        created_at,
        vehicle_id,
        customer:customers(name)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    if (!data?.length) return []

    const vehicleIds = data.map(job => job.vehicle_id).filter(Boolean)
    const { data: vehicles } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select('id, reg_no')
      .in('id', vehicleIds)

    const vehicleMap = new Map((vehicles || []).map(v => [v.id, v]))

    return data.map(job => {
      const vehicle = vehicleMap.get(job.vehicle_id)
      const customer = job.customer as unknown as { name: string } | null
      return {
        id: job.job_number || job.id,
        customer: customer?.name || 'Unknown',
        vehicle: vehicle?.reg_no || 'Unknown',
        status: job.status,
        priority: 'Medium'
      }
    })
  }

  // ==========================================================================
  // SUBSCRIPTION MANAGEMENT
  // ==========================================================================

  async getSubscriptionOverrides(tenantId: string): Promise<SubscriptionOverride[]> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('subscription_overrides')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      featureKey: row.feature_key,
      quantity: row.quantity,
      validFrom: new Date(row.valid_from),
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      reason: row.reason,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    }))
  }

  async addSubscriptionOverride(tenantId: string, input: CreateOverrideInput): Promise<SubscriptionOverride> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('subscription_overrides')
      .insert({
        tenant_id: tenantId,
        feature_key: input.featureKey,
        quantity: input.quantity,
        expires_at: input.expiresAt || null,
        reason: input.reason || null,
        created_by: input.createdBy || null,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      tenantId: data.tenant_id,
      featureKey: data.feature_key,
      quantity: data.quantity,
      validFrom: new Date(data.valid_from),
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      reason: data.reason,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
    }
  }

  async updateSubscription(tenantId: string, input: UpdateSubscriptionInput): Promise<Tenant> {
    const updates: Record<string, unknown> = {}

    if (input.tier !== undefined) updates.subscription = input.tier
    if (input.startAt !== undefined) updates.subscription_start_at = input.startAt
    if (input.endAt !== undefined) updates.subscription_end_at = input.endAt
    if (input.gracePeriodEndsAt !== undefined) updates.grace_period_ends_at = input.gracePeriodEndsAt
    if (input.customPrice !== undefined) updates.custom_price = input.customPrice
    if (input.billingPeriod !== undefined) updates.billing_period = input.billingPeriod
    if (input.subscriptionStatus !== undefined) updates.subscription_status = input.subscriptionStatus

    const { data, error } = await this.supabase
      .schema('tenant')
      .from('tenants')
      .update(updates)
      .eq('id', tenantId)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async getUsageSnapshot(tenantId: string): Promise<UsageSnapshot> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('admin_tenant_overview')
      .select('jobs_this_month, whatsapp_this_month, staff_count')
      .eq('id', tenantId)
      .maybeSingle()

    if (error) throw error

    const { count: inventoryCount } = await this.supabase
      .schema('tenant')
      .from('parts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    return {
      jobsThisMonth: data?.jobs_this_month || 0,
      whatsappThisMonth: data?.whatsapp_this_month || 0,
      staffCount: data?.staff_count || 0,
      inventoryCount: inventoryCount || 0,
    }
  }

  async createSubscriptionInvoice(tenantId: string, input: CreateSubscriptionInvoiceInput): Promise<SubscriptionInvoice> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('subscription_invoices')
      .insert({
        tenant_id: tenantId,
        invoice_type: input.invoiceType,
        description: input.description,
        amount: input.amount,
        discount_amount: input.discountAmount || 0,
        total_amount: input.totalAmount,
        payment_method: input.paymentMethod || 'manual',
        metadata: input.metadata || {},
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      tenantId: data.tenant_id,
      invoiceType: data.invoice_type,
      description: data.description,
      amount: Number(data.amount),
      discountAmount: Number(data.discount_amount),
      totalAmount: Number(data.total_amount),
      status: data.status,
      paymentMethod: data.payment_method,
      paymentReference: data.payment_reference,
      metadata: data.metadata || {},
      paidAt: data.paid_at ? new Date(data.paid_at) : null,
      createdAt: new Date(data.created_at),
    }
  }

  async getSubscriptionInvoices(tenantId: string): Promise<SubscriptionInvoice[]> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('subscription_invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      invoiceType: row.invoice_type,
      description: row.description,
      amount: Number(row.amount),
      discountAmount: Number(row.discount_amount),
      totalAmount: Number(row.total_amount),
      status: row.status,
      paymentMethod: row.payment_method,
      paymentReference: row.payment_reference,
      metadata: row.metadata || {},
      paidAt: row.paid_at ? new Date(row.paid_at) : null,
      createdAt: new Date(row.created_at),
    }))
  }
}