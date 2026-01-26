/**
 * Mechanic Entity
 * Domain model representing a mechanic/technician in the garage
 * Note: Mechanics are tenant-scoped and don't require auth.users initially
 */
export interface Mechanic {
    id: string
    tenantId: string
    name: string
    phone?: string
    email?: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date
    // For future linking to auth.users (Phase 2 - mechanic dashboards)
    authUserId?: string
}

/**
 * Input for creating a new mechanic
 */
export type CreateMechanicInput = {
    name: string
    phone?: string
    email?: string
}

/**
 * Input for updating an existing mechanic
 */
export type UpdateMechanicInput = Partial<{
    name: string
    phone: string
    email: string
    isActive: boolean
}>
