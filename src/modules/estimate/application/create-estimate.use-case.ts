import { EstimateRepository } from '../domain/estimate.repository'
import { Estimate } from '../domain/estimate.entity'

export interface CreateEstimateDTO {
  customerId: string
  vehicleId: string
  jobcardId?: string
  description?: string
  laborTotal: number
  partsTotal: number
  taxAmount?: number
  discountAmount?: number
  currency?: string
  validUntil?: Date
}

/**
 * Create Estimate Use Case
 * Creates a new estimate in the system
 */
export class CreateEstimateUseCase {
  constructor(private readonly repository: EstimateRepository) {}

  async execute(dto: CreateEstimateDTO, tenantId: string, createdBy?: string): Promise<Estimate> {
    // Validation
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required')
    }
    if (!dto.vehicleId || dto.vehicleId.trim().length === 0) {
      throw new Error('Vehicle ID is required')
    }
    if (dto.laborTotal < 0) {
      throw new Error('Labor total cannot be negative')
    }
    if (dto.partsTotal < 0) {
      throw new Error('Parts total cannot be negative')
    }

    // Generate estimate number (format: EST-YYYYMMDD-XXXX)
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const estimateNumber = `EST-${dateStr}-${randomNum}`

    // Calculate totals
    const subtotal = dto.laborTotal + dto.partsTotal
    const taxAmount = dto.taxAmount || 0
    const discountAmount = dto.discountAmount || 0
    const totalAmount = subtotal + taxAmount - discountAmount

    return this.repository.create({
      tenantId,
      estimateNumber,
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      jobcardId: dto.jobcardId,
      status: 'draft',
      description: dto.description,
      laborTotal: dto.laborTotal,
      partsTotal: dto.partsTotal,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      currency: dto.currency || 'INR',
      validUntil: dto.validUntil,
      createdBy,
    })
  }
}

