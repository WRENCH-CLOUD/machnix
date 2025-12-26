import { TenantRepository } from '../infrastructure/tenant.repository'

/**
 * Use Case: Delete a tenant by ID
 * Validates existence before performing deletion
 */
export class DeleteTenantUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error('Tenant ID is required')
    }

    const existing = await this.tenantRepository.findById(id)
    if (!existing) {
      throw new Error('Tenant not found')
    }

    await this.tenantRepository.delete(id)
  }
}
