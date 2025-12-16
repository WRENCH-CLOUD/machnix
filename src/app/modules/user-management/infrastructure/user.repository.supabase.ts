import { UserRepository } from '../domain/user.repository'
import { User, Mechanic, UserRole } from '../domain/user.entity'
import { supabase, ensureTenantContext } from '@/lib/supabase/client'

type DbUser = any // Database row type

/**
 * Supabase implementation of UserRepository
 */
export class SupabaseUserRepository implements UserRepository {
  private toDomain(row: DbUser): User {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      authUserId: row.auth_user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role as UserRole,
      avatarUrl: row.avatar_url,
      isActive: row.is_active,
      lastLogin: row.last_login ? new Date(row.last_login) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      deletedBy: row.deleted_by,
    }
  }

  private toMechanic(row: DbUser): Mechanic {
    return {
      ...this.toDomain(row),
      specialty: row.specialty,
    }
  }

  private toDatabase(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): DbUser {
    return {
      tenant_id: user.tenantId,
      auth_user_id: user.authUserId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatarUrl,
      is_active: user.isActive,
      last_login: user.lastLogin?.toISOString(),
    }
  }

  async findAll(): Promise<User[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('role', role as any)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toDomain(row))
  }

  async findAllMechanics(): Promise<Mechanic[]> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('role', 'mechanic' as any)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map(row => this.toMechanic(row))
  }

  async findById(id: string): Promise<User | null> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data ? this.toDomain(data) : null
  }

  async findByAuthUserId(authUserId: string): Promise<User | null> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data ? this.toDomain(data) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const tenantId = ensureTenantContext()

    const { data, error } = await supabase
      .schema('tenant')
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data ? this.toDomain(data) : null
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { data, error } = await supabase
      .schema('tenant')
      .from('users')
      .insert(this.toDatabase(user))
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const tenantId = ensureTenantContext()

    const dbUpdates: Record<string, any> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.role !== undefined) dbUpdates.role = updates.role
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
    if (updates.lastLogin !== undefined) dbUpdates.last_login = updates.lastLogin?.toISOString()

    const { data, error } = await supabase
      .schema('tenant')
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error
    return this.toDomain(data)
  }

  async updateLastLogin(id: string): Promise<User> {
    return this.update(id, { lastLogin: new Date() })
  }

  async deactivate(id: string): Promise<User> {
    return this.update(id, { isActive: false })
  }

  async activate(id: string): Promise<User> {
    return this.update(id, { isActive: true })
  }

  async delete(id: string): Promise<void> {
    const tenantId = ensureTenantContext()

    const { error } = await supabase
      .schema('tenant')
      .from('users')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }
}
