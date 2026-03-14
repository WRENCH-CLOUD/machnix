
import { TenantRepository } from '../infrastructure/tenant.repository'
import { TenantSettings } from '../domain/tenant-settings.entity'

export class UpdateTenantSettingsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(tenantId: string, data: { name?: string } & Partial<TenantSettings>): Promise<{ warnings: string[] }> {
    const allowedTemplates = new Set(['auto', 'standard', 'compact', 'detailed'])

    const promises: Promise<unknown>[] = []
    const operations: string[] = []
    const warnings: string[] = []

    const { name, id: _id, tenantId: _tenantId, updatedAt: _updatedAt, ...settings } = data

    if (name) {
      const trimmedName = name.trim()
      if (trimmedName.length === 0) {
        throw new Error('Tenant name cannot be empty')
      }

      promises.push(this.tenantRepository.update(tenantId, { name: trimmedName }))
      operations.push('updateName')
    }

    if (settings.invoiceTemplate !== undefined && settings.invoiceTemplate !== null) {
      if (!allowedTemplates.has(settings.invoiceTemplate)) {
        throw new Error(
          `Invalid invoiceTemplate value: ${settings.invoiceTemplate}. ` +
          'Allowed values: auto, standard, compact, detailed.'
        )
      }
    }

    if (Object.keys(settings).length > 0) {
      promises.push(this.tenantRepository.updateSettings(tenantId, settings))
      operations.push('updateSettings')
    }

    if (promises.length === 0) {
      return { warnings }
    }

    const results = await Promise.allSettled(promises)

    const failedOperations: string[] = []
    const errorMessages: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const errMessage = result.reason instanceof Error ? result.reason.message : String(result.reason)
        if (errMessage.includes('PARTIAL_SUCCESS')) {
          warnings.push(errMessage.replace('PARTIAL_SUCCESS: ', ''))
        } else {
          const opName = operations[index] ?? `operation_${index}`
          failedOperations.push(opName)
          errorMessages.push(`${opName} failed: ${errMessage}`)
        }
      }
    })

    if (failedOperations.length > 0) {
      throw new Error(
        `Failed to update tenant settings for tenantId=${tenantId}. ` +
        `Failed operations: ${failedOperations.join(', ')}. ` +
        `Details: ${errorMessages.join(' | ')}`
      )
    }

    return { warnings }
  }
}
