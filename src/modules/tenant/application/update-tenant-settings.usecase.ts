
import { TenantRepository } from '../infrastructure/tenant.repository'
import { TenantSettings } from '../domain/tenant-settings.entity'

export class UpdateTenantSettingsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(tenantId: string, data: { name?: string } & Partial<TenantSettings>): Promise<void> {
    const promises: Promise<unknown>[] = []
    const operations: string[] = []

    if (data.name) {
      promises.push(this.tenantRepository.update(tenantId, { name: data.name }))
      operations.push('updateName')
    }

    // Extract settings fields
    const {...settings } = data
    if (Object.keys(settings).length > 0) {
      promises.push(this.tenantRepository.updateSettings(tenantId, settings))
      operations.push('updateSettings')
    }

    if (promises.length === 0) {
      return
    }

    const results = await Promise.allSettled(promises)

    const failedOperations: string[] = []
    const errorMessages: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const opName = operations[index] ?? `operation_${index}`
        failedOperations.push(opName)
        errorMessages.push(
          `${opName} failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`
        )
      }
    })

    if (failedOperations.length > 0) {
      throw new Error(
        `Failed to update tenant settings for tenantId=${tenantId}. ` +
        `Failed operations: ${failedOperations.join(', ')}. ` +
        `Details: ${errorMessages.join(' | ')}`
      )
    }
  }
}
