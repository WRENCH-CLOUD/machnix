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
  // Dashboard insight metrics
  pending_jobs?: number   // Jobs in 'received' status
  ready_jobs?: number     // Jobs in 'ready' status
  jobs_this_week?: number // Jobs created in the last 7 days
  // Subscription usage metrics
  jobs_this_month?: number
  whatsapp_this_month?: number
  staff_count?: number
  vehicle_count?: number
  active_overrides_count?: number
}

/**
 * Extended tenant entity with computed statistics
 * Pure domain model - no database concerns
 */
export interface TenantWithStats extends Tenant, TenantStats {
  recentJobs?: Array<{
    id: string;
    customer: string;
    vehicle: string;
    status: string;
    priority: string;
  }>;
}

// Backwards-compatible alias used in some parts of the codebase
export type TenantOverview = TenantWithStats
