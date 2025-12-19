export interface User {
  id: string
  email: string
  emailVerified: boolean
  phone?: string
  role: string
  tenantId?: string
  isActive: boolean
  createdAt: Date
  metadata?: Record<string, any>
}
