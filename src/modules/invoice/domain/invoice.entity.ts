/**
 * Invoice Status Types
 */
export type InvoiceStatus = 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'

/**
 * Payment Mode Types
 */
export type PaymentMode = 'cash' | 'razorpay' | 'card' | 'upi' | 'bank_transfer'

/**
 * Payment Status Types
 */
export type PaymentStatus = 'initiated' | 'success' | 'failed'

/**
 * Invoice Entity
 * Domain model representing an invoice in the system
 */
export interface Invoice {
  id: string
  tenantId: string
  customerId: string
  jobcardId?: string
  estimateId?: string
  invoiceNumber?: string
  status: InvoiceStatus
  subtotal: number
  taxAmount: number
  discountAmount: number
  discountPercentage: number
  totalAmount: number
  paidAmount: number
  balance: number
  isGstBilled: boolean
  invoiceDate: Date
  dueDate?: Date
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}

/**
 * Payment Transaction Entity
 */
export interface PaymentTransaction {
  id: string
  tenantId: string
  invoiceId: string
  mode: PaymentMode
  amount: number
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  status: PaymentStatus
  createdAt: Date
  paidAt?: Date
  deletedAt?: Date
  deletedBy?: string
}

/**
 * Invoice with related entities
 */
export interface InvoiceWithRelations extends Invoice {
  customer?: any
  jobcard?: any
  estimate?: any
  payments?: PaymentTransaction[]
}
