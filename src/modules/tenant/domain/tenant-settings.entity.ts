
export interface TenantSettings {
  id: string
  tenantId: string
  legalName: string | null
  gstNumber: string | null
  panNumber: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  businessPhone: string | null
  businessEmail: string | null
  website: string | null
  
  // Operational
  taxRate: number
  currency: string
  timezone: string
  
  // Notifications
  smsEnabled: boolean
  emailEnabled: boolean
  
  // Prefixes
  invoicePrefix: string
  jobPrefix: string
  estimatePrefix: string
  invoiceFooter: string | null
  
  // Branding
  logoUrl: string | null
  
  updatedAt: Date
}
