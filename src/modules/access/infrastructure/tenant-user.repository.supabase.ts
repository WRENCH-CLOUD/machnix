import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { TenantUserRepository } from './tenant-user.repository'

export class SupabaseTenantUserRepository implements TenantUserRepository {
  private supabase = getSupabaseAdmin()

  async create(input) {
    const { error } = await this.supabase
      .schema('tenant')
      .from('users')
      .insert({
        tenant_id: input.tenantId,
        auth_user_id: input.authUserId,
        role: input.role,
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        is_active: true,
      })

    if (error) throw new Error(error.message)
  }

  async deactivate(tenantId: string, authUserId: string) {
    const { error } = await this.supabase
      .schema('tenant')
      .from('users')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('auth_user_id', authUserId)

    if (error) throw new Error(error.message)
  }

  async findRole(tenantId: string, authUserId: string) {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) throw new Error(`Failed to find role for tenant ${tenantId} and user ${authUserId}: ${error.message}`)
    return data?.role ?? null
  }
}
