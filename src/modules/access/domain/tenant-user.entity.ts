export interface TenantUser {
  tenantId: string
  authUserId: string
  name: string
  email: string
  phone?: string
  role: 'tenant_owner' | 'manager' | 'mechanic'
  isActive: boolean
  createdAt: Date
}
