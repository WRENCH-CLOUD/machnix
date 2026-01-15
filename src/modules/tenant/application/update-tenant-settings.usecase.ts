
import { TenantRepository } from '../infrastructure/tenant.repository'
import { TenantSettings } from '../domain/tenant-settings.entity'

export class UpdateTenantSettingsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(tenantId: string, data: { name?: string } & Partial<TenantSettings>): Promise<void> {
    const promises = []

    if (data.name) {
      promises.push(this.tenantRepository.update(tenantId, { name: data.name }))
    }

    // Extract settings fields
    const { name, ...settings } = data
    if (Object.keys(settings).length > 0) {
      promises.push(this.tenantRepository.updateSettings(tenantId, settings))
    }

    await Promise.all(promises)
  }
}
