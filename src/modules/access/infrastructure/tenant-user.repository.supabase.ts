import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { TenantUserRepository } from './tenant-user.repository'

type CreateTenantUserInput = {
  tenantId: string
  authUserId: string
  name: string
  email: string
  phone?: string
  role: 'tenant_owner' | 'manager' | 'mechanic'
}

export class SupabaseTenantUserRepository implements TenantUserRepository {
  private supabase = getSupabaseAdmin()

  async create(input: CreateTenantUserInput): Promise<void> {
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

  async deactivate(tenantId: string, authUserId: string): Promise<void> {
    const { error } = await this.supabase
      .schema('tenant')
      .from('users')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('auth_user_id', authUserId)

    if (error) throw new Error(error.message)
  }

  async findByTenantAndAuthUser(tenantId: string, authUserId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) throw new Error(`Failed to find user for tenant ${tenantId} and auth user ${authUserId}: ${error.message}`)
    return data?.id ?? null
  }

  async findRole(tenantId: string, authUserId: string): Promise<'tenant_owner' | 'mechanic' | null> {
    const { data, error } = await this.supabase
      .schema('tenant')
      .from('users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) throw new Error(`Failed to find role for tenant ${tenantId} and user ${authUserId}: ${error.message}`)
    return data?.role as 'tenant_owner' | 'mechanic' | null
  }
}
