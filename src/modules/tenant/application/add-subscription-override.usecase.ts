/**
 * Add Subscription Override Use Case
 * 
 * Handles admin-granted top-ups and manual extensions.
 * Creates override records in the entitlement ledger and sends notifications.
 */

import { TenantRepository } from '../infrastructure/tenant.repository'
import { getNotificationProvider } from '@/lib/billing'
import type { CreateOverrideInput, SubscriptionOverride } from '@/lib/entitlements/types'

interface AddOverrideParams {
  tenantId: string
  input: CreateOverrideInput
}

interface AddOverrideResult {
  success: boolean
  override?: SubscriptionOverride
  error?: string
}

export class AddSubscriptionOverrideUseCase {
  constructor(private readonly repo: TenantRepository) {}

  async execute(params: AddOverrideParams): Promise<AddOverrideResult> {
    const { tenantId, input } = params

    // 1. Validate tenant exists
    const tenant = await this.repo.findById(tenantId)
    if (!tenant) {
      return { success: false, error: 'Tenant not found' }
    }

    // 2. Validate override input
    if (!input.featureKey || input.featureKey.trim() === '') {
      return { success: false, error: 'Feature key is required' }
    }
    if (typeof input.quantity !== 'number' || input.quantity <= 0) {
      return { success: false, error: 'Quantity must be a positive number' }
    }

    // 3. Create the override record
    const override = await this.repo.addSubscriptionOverride(tenantId, {
      featureKey: input.featureKey.trim(),
      quantity: input.quantity,
      expiresAt: input.expiresAt || null,
      reason: input.reason?.trim() || undefined,
      createdBy: input.createdBy || undefined,
    })

    // 4. Notify tenant
    const notificationProvider = getNotificationProvider()
    await notificationProvider.sendTopupConfirmation(
      tenantId,
      input.featureKey,
      input.quantity,
      input.reason
    )

    return {
      success: true,
      override,
    }
  }
}
