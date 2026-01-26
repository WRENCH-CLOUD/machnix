import { Mechanic, CreateMechanicInput, UpdateMechanicInput } from './mechanic.entity'

/**
 * Mechanic Repository Interface
 * Defines the contract for mechanic data operations
 */
export interface MechanicRepository {
    /**
     * Find all mechanics for the current tenant
     */
    findAll(): Promise<Mechanic[]>

    /**
     * Find all active mechanics for the current tenant
     */
    findAllActive(): Promise<Mechanic[]>

    /**
     * Find a mechanic by ID
     */
    findById(id: string): Promise<Mechanic | null>

    /**
     * Create a new mechanic
     */
    create(input: CreateMechanicInput): Promise<Mechanic>

    /**
     * Update an existing mechanic
     */
    update(id: string, input: UpdateMechanicInput): Promise<Mechanic>

    /**
     * Soft delete a mechanic
     */
    delete(id: string): Promise<void>
}
