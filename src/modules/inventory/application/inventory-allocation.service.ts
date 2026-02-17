import { SupabaseClient } from '@supabase/supabase-js'
import { supabase as defaultSupabase } from '@/lib/supabase/client'
import { SupabaseInventoryRepository } from '../infrastructure/inventory.repository.supabase'
import { SupabaseAllocationRepository } from '../infrastructure/allocation.repository.supabase'
import { ReserveStockUseCase, ReserveStockResult } from './reserve-stock.use-case'
import { ConsumeStockUseCase, ConsumeStockResult } from './consume-stock.use-case'
import { ReleaseStockUseCase, ReleaseStockResult } from './release-stock.use-case'
import { InventoryAllocation } from '../domain/allocation.entity'
import { getStockAvailable } from '../domain/inventory.entity'

export interface StockAvailability {
  itemId: string
  name: string
  stockOnHand: number
  stockReserved: number
  stockAvailable: number
  reservations: {
    allocationId: string
    jobcardId: string
    quantity: number
    status: string
  }[]
}

/**
 * Inventory Allocation Service
 * 
 * Centralized service for managing inventory allocations across the job lifecycle.
 * This service coordinates between inventory items and allocations.
 */
export class InventoryAllocationService {
  private inventoryRepository: SupabaseInventoryRepository
  private allocationRepository: SupabaseAllocationRepository
  private reserveStockUseCase: ReserveStockUseCase
  private consumeStockUseCase: ConsumeStockUseCase
  private releaseStockUseCase: ReleaseStockUseCase

  constructor(supabase?: SupabaseClient, tenantId?: string) {
    const client = supabase || defaultSupabase
    this.inventoryRepository = new SupabaseInventoryRepository(client, tenantId)
    this.allocationRepository = new SupabaseAllocationRepository(client, tenantId)
    
    this.reserveStockUseCase = new ReserveStockUseCase(
      this.inventoryRepository,
      this.allocationRepository
    )
    this.consumeStockUseCase = new ConsumeStockUseCase(
      this.inventoryRepository,
      this.allocationRepository
    )
    this.releaseStockUseCase = new ReleaseStockUseCase(
      this.inventoryRepository,
      this.allocationRepository
    )
  }

  /**
   * Reserve stock for an estimate item
   * Called when adding a part to an estimate linked to a job card
   */
  async reserveForEstimateItem(
    estimateItemId: string,
    itemId: string,
    quantity: number,
    jobcardId: string,
    createdBy?: string
  ): Promise<ReserveStockResult> {
    return this.reserveStockUseCase.execute({
      itemId,
      jobcardId,
      quantity,
      estimateItemId,
      createdBy,
    })
  }

  /**
   * Consume stock when a todo is marked as "changed"
   * This indicates the part was actually used/replaced
   */
  async consumeForTodo(
    jobcardId: string,
    itemId: string,
    quantity?: number,
    createdBy?: string
  ): Promise<ConsumeStockResult> {
    return this.consumeStockUseCase.execute({
      jobcardId,
      itemId,
      quantity,
      createdBy,
    })
  }

  /**
   * Consume stock by allocation ID
   */
  async consumeAllocation(
    allocationId: string,
    quantity?: number,
    createdBy?: string
  ): Promise<ConsumeStockResult> {
    return this.consumeStockUseCase.execute({
      allocationId,
      quantity,
      createdBy,
    })
  }

  /**
   * Consume ALL reserved allocations for a job card
   * Called when job is completed - all quoted parts are assumed used
   */
  async consumeAllForJob(jobcardId: string, createdBy?: string): Promise<{ 
    consumedAllocations: InventoryAllocation[]
    totalQuantityConsumed: number 
  }> {
    const reservedAllocations = await this.allocationRepository.findReservedByJobcard(jobcardId)
    const consumedAllocations: InventoryAllocation[] = []
    let totalQuantityConsumed = 0

    for (const allocation of reservedAllocations) {
      try {
        const result = await this.consumeStockUseCase.execute({
          allocationId: allocation.id,
          createdBy,
        })
        consumedAllocations.push(result.allocation)
        totalQuantityConsumed += result.quantityConsumed
      } catch (error) {
        console.error(`[consumeAllForJob] Failed to consume allocation ${allocation.id}:`, error)
        // Continue with other allocations even if one fails
      }
    }

    return { consumedAllocations, totalQuantityConsumed }
  }

  /**
   * Release all reservations for a job card
   * Called when job is cancelled
   */
  async releaseForJob(jobcardId: string, createdBy?: string): Promise<ReleaseStockResult> {
    return this.releaseStockUseCase.execute({
      jobcardId,
      createdBy,
    })
  }

  /**
   * Release reservation for a specific estimate item
   * Called when removing a part from an estimate
   */
  async releaseForEstimateItem(estimateItemId: string, createdBy?: string): Promise<ReleaseStockResult> {
    return this.releaseStockUseCase.execute({
      estimateItemId,
      createdBy,
    })
  }

  /**
   * Get stock availability for an item including all reservations
   */
  async getAvailableStock(itemId: string): Promise<StockAvailability> {
    const item = await this.inventoryRepository.findById(itemId)
    if (!item) {
      throw new Error(`Item ${itemId} not found`)
    }

    const allocations = await this.allocationRepository.findByItemId(itemId)
    const reservedAllocations = allocations.filter(a => a.status === 'reserved')

    return {
      itemId: item.id,
      name: item.name,
      stockOnHand: item.stockOnHand,
      stockReserved: item.stockReserved,
      stockAvailable: getStockAvailable(item),
      reservations: reservedAllocations.map(a => ({
        allocationId: a.id,
        jobcardId: a.jobcardId,
        quantity: a.quantityReserved,
        status: a.status,
      })),
    }
  }

  /**
   * Get all allocations for a job card
   */
  async getAllocationsForJob(jobcardId: string): Promise<InventoryAllocation[]> {
    return this.allocationRepository.findByJobcardId(jobcardId)
  }

  /**
   * Get reserved allocations for a job card
   */
  async getReservedForJob(jobcardId: string): Promise<InventoryAllocation[]> {
    return this.allocationRepository.findReservedByJobcard(jobcardId)
  }

  /**
   * Check if quantity can be reserved (without actually reserving)
   */
  async canReserve(itemId: string, quantity: number): Promise<{ canReserve: boolean; available: number; reason?: string }> {
    const item = await this.inventoryRepository.findById(itemId)
    if (!item) {
      return { canReserve: false, available: 0, reason: 'Item not found' }
    }

    const available = getStockAvailable(item)
    
    if (available >= quantity) {
      return { canReserve: true, available }
    }

    return {
      canReserve: false,
      available,
      reason: `Only ${available} units available. Cannot reserve ${quantity}.`,
    }
  }

  /**
   * Get allocation by estimate item ID
   */
  async getAllocationByEstimateItem(estimateItemId: string): Promise<InventoryAllocation | null> {
    return this.allocationRepository.findByEstimateItemId(estimateItemId)
  }
}

/**
 * Factory function to create an InventoryAllocationService
 */
export function createInventoryAllocationService(
  supabase?: SupabaseClient,
  tenantId?: string
): InventoryAllocationService {
  return new InventoryAllocationService(supabase, tenantId)
}
