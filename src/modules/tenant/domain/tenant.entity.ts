import type { SubscriptionTier, SubscriptionStatus } from '@/config/plan-features'

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'inactive'
export type TenantPlan = SubscriptionTier

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  subscription: TenantPlan
  subscriptionStatus: SubscriptionStatus
  billingCycleAnchor?: Date
  usageCounters: {
    job_count: number
    staff_count: number
    whatsapp_count: number
  }
  isOnboarded: boolean
  createdAt: Date
}
