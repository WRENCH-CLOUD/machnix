import { supabase } from "@/lib/supabase/client";
import { TenantRepository } from "./tenant.repository";
import { Tenant } from "../domain/tenant.entity";
import { TenantStats } from "../domain/tenant-stats.entity";

export class SupabaseTenantRepository implements TenantRepository {
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
    const { data } = await supabase
      .schema("tenant")
      .from("tenants")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    return data ? this.toDomain(data) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const { data } = await supabase
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
    const { data: sessionData } = await supabase.auth.getSession()
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
    
    const { data, error } = await supabase
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
    // Get customer count
    const {customerCount , activeJobsCount , completedJobsCount , totalRevenue } = await supabase.schema("tenant").from(tenant_admin_overview)
    return {
      customer_count: customerCount || 0,
      active_jobs: activeJobsCount || 0,
      completed_jobs: completedJobsCount || 0,
      mechanic_count: mechanicCount || 0,
      total_revenue: totalRevenue,
    };
  }

  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data } = await supabase
      .schema("tenant")
      .from("tenants")
      .select("id")
      .eq("slug", slug);

    return (data || []).length === 0;
  }

  async isExistingEmail(email: string): Promise<boolean> {
    const { data } = await supabase
      .schema("tenant")
      .from("users")
      .select("id")
      .eq("email", email);
    return (data || []).length > 0;
  }

  async create(input: { name: string; slug: string; subscription: string; status: 'active' | 'inactive' }): Promise<Tenant> {
    const { data, error } = await supabase
      .schema("tenant")
      .from("tenants")
      .insert(input as any)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(data);
  }

  async update(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase
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
    const { error } = await supabase
      .schema("tenant")
      .from("tenants")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}
