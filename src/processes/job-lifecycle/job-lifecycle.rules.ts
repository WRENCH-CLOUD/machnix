import { JobStatus } from '@/modules/job/domain/job.entity'

/**
 * Valid status transitions for job lifecycle state machine.
 *
 *   received  ──▸ working  ──▸ ready  ──▸ completed
 *       │            │           │
 *       ▼            ▼           ▼
 *   cancelled    cancelled    cancelled
 *
 * - Self-transitions are allowed (idempotent).
 * - `completed` and `cancelled` are terminal states.
 * - `ready → working` is allowed (rework scenario).
 * - `working → received` is allowed (return to queue).
 */
const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  received:  ['received', 'working', 'cancelled'],
  working:   ['received', 'working', 'ready', 'cancelled'],
  ready:     ['working', 'ready', 'completed', 'cancelled'],
  completed: ['completed'],
  cancelled: ['cancelled'],
}

export class JobLifecycleRules {
  /**
   * Returns true when the transition is permitted by the state machine.
   */
  static isValidTransition(from: JobStatus, to: JobStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false
  }

  /**
   * Throws if the transition is not permitted.
   */
  static ensureValidTransition(from: JobStatus, to: JobStatus): void {
    if (!this.isValidTransition(from, to)) {
      throw new Error(
        `Invalid status transition: Cannot change from '${from}' to '${to}'`,
      )
    }
  }

  /**
   * Throws if the job is in a terminal (locked) state.
   */
  static ensureNotTerminal(status: JobStatus): void {
    if (status === 'completed') {
      throw new Error('Cannot modify a completed job')
    }
    if (status === 'cancelled') {
      throw new Error('Cannot modify a cancelled job')
    }
  }

  /**
   * Guards that payment is fully settled before completing a job.
   */
  static ensureCanCompletePayment(paymentStatus: string): void {
    if (paymentStatus !== 'COMPLETED') {
      throw new Error(
        'Payment cannot be completed unless the status is COMPLETED.',
      )
    }
  }

  /**
   * Guards that both job and payment are complete before closing.
   */
  static ensureCanCloseJob(jobStatus: string, paymentStatus: string): void {
    if (jobStatus !== 'COMPLETED' || paymentStatus !== 'COMPLETED') {
      throw new Error(
        'Job cannot be closed unless both job status and payment status are COMPLETED.',
      )
    }
  }
}
