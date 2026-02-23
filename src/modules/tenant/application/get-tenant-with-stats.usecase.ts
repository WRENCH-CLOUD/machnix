import { TenantRepository } from '../infrastructure/tenant.repository'

/**
 * Use Case: Get single tenant with statistics
 * Pure application logic - orchestrates repository calls
 */
export class GetTenantWithStatsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(tenantId: string): Promise<any | null> {
    // Fetch tenant, stats, and recent jobs in parallel (not serial)
    // This saves ~500-800ms by avoiding 3 sequential round-trips to Supabase
    const [tenant, stats, recentJobs] = await Promise.all([
      this.tenantRepository.findById(tenantId),
      this.tenantRepository.getStats(tenantId),
      this.tenantRepository.getRecentJobs(tenantId),
    ])

    if (!tenant) {
      return null
    }

    return {
      ...tenant,
      ...stats,
      recentJobs
    }
  }
}
