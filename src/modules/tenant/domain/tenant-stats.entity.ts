import { Tenant } from './tenant.entity'

/**
 * Extended tenant entity with computed statistics
 * Pure domain model - no database concerns
 */
export interface TenantOverview extends Tenant {
  customer_count: number
  active_jobs: number
  completed_jobs: number
  mechanic_count: number
  total_revenue: number
}
