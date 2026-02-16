import { JobRepository } from '../domain/job.repository'
import { JobCard, JobStatus } from '../domain/job.entity'
import { EstimateRepository } from '@/modules/estimate/domain/estimate.repository'
import { CreateEstimateUseCase } from '@/modules/estimate/application/create-estimate.use-case'
import { generateFormattedId } from '@/shared/utils/generators'
import {
  type SubscriptionTier,
  TIER_LIMITS,
  isLimitReached,
} from '@/config/plan-features'

export interface CreateJobDTO {
  customerId: string
  vehicleId: string
  description?: string
  notes?: string
  assignedMechanicId?: string
  details?: Record<string, any>
  serviceType?: string
  priority?: string
  estimatedCompletion?: string
  todos?: {
    id: string
    text: string
    completed: boolean
    createdAt: string
    completedAt?: string
  }[]
}

/**
 * Tenant context for subscription gating
 */
export interface TenantContext {
  tier: SubscriptionTier
  currentMonthJobCount: number
}

/**
 * Create Job Use Case
 * Creates a new job in the system with subscription tier limit checks
 */
export class CreateJobUseCase {
  constructor(
    private readonly repository: JobRepository,
    private readonly estimateRepository?: EstimateRepository
  ) { }

  async execute(
    dto: CreateJobDTO,
    tenantId: string,
    createdBy?: string,
    tenantContext?: TenantContext
  ): Promise<JobCard> {
    // Validation
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required')
    }
    if (!dto.vehicleId || dto.vehicleId.trim().length === 0) {
      throw new Error('Vehicle ID is required')
    }

    // =============================================
    // SUBSCRIPTION USAGE LIMIT CHECK
    // =============================================
    if (tenantContext) {
      const { tier, currentMonthJobCount } = tenantContext

      if (isLimitReached(tier, 'jobsPerMonth', currentMonthJobCount)) {
        const limit = TIER_LIMITS[tier].jobsPerMonth
        const tierLabel = tier === 'basic' ? 'Basic' : tier.charAt(0).toUpperCase() + tier.slice(1)

        if (tier === 'basic') {
          throw new JobLimitError(
            `You've reached your ${limit}-job monthly limit on the ${tierLabel} plan. Upgrade to Pro for up to 500 jobs/month.`,
            tier,
            currentMonthJobCount,
            limit
          )
        } else if (tier === 'pro') {
          throw new JobLimitError(
            `You've reached your ${limit}-job monthly limit on the ${tierLabel} plan. Upgrade to Enterprise for unlimited jobs.`,
            tier,
            currentMonthJobCount,
            limit
          )
        }
        // Enterprise: unlimited, never hits this
      }
    }

    // Generate job number (format: JOB-YYYYMMDD-XXXX)
    const jobNumber = generateFormattedId('JOB')

    const details = {
      ...(dto.details || {}),
      complaints: dto.description,
      description: dto.description,
      serviceType: dto.serviceType,
      priority: dto.priority,
      estimatedCompletion: dto.estimatedCompletion,
      todos: dto.todos || [],
    }

    const job = await this.repository.create({
      tenantId,
      jobNumber,
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      status: 'received' as JobStatus,
      description: dto.description,
      notes: dto.notes,
      assignedMechanicId: dto.assignedMechanicId,
      details,
      createdBy,
    })

    // Guardrail: ensure every job starts with an estimate
    if (this.estimateRepository) {
      const createEstimate = new CreateEstimateUseCase(this.estimateRepository)
      await createEstimate.execute(
        {
          customerId: dto.customerId,
          vehicleId: dto.vehicleId,
          jobcardId: job.id,
          description: dto.description || 'Service estimate',
          laborTotal: 0,
          partsTotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          currency: 'INR',
        },
        tenantId,
        createdBy,
      )
    }

    return job
  }
}

/**
 * Custom error for job limit violations
 */
export class JobLimitError extends Error {
  public readonly tier: SubscriptionTier
  public readonly currentCount: number
  public readonly maxLimit: number

  constructor(message: string, tier: SubscriptionTier, currentCount: number, maxLimit: number) {
    super(message)
    this.name = 'JobLimitError'
    this.tier = tier
    this.currentCount = currentCount
    this.maxLimit = maxLimit
  }
}
