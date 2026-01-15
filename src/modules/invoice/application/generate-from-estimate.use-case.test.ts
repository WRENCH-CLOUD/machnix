import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GenerateInvoiceFromEstimateUseCase } from './generate-from-estimate.use-case'
import { InvoiceRepository } from '../domain/invoice.repository'
import { EstimateRepository } from '@/modules/estimate/domain/estimate.repository'
import { Invoice } from '../domain/invoice.entity'

describe('GenerateInvoiceFromEstimateUseCase', () => {
  let useCase: GenerateInvoiceFromEstimateUseCase
  let mockInvoiceRepo: InvoiceRepository
  let mockEstimateRepo: EstimateRepository

  const mockEstimate = {
    id: 'est-123',
    tenantId: 'tenant-1',
    customerId: 'cust-1',
    jobcardId: 'job-1',
    estimateNumber: 'EST-001',
    subtotal: 100,
    taxAmount: 10,
    discountAmount: 0,
    totalAmount: 110,
  }

  const mockInvoice = {
    ...mockEstimate,
    id: 'inv-123',
    invoiceNumber: 'INV-001',
    paidAmount: 0,
    balance: 110,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    // Mock repositories
    mockInvoiceRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findByJobcardId: vi.fn(),
      // Add other methods as needed to satisfy interface
    } as unknown as InvoiceRepository

    mockEstimateRepo = {
      findById: vi.fn(),
    } as unknown as EstimateRepository

    useCase = new GenerateInvoiceFromEstimateUseCase(mockInvoiceRepo, mockEstimateRepo)
  })

  it('should create a new invoice if one does not exist', async () => {
    vi.mocked(mockEstimateRepo.findById).mockResolvedValue(mockEstimate as any)
    vi.mocked(mockInvoiceRepo.findByJobcardId).mockResolvedValue([])
    vi.mocked(mockInvoiceRepo.create).mockResolvedValue(mockInvoice as any)

    const result = await useCase.execute('est-123', 'tenant-1')

    expect(mockEstimateRepo.findById).toHaveBeenCalledWith('est-123')
    expect(mockInvoiceRepo.findByJobcardId).toHaveBeenCalledWith('job-1')
    expect(mockInvoiceRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      estimateId: 'est-123',
      totalAmount: 110,
      balance: 110,
      status: 'pending'
    }))
    expect(result).toEqual(mockInvoice)
  })

  it('should update existing invoice if found', async () => {
    vi.mocked(mockEstimateRepo.findById).mockResolvedValue({
      ...mockEstimate,
      totalAmount: 120, // increased amount
    } as any)
    
    vi.mocked(mockInvoiceRepo.findByJobcardId).mockResolvedValue([{
      id: 'existing-inv',
      estimateId: 'est-123',
      paidAmount: 50,
      status: 'pending',
    }] as any)

    vi.mocked(mockInvoiceRepo.update).mockResolvedValue({
      id: 'existing-inv',
      totalAmount: 120,
      balance: 70, // 120 - 50
    } as any)

    await useCase.execute('est-123', 'tenant-1')

    expect(mockInvoiceRepo.update).toHaveBeenCalledWith('existing-inv', expect.objectContaining({
      totalAmount: 120,
      balance: 70
    }))
  })

  it('should throw error if estimate not found', async () => {
    vi.mocked(mockEstimateRepo.findById).mockResolvedValue(null)

    await expect(useCase.execute('est-999', 'tenant-1'))
      .rejects.toThrow('Estimate not found')
  })
})
