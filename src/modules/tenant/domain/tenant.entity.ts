export type TenantStatus = 'active' | 'suspended' | 'trial'
export type TenantPlan = 'starter' | 'pro' | 'enterprise'

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  subscription: TenantPlan
  createdAt: Date
}

