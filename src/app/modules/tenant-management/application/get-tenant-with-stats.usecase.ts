import { TenantRepository } from '../infrastructure/tenant.repository'
import { TenantWithStats } from '../domain/tenant-stats.entity'

/**
 * Use Case: Get single tenant with statistics
 * Pure application logic - orchestrates repository calls
 */
export class GetTenantWithStatsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(tenantId: string): Promise<TenantWithStats | null> {
    // Fetch tenant
    const tenant = await this.tenantRepository.findById(tenantId)

    if (!tenant) {
      return null
    }

    // Fetch stats
    const stats = await this.tenantRepository.getStats(tenantId)

    return {
      ...tenant,
      ...stats,
    }
  }
}
