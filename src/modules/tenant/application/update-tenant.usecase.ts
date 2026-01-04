import { TenantRepository } from '../infrastructure/tenant.repository'
import { Tenant, TenantStatus, TenantPlan } from '../domain/tenant.entity'
import { slugRegex } from '../domain/tenant.rules'

export interface UpdateTenantDTO {
  name?: string
  slug?: string
  status?: TenantStatus
  subscription?: TenantPlan
}

/**
 * Use Case: Update a tenant's information
 * Validates input and performs the update
 */
export class UpdateTenantUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(id: string, dto: UpdateTenantDTO): Promise<Tenant> {
    if (!id) {
      throw new Error('Tenant ID is required')
    }

    // Check if tenant exists
    const existing = await this.tenantRepository.findById(id)
    if (!existing) {
      throw new Error('Tenant not found')
    }

    // Validate name if provided
    if (dto.name !== undefined && dto.name.trim().length === 0) {
      throw new Error('Tenant name cannot be empty')
    }

    // Validate slug if provided
    if (dto.slug !== undefined) {
      if (dto.slug.trim().length === 0) {
        throw new Error('Tenant slug cannot be empty')
      }
      if (!slugRegex(dto.slug)) {
        throw new Error('Slug must contain only lowercase letters, numbers, and hyphens')
      }
      // Check slug uniqueness only if it's changing
      if (dto.slug !== existing.slug) {
        const slugAvailable = await this.tenantRepository.isSlugAvailable(dto.slug)
        if (!slugAvailable) {
          throw new Error('Slug is already in use')
        }
      }
    }

    // Build the updates object with only defined values
    const updates: Partial<Tenant> = {}
    if (dto.name !== undefined) updates.name = dto.name.trim()
    if (dto.slug !== undefined) updates.slug = dto.slug.trim()
    if (dto.status !== undefined) updates.status = dto.status
    if (dto.subscription !== undefined) updates.subscription = dto.subscription

    return this.tenantRepository.update(id, updates)
  }
}

