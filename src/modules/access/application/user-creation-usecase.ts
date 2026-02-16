import { AuthRepository, CreateUserInput } from '../infrastructure/auth.repository'
import {
  type SubscriptionTier,
  TIER_LIMITS,
  isLimitReached,
} from '@/config/plan-features'

/**
 * Tenant context for subscription gating
 */
export interface TenantContext {
  tier: SubscriptionTier
  currentStaffCount: number
}

export class UserCreationUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(input: CreateUserInput, tenantContext?: TenantContext) {
    if (!input.email) {
      throw new Error('Email is required')
    }

    // =============================================
    // SUBSCRIPTION STAFF LIMIT CHECK
    // =============================================
    if (tenantContext) {
      const { tier, currentStaffCount } = tenantContext

      if (isLimitReached(tier, 'staffCount', currentStaffCount)) {
        const limit = TIER_LIMITS[tier].staffCount
        const tierLabel = tier === 'basic' ? 'Basic' : tier.charAt(0).toUpperCase() + tier.slice(1)

        throw new StaffLimitError(
          `You've reached your ${limit}-staff limit on the ${tierLabel} plan. Upgrade to add more team members.`,
          tier,
          currentStaffCount,
          limit
        )
      }
    }

    const emailTaken = await this.authRepo.emailExists(input.email)
    if (emailTaken) {
      throw new Error('Email already exists')
    }

    const user = await this.authRepo.createUser(input)

    return user
  }
}

/**
 * Custom error for staff limit violations
 */
export class StaffLimitError extends Error {
  public readonly tier: SubscriptionTier
  public readonly currentCount: number
  public readonly maxLimit: number

  constructor(message: string, tier: SubscriptionTier, currentCount: number, maxLimit: number) {
    super(message)
    this.name = 'StaffLimitError'
    this.tier = tier
    this.currentCount = currentCount
    this.maxLimit = maxLimit
  }
}
