export type TenantStatus = 'active' | 'suspended'
export type TenantPlan = 'free' | 'pro' | 'enterprise'

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  subscription: TenantPlan
  createdAt: Date
}
