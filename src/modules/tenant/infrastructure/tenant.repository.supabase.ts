import { supabase as defaultSupabase } from "@/lib/supabase/client";
import { TenantRepository } from "./tenant.repository";
import { Tenant } from "../domain/tenant.entity";
import { TenantStats } from "../domain/tenant-stats.entity";
import { SupabaseClient } from "@supabase/supabase-js";

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
      subscription: row.subscription,
      createdAt: new Date(row.created_at),
    };
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
    console.log('[TenantRepository] Fetching all tenants from tenant.tenants...')
    
    // Check current session to debug
    const { data: sessionData } = await this.supabase.auth.getSession()
    const appMetadata = sessionData.session?.user?.app_metadata as any
    console.log('[TenantRepository] Session check:', {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
      email: sessionData.session?.user?.email,
      appMetadata: JSON.stringify(appMetadata),
      role: appMetadata?.role,
      tenant_id: appMetadata?.tenant_id,
      user_type: appMetadata?.user_type
    })
    
    const { data, error } = await this.supabase
      .schema("tenant")
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error('[TenantRepository] Error fetching tenants:', error)
      throw error;
    }
    console.log('[TenantRepository] Found tenants:', data?.length || 0)
    return (data || []).map(row => this.toDomain(row));
  }

  async getStats(tenantId: string): Promise<TenantStats> {
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

    return {
      customer_count: data?.customer_count || 0,
      active_jobs: data?.active_jobs || 0,
      completed_jobs: data?.completed_jobs || 0,
      mechanic_count: data?.mechanic_count || 0,
      total_revenue: data?.total_revenue || 0,
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
        customer:customers(name),
        vehicle:vehicles(reg_no)
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[TenantRepository] Error fetching recent jobs:", error);
      throw error;
    }

    return (data || []).map(job => ({
      id: job.job_number || job.id,
      customer: job.customer?.name || 'Unknown',
      vehicle: job.vehicle?.reg_no || 'Unknown',
      status: job.status,
      priority: 'Medium' // Default since it's not in schema
    }));
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

  async create(input: { name: string; slug: string; subscription: string; status: 'active' | 'inactive' }): Promise<Tenant> {
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
}
