import { supabase as defaultSupabase } from "@/lib/supabase/client";
import { TenantRepository } from "./tenant.repository";
import { Tenant, TenantStatus } from "../domain/tenant.entity";
import { TenantStats } from "../domain/tenant-stats.entity";
import { TenantSettings } from "../domain/tenant-settings.entity";
import { GupshupSettings } from "../domain/gupshup-settings.entity";
import { SupabaseClient } from "@supabase/supabase-js";
import { normalizeTier } from "@/config/plan-features";
import type {
  SubscriptionOverride,
  CreateOverrideInput,
  SubscriptionInvoice,
  CreateSubscriptionInvoiceInput,
  UsageSnapshot,
  UpdateSubscriptionInput,
} from '@/lib/entitlements/types'

export class SupabaseTenantRepository implements TenantRepository {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || defaultSupabase;
  }

  /**
   * Transform database row to domain entity
   * Converts snake_case to camelCase
   */
  private toDomain(row: any): Tenant {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug || '',
      status: row.status,
      subscription: normalizeTier(row.subscription),
      subscriptionStatus: row.subscription_status || 'trial',
      billingCycleAnchor: row.billing_cycle_anchor ? new Date(row.billing_cycle_anchor) : undefined,
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
    };
  }

  async markOnboarded(tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .schema("tenant")
      .from("tenants")
      .update({ is_onboarded: true })
      .eq("id", tenantId);

    if (error) throw error;
  }

  async findById(id: string): Promise<Tenant | null> {
    const { data } = await this.supabase
      .schema("tenant")
      .from("tenants")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    return data ? this.toDomain(data) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const { data } = await this.supabase
      .schema("tenant")
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<Tenant[]> {
    const { data, error } = await this.supabase
      .schema("tenant")
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    return (data || []).map(row => this.toDomain(row));
  }

  private toSettingsDomain(row: any): TenantSettings {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      legalName: row.legal_name,
      gstNumber: row.gst_number,
      panNumber: row.pan_number,
      address: row.address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      businessPhone: row.business_phone,
      businessEmail: row.business_email,
      website: row.website,

      taxRate: row.tax_rate,
      currency: row.currency,
      timezone: row.timezone,

      smsEnabled: row.sms_enabled,
      emailEnabled: row.email_enabled,
      whatsappEnabled: row.whatsapp_enabled,

      invoicePrefix: row.invoice_prefix,
      jobPrefix: row.job_prefix,
      estimatePrefix: row.estimate_prefix,
      invoiceFooter: row.invoice_footer,

      logoUrl: row.logo_url,
      updatedAt: new Date(row.updated_at)
    };
  }

  async getSettings(tenantId: string): Promise<TenantSettings | null> {
    const { data, error } = await this.supabase
      .schema("tenant")
      .from("settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) throw error;
    return data ? this.toSettingsDomain(data) : null;
  }

  async updateSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<void> {
    const dbSettings: any = {};

    // Map domain fields to DB columns
    if (settings.legalName !== undefined) dbSettings.legal_name = settings.legalName;
    if (settings.gstNumber !== undefined) dbSettings.gst_number = settings.gstNumber;
    if (settings.panNumber !== undefined) dbSettings.pan_number = settings.panNumber;
    if (settings.address !== undefined) dbSettings.address = settings.address;
    if (settings.city !== undefined) dbSettings.city = settings.city;
    if (settings.state !== undefined) dbSettings.state = settings.state;
    if (settings.pincode !== undefined) dbSettings.pincode = settings.pincode;
    if (settings.businessPhone !== undefined) dbSettings.business_phone = settings.businessPhone;
    if (settings.businessEmail !== undefined) dbSettings.business_email = settings.businessEmail;
    if (settings.website !== undefined) dbSettings.website = settings.website;

    if (settings.taxRate !== undefined) dbSettings.tax_rate = settings.taxRate;
    if (settings.currency !== undefined) dbSettings.currency = settings.currency;
    if (settings.timezone !== undefined) dbSettings.timezone = settings.timezone;

    if (settings.invoicePrefix !== undefined) dbSettings.invoice_prefix = settings.invoicePrefix;
    if (settings.jobPrefix !== undefined) dbSettings.job_prefix = settings.jobPrefix;
    if (settings.estimatePrefix !== undefined) dbSettings.estimate_prefix = settings.estimatePrefix;
    if (settings.invoiceFooter !== undefined) dbSettings.invoice_footer = settings.invoiceFooter;
    if (settings.logoUrl !== undefined) dbSettings.logo_url = settings.logoUrl;

    // Notification toggle fields
    if (settings.smsEnabled !== undefined) dbSettings.sms_enabled = settings.smsEnabled;
    if (settings.emailEnabled !== undefined) dbSettings.email_enabled = settings.emailEnabled;
    if (settings.whatsappEnabled !== undefined) dbSettings.whatsapp_enabled = settings.whatsappEnabled;
    if (Object.keys(dbSettings).length > 0) {
      // Include tenant_id for upsert
      dbSettings.tenant_id = tenantId;

      const { error } = await this.supabase
        .schema("tenant")
        .from("settings")
        .upsert(dbSettings, { onConflict: 'tenant_id' });

      if (error) throw error;
    }
  }

  async getStats(tenantId: string): Promise<TenantStats> {
    // Fetch base stats from view
    const { data, error } = await this.supabase
      .schema("tenant")
      .from("admin_tenant_overview")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();

    if (error) {
      console.error("[TenantRepository] Error fetching stats:", error);
      throw error;
    }

    // Fetch additional insight metrics
    const [pendingResult, readyResult, weeklyResult] = await Promise.all([
      // Pending jobs (received status)
      this.supabase
        .schema("tenant")
        .from("jobcards")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "received"),

      // Ready jobs (ready status)
      this.supabase
        .schema("tenant")
        .from("jobcards")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "ready"),

      // Jobs created this week
      this.supabase
        .schema("tenant")
        .from("jobcards")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    return {
      customer_count: data?.customer_count || 0,
      active_jobs: data?.active_jobs || 0,
      completed_jobs: data?.completed_jobs || 0,
      mechanic_count: data?.mechanic_count || 0,
      total_revenue: data?.total_revenue || 0,
      pending_jobs: pendingResult.count || 0,
      ready_jobs: readyResult.count || 0,
      jobs_this_week: weeklyResult.count || 0,
    };
  }

  async getRecentJobs(tenantId: string, limit: number = 5): Promise<any[]> {
    const { data, error } = await this.supabase
      .schema("tenant")
      .from("jobcards")
      .select(`
        id,
        job_number,
        status,
        created_at,
        vehicle_id,
        customer:customers(name)
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[TenantRepository] Error fetching recent jobs:", error);
      throw error;
    }

    if (!data?.length) return [];

    // Fetch vehicles separately (now in tenant schema with proper FK)
    const vehicleIds = data.map(job => job.vehicle_id).filter(Boolean);
    const { data: vehicles } = await this.supabase
      .schema('tenant')
      .from('vehicles')
      .select('id, reg_no')
      .in('id', vehicleIds);

    const vehicleMap = new Map((vehicles || []).map(v => [v.id, v]));

    return data.map(job => {
      const customer = job.customer as unknown as { name: string } | null;
      const vehicle = vehicleMap.get(job.vehicle_id);
      return {
        id: job.job_number || job.id,
        customer: customer?.name || 'Unknown',
        vehicle: vehicle?.reg_no || 'Unknown',
        status: job.status,
        priority: 'Medium' // Default since it's not in schema
      };
    });
  }

  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data } = await this.supabase
      .schema("tenant")
      .from("tenants")
      .select("id")
      .eq("slug", slug);

    return (data || []).length === 0;
  }

  async isExistingEmail(email: string): Promise<boolean> {
    const { data } = await this.supabase
      .schema("tenant")
      .from("users")
      .select("id")
      .eq("email", email);
    return (data || []).length > 0;
  }

  async create(input: { name: string; slug: string; subscription: string; status: TenantStatus }): Promise<Tenant> {
    const { data, error } = await this.supabase
      .schema("tenant")
      .from("tenants")
      .insert(input as any)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(data);
  }

  async update(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await this.supabase
      .schema("tenant")
      .from("tenants")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .schema("tenant")
      .from("tenants")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  // ============================================
  // Gupshup Settings Methods
  // ============================================

  private toGupshupSettingsDomain(row: any): GupshupSettings {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      sourceNumber: row.source_number,
      isActive: row.is_active,
      triggerMode: (row.trigger_mode || 'manual') as 'manual',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async getGupshupSettings(tenantId: string): Promise<GupshupSettings | null> {
    const { data, error } = await this.supabase
      .schema("tenant")
      .from("gupshup_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) throw error;
    return data ? this.toGupshupSettingsDomain(data) : null;
  }

  async upsertGupshupSettings(tenantId: string, settings: Partial<GupshupSettings>): Promise<void> {
    const dbSettings: any = { tenant_id: tenantId };

    if (settings.sourceNumber !== undefined) dbSettings.source_number = settings.sourceNumber;
    if (settings.isActive !== undefined) dbSettings.is_active = settings.isActive;
    if (settings.triggerMode !== undefined) dbSettings.trigger_mode = settings.triggerMode;

    const { error } = await this.supabase
      .schema("tenant")
      .from("gupshup_settings")
      .upsert(dbSettings, { onConflict: 'tenant_id' });

    if (error) throw error;
  }

  // ==========================================================================
  // SUBSCRIPTION MANAGEMENT (Admin-only — stubs for interface compliance)
  // ==========================================================================

  async getSubscriptionOverrides(_tenantId: string): Promise<SubscriptionOverride[]> {
    return []
  }

  async addSubscriptionOverride(_tenantId: string, _input: CreateOverrideInput): Promise<SubscriptionOverride> {
    throw new Error('Subscription override management is admin-only')
  }

  async updateSubscription(_tenantId: string, _input: UpdateSubscriptionInput): Promise<Tenant> {
    throw new Error('Subscription updates are admin-only')
  }

  async getUsageSnapshot(tenantId: string): Promise<UsageSnapshot> {
    const tenant = await this.findById(tenantId)
    if (!tenant) throw new Error('Tenant not found')

    return {
      jobsThisMonth: tenant.usageCounters?.job_count || 0,
      whatsappThisMonth: tenant.usageCounters?.whatsapp_count || 0,
      staffCount: tenant.usageCounters?.staff_count || 0,
      inventoryCount: 0,
    }
  }

  async createSubscriptionInvoice(_tenantId: string, _input: CreateSubscriptionInvoiceInput): Promise<SubscriptionInvoice> {
    throw new Error('Subscription invoice creation is admin-only')
  }

  async getSubscriptionInvoices(_tenantId: string): Promise<SubscriptionInvoice[]> {
    return []
  }
}
