/**
 * Shared TodoItem type definitions
 * Centralized to avoid duplication across components, hooks, and API routes
 */

export type TodoStatus = "changed" | "repaired" | "no_change" | null;

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    status: TodoStatus;
    createdAt: string;
    completedAt?: string;
    // Inventory allocation fields
    partId?: string;              // Link to inventory item
    estimateItemId?: string;      // Link to estimate item
    quantityRequired?: number;    // How many parts needed
    allocationId?: string;        // Link to allocation record
}

/**
 * Generate a unique todo ID using crypto.randomUUID() with fallback
 */
export function generateTodoId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return `todo-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}
