import { Tenant } from './tenant.entity'

/**
 * Stats-only model for tenant aggregates
 */
export interface TenantStats {
  customer_count: number
  active_jobs: number
  completed_jobs: number
  mechanic_count: number
  total_revenue: number
}

/**
 * Extended tenant entity with computed statistics
 * Pure domain model - no database concerns
 */
export interface TenantWithStats extends Tenant, TenantStats {}

// Backwards-compatible alias used in some parts of the codebase
export type TenantOverview = TenantWithStats
