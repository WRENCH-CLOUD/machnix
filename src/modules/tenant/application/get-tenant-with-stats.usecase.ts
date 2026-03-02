import { TenantRepository } from '../infrastructure/tenant.repository'

/**
 * Use Case: Get single tenant with statistics
 * Pure application logic - orchestrates repository calls
 */
export class GetTenantWithStatsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(tenantId: string): Promise<any | null> {
    // Fetch tenant
    const tenant = await this.tenantRepository.findById(tenantId)

    if (!tenant) {
      return null
    }

    // Fetch stats
    const stats = await this.tenantRepository.getStats(tenantId)
    
    // Fetch recent jobs
    const recentJobs = await this.tenantRepository.getRecentJobs(tenantId)

    return {
      ...tenant,
      ...stats,
      recentJobs
    }
  }
}
