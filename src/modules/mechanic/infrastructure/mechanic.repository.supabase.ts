import { BaseSupabaseRepository } from '@/shared/infrastructure/base-supabase.repository'
import { MechanicRepository } from '../domain/mechanic.repository'
import { Mechanic, CreateMechanicInput, UpdateMechanicInput } from '../domain/mechanic.entity'

type DbMechanic = {
    id: string
    tenant_id: string
    name: string
    phone: string | null
    email: string | null
    is_active: boolean
    created_at: string
    updated_at: string
    deleted_at: string | null
    auth_user_id: string | null
}

/**
 * Supabase implementation of MechanicRepository
 */
export class SupabaseMechanicRepository
    extends BaseSupabaseRepository<Mechanic, DbMechanic>
    implements MechanicRepository {
    protected toDomain(row: DbMechanic): Mechanic {
        return {
            id: row.id,
            tenantId: row.tenant_id,
            name: row.name,
            phone: row.phone || undefined,
            email: row.email || undefined,
            isActive: row.is_active ?? true,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at || row.created_at),
            deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
            authUserId: row.auth_user_id || undefined,
        }
    }

    protected toDatabase(entity: Omit<Mechanic, 'id' | 'createdAt' | 'updatedAt'>): DbMechanic {
        return {
            id: '',
            tenant_id: entity.tenantId,
            name: entity.name,
            phone: entity.phone || null,
            email: entity.email || null,
            is_active: entity.isActive,
            created_at: '',
            updated_at: '',
            deleted_at: entity.deletedAt?.toISOString() || null,
            auth_user_id: entity.authUserId || null,
        }
    }

    async findAll(): Promise<Mechanic[]> {
        const tenantId = this.getContextTenantId()

        const { data, error } = await this.supabase
            .schema('tenant')
            .from('mechanics')
            .select('*')
            .eq('tenant_id', tenantId)
            .is('deleted_at', null)
            .order('name', { ascending: true })

        if (error) throw error
        return (data || []).map(row => this.toDomain(row as DbMechanic))
    }

    async findAllActive(): Promise<Mechanic[]> {
        const tenantId = this.getContextTenantId()

        const { data, error } = await this.supabase
            .schema('tenant')
            .from('mechanics')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('name', { ascending: true })

        if (error) throw error
        return (data || []).map(row => this.toDomain(row as DbMechanic))
    }

    async findById(id: string): Promise<Mechanic | null> {
        const tenantId = this.getContextTenantId()

        const { data, error } = await this.supabase
            .schema('tenant')
            .from('mechanics')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .is('deleted_at', null)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null
            throw error
        }

        return data ? this.toDomain(data as DbMechanic) : null
    }

    async create(input: CreateMechanicInput): Promise<Mechanic> {
        const tenantId = this.getContextTenantId()

        const { data, error } = await this.supabase
            .schema('tenant')
            .from('mechanics')
            .insert({
                tenant_id: tenantId,
                name: input.name,
                phone: input.phone || null,
                email: input.email || null,
                is_active: true,
            })
            .select()
            .single()

        if (error) throw error
        return this.toDomain(data as DbMechanic)
    }

    async update(id: string, input: UpdateMechanicInput): Promise<Mechanic> {
        const tenantId = this.getContextTenantId()

        const updates: Record<string, unknown> = {}
        if (input.name !== undefined) updates.name = input.name
        if (input.phone !== undefined) updates.phone = input.phone
        if (input.email !== undefined) updates.email = input.email
        if (input.isActive !== undefined) updates.is_active = input.isActive

        const { data, error } = await this.supabase
            .schema('tenant')
            .from('mechanics')
            .update(updates)
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .select()
            .single()

        if (error) throw error
        return this.toDomain(data as DbMechanic)
    }

    async delete(id: string): Promise<void> {
        const tenantId = this.getContextTenantId()

        const { error } = await this.supabase
            .schema('tenant')
            .from('mechanics')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .eq('tenant_id', tenantId)

        if (error) throw error
    }
}
