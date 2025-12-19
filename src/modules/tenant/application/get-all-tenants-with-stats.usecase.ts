import { TenantRepository } from '../infrastructure/tenant.repository'
import { TenantWithStats } from '../domain/tenant-stats.entity'

/**
 * Use Case: Get all tenants with their statistics
 * Pure application logic - orchestrates repository calls
 */
export class GetAllTenantsWithStatsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(): Promise<TenantWithStats[]> {
    // Fetch all tenants
    const tenants = await this.tenantRepository.findAll()

    // Fetch stats for each tenant in parallel
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        try {
          const stats = await this.tenantRepository.getStats(tenant.id)
          return {
            ...tenant,
            ...stats,
          }
        } catch (err) {
          console.error(`Error fetching stats for tenant ${tenant.id}:`, err)
          // Return tenant with zero stats on error
          return {
            ...tenant,
            customer_count: 0,
            active_jobs: 0,
            completed_jobs: 0,
            mechanic_count: 0,
            total_revenue: 0,
          }
        }
      })
    )

    return tenantsWithStats
  }
}
