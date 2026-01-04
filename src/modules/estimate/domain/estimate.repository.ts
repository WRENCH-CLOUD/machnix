import {
  Estimate,
  EstimateWithRelations,
  EstimateStatus,
} from "./estimate.entity";

/**
 * Estimate Repository Interface
 * Defines the contract for estimate data operations
 */
export interface EstimateRepository {
  /**
   * Find all estimates for the current tenant
   */
  findAll(): Promise<EstimateWithRelations[]>;

  /**
   * Find estimates by status
   */
  findByStatus(status: EstimateStatus): Promise<EstimateWithRelations[]>;

  /**
   * Find an estimate by ID
   */
  findById(id: string): Promise<EstimateWithRelations | null>;

  /**
   * Find estimates by customer ID
   */
  findByCustomerId(customerId: string): Promise<Estimate[]>;

  /**
   * Find estimates by jobcard ID
   */
  findByJobcardId(jobcardId: string): Promise<Estimate[]>;

  /**
   * Create a new estimate
   */
  create(
    estimate: Omit<Estimate, "id" | "createdAt" | "updatedAt">
  ): Promise<Estimate>;

  /**
   * Update an existing estimate
   */
  update(id: string, estimate: Partial<Estimate>): Promise<Estimate>;

  /**
   * Update estimate status
   */
  updateStatus(id: string, status: EstimateStatus): Promise<Estimate>;

  /**
   * Approve an estimate
   */
  approve(id: string, approvedBy: string): Promise<Estimate>;

  /**
   * Reject an estimate
   */
  reject(id: string, rejectedBy: string, reason?: string): Promise<Estimate>;

  /**
   * Delete an estimate (soft delete)
   */
  delete(id: string): Promise<void>;
  /**
   * Add an item to an estimate
   */
  addItem(estimateId: string, item: any): Promise<any>;

  /**
   * Update an estimate item
   */
  updateItem(itemId: string, updates: any): Promise<any>;

  /**
   * Remove an estimate item
   */
  removeItem(itemId: string): Promise<void>;
}
