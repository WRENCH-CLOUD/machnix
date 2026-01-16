import { Tenant, TenantStatus } from '../domain/tenant.entity'
import { TenantStats } from '../domain/tenant-stats.entity'
import { TenantSettings } from '../domain/tenant-settings.entity'

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>
  findBySlug(slug: string): Promise<Tenant | null>
  findAll(): Promise<Tenant[]>
  
  // Settings methods
  getSettings(tenantId: string): Promise<TenantSettings | null>
  updateSettings(tenantId: string, settings: Partial<TenantSettings>): Promise<void>
  
  // Stats methods
  getStats(tenantId: string): Promise<TenantStats>
  getRecentJobs(tenantId: string, limit?: number): Promise<any[]>
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
