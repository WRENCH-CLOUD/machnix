import { Tenant } from '../domain/tenant.entity'
import { TenantOverview } from '../domain/tenant-stats.entity'

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>
  findBySlug(slug: string): Promise<Tenant | null>
  findAll(): Promise<Tenant[]>
  getStats(tenantId: string): Promise<TenantOverview>
  isSlugAvailable(slug: string): Promise<boolean>
  getAllWithStats(): Promise<TenantOverview[]>;
  create(input: {
    name: string
    slug: string
    subscription: string
    status: 'active' | 'inactive'
  }): Promise<Tenant>
  update(id: string, updates: Partial<Tenant>): Promise<Tenant>
  delete(id: string): Promise<void>
}
