import { TenantRepository } from '../infrastructure/tenant.repository'
import { Tenant } from '../domain/tenant.entity'
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


/**
 * Use Case: Update tenant fields
 */
export class UpdateTenantUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    if (!id) {
      throw new Error('Tenant ID is required')
    }

    const existing = await this.tenantRepository.findById(id)
    if (!existing) {
      throw new Error('Tenant not found')
    }

    // If slug is changing, ensure availability
    if (updates.slug && updates.slug.trim() !== existing.slug) {
      const available = await this.tenantRepository.isSlugAvailable(updates.slug.trim())
      if (!available) {
        throw new Error('Slug is already in use')
      }
    }

    const sanitized: Partial<Tenant> = {}
    if (typeof updates.name === 'string') sanitized.name = updates.name.trim()
    if (typeof updates.slug === 'string') sanitized.slug = updates.slug.trim()
    if (typeof updates.status === 'string') sanitized.status = updates.status
    if (typeof updates.subscription === 'string') sanitized.subscription = updates.subscription

    return this.tenantRepository.update(id, sanitized)
  }
}

