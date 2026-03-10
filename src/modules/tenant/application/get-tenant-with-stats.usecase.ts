import { TenantRepository } from '../infrastructure/tenant.repository'

/**
 * Use Case: Get single tenant with statistics
 * Pure application logic - orchestrates repository calls
 */
export class GetTenantWithStatsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) { }

  async execute(tenantId: string): Promise<any | null> {
    // Run all 3 independent queries in parallel (~600ms → ~200ms)
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
