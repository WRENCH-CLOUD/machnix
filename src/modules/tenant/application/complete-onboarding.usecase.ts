import { TenantSettings } from '../domain/tenant-settings.entity'
import { TenantRepository } from '../infrastructure/tenant.repository'

export interface CompleteOnboardingInput {
  tenantId: string
  garageName: string
  legalName?: string
  gstNumber?: string
  panNumber?: string
  address: string
  city: string
  state: string
  pincode?: string
  businessPhone: string
  businessEmail?: string
  taxRate?: number
  currency?: string
  invoicePrefix?: string
  jobPrefix?: string
}

export interface CompleteOnboardingOutput {
  success: boolean
}

export class CompleteOnboardingUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(input: CompleteOnboardingInput): Promise<CompleteOnboardingOutput> {
    // Update tenant name if provided
    await this.tenantRepository.update(input.tenantId, {
      name: input.garageName
    })

    // Update tenant settings
    const settings: Partial<TenantSettings> = {
      legalName: input.legalName,
      gstNumber: input.gstNumber,
      panNumber: input.panNumber,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      businessPhone: input.businessPhone,
      businessEmail: input.businessEmail,
      taxRate: input.taxRate ?? 18,
      currency: input.currency ?? 'INR',
      invoicePrefix: input.invoicePrefix ?? 'INV-',
      jobPrefix: input.jobPrefix ?? 'JOB-'
    }

    await this.tenantRepository.updateSettings(input.tenantId, settings)

    // Mark tenant as onboarded
    await this.tenantRepository.markOnboarded(input.tenantId)

    return { success: true }
  }
}
