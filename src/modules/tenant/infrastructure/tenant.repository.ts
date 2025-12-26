import { Tenant, TenantStatus } from '../domain/tenant.entity'
import { TenantStats } from '../domain/tenant-stats.entity'

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>
  findBySlug(slug: string): Promise<Tenant | null>
  findAll(): Promise<Tenant[]>
  getStats(tenantId: string): Promise<TenantStats>
  isSlugAvailable(slug: string): Promise<boolean>
  create(input: {
    name: string
    slug: string
    subscription: string
    status: TenantStatus
  }): Promise<Tenant>
  update(id: string, updates: Partial<Tenant>): Promise<Tenant>
  delete(id: string): Promise<void>
}
