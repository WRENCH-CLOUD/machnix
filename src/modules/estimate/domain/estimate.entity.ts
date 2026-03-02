/**
 * Estimate Status Types
 */
export type EstimateStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'expired'

/**
 * EstimateItem Entity
 * Represents a line item in an estimate
 */
export interface EstimateItem {
  id: string
  estimateId: string
  partId?: string
  customName?: string
  customPartNumber?: string
  qty: number
  unitPrice: number
  laborCost: number
  total: number
  createdAt: Date
  deletedAt?: Date
}

/**
 * Estimate Entity
 * Domain model representing an estimate/quote in the system
 */
export interface Estimate {
  id: string
  tenantId: string
  customerId: string
  vehicleId: string
  jobcardId?: string
  estimateNumber: string
  status: EstimateStatus
  laborTotal: number
  partsTotal: number
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  currency: string
  validUntil?: Date
  approvedAt?: Date
  approvedBy?: string
  rejectedAt?: Date
  rejectedBy?: string
  rejectionReason?: string
  createdBy?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}

/**
 * Estimate with related entities
 */
export interface EstimateWithRelations extends Estimate {
  customer?: any
  vehicle?: any
  jobcard?: any
  items?: EstimateItem[]
}
