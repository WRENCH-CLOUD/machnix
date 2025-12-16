// Domain exports
export type { Tenant, TenantStatus, TenantPlan } from './domain/tenant.entity'
export type { TenantWithStats, TenantStats } from './domain/tenant-stats.entity'

// Use Cases exports
export { CreateTenantWithOwnerUseCase } from './application/create-tenant-with-owner.usecase'
export { GetAllTenantsWithStatsUseCase } from './application/get-all-tenants-with-stats.usecase'
export { GetTenantWithStatsUseCase } from './application/get-tenant-with-stats.usecase'
export { UpdateTenantUseCase } from './application/update-tenant.usecase'
export { DeleteTenantUseCase } from './application/delete-tenant.usecase'

// Infrastructure exports
export type { TenantRepository } from './infrastructure/tenant.repository'
export { SupabaseTenantRepository } from './infrastructure/tenant.repository.supabase'
