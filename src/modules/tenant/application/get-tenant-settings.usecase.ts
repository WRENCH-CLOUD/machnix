
import { TenantRepository } from '../infrastructure/tenant.repository'
import { TenantSettings } from '../domain/tenant-settings.entity'

export class GetTenantSettingsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(tenantId: string): Promise<{ settings: TenantSettings | null, name: string }> {
    const [settings, tenant] = await Promise.all([
      this.tenantRepository.getSettings(tenantId),
      this.tenantRepository.findById(tenantId)
    ])

    return {
      settings,
      name: tenant?.name || ''
    }
  }
}
