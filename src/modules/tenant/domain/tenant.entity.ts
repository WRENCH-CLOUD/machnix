export type TenantStatus = 'active' | 'suspended' | 'trial'
export type TenantPlan = 'basic' | 'pro' | 'enterprise'

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  subscription: TenantPlan
  isOnboarded: boolean
  createdAt: Date
}

