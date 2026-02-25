"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/supabase/client";
import { queryKeys } from "@/hooks/queries";
import type {
  JobCardTask,
  JobCardTaskWithItem,
  TaskStatus,
  TaskActionType
} from "@/modules/job/domain/task.entity";

// ============================================================================
// Query Keys
// ============================================================================

export const taskQueryKeys = {
  all: ["tasks"] as const,
  byJob: (jobId: string) => [...taskQueryKeys.all, "job", jobId] as const,
  detail: (jobId: string, taskId: string) => [...taskQueryKeys.all, "job", jobId, "task", taskId] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface CreateTaskInput {
  taskName: string;
  description?: string;
  actionType: TaskActionType;
  inventoryItemId?: string;
  qty?: number;
  unitPriceSnapshot?: number;
  laborCostSnapshot?: number;
  taxRateSnapshot?: number;
  showInEstimate?: boolean;
}

export interface UpdateTaskInput {
  taskName?: string;
  description?: string | null;
  actionType?: TaskActionType;
  inventoryItemId?: string | null;
  qty?: number | null;
  unitPriceSnapshot?: number;
  laborCostSnapshot?: number;
  taxRateSnapshot?: number;
  showInEstimate?: boolean;
}

export interface TaskStatusUpdate {
  taskStatus: TaskStatus;
}

// API response types
interface TasksResponse {
  tasks: JobCardTaskWithItem[];
}

interface TaskResponse {
  task: JobCardTask;
  inventoryUpdate?: {
    id: string;
    stockOnHand: number;
    stockReserved: number;
    stockAvailable: number;
  };
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch all tasks for a job card
 * @param jobId - Job card ID
 * @param options.withItems - Include inventory item details (default: true)
 */
export function useJobTasks(jobId: string, options?: { withItems?: boolean }) {
  const withItems = options?.withItems ?? true;

  return useQuery({
    queryKey: taskQueryKeys.byJob(jobId),
    queryFn: async (): Promise<JobCardTaskWithItem[]> => {
      const url = `/api/jobs/${jobId}/tasks${withItems ? '?with_items=true' : ''}`;
      const res = await api.get(url);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data: TasksResponse = await res.json();
      return data.tasks;
    },
    enabled: !!jobId,
    staleTime: 30_000, // 30 seconds - tasks can change during active work
  });
}

/**
 * Fetch a single task
 */
export function useTask(jobId: string, taskId: string) {
  return useQuery({
    queryKey: taskQueryKeys.detail(jobId, taskId),
    queryFn: async (): Promise<JobCardTask> => {
      const res = await api.get(`/api/jobs/${jobId}/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      const data: TaskResponse = await res.json();
      return data.task;
    },
    enabled: !!jobId && !!taskId,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new task
 */
export function useCreateTask(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput): Promise<JobCardTask> => {
      const res = await api.post(`/api/jobs/${jobId}/tasks`, input);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create task");
      }
      const data: TaskResponse = await res.json();
      return data.task;
    },
    onSuccess: () => {
      // Invalidate tasks list for this job
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byJob(jobId) });
      // Invalidate estimate since tasks sync to estimate items
      queryClient.invalidateQueries({ queryKey: queryKeys.estimates.byJob(jobId) });
    },
  });
}

/**
 * Update a task's details
 */
export function useUpdateTask(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      input
    }: {
      taskId: string;
      input: UpdateTaskInput
    }): Promise<JobCardTask> => {
      const res = await api.patch(`/api/jobs/${jobId}/tasks/${taskId}`, input);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update task");
      }
      const data: TaskResponse = await res.json();
      return data.task;
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byJob(jobId) });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(jobId, taskId) });
      // Invalidate estimate since tasks sync to estimate items
      queryClient.invalidateQueries({ queryKey: queryKeys.estimates.byJob(jobId) });
    },
  });
}

/**
 * Update task status (with inventory side effects)
 */
export function useUpdateTaskStatus(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      taskStatus
    }: {
      taskId: string;
      taskStatus: TaskStatus
    }): Promise<TaskResponse> => {
      const res = await api.patch(`/api/jobs/${jobId}/tasks/${taskId}/status`, { taskStatus });
      if (!res.ok) {
        const error = await res.json();
        // Pass through structured error for stock issues
        if (error.error === 'INSUFFICIENT_STOCK') {
          const stockError = new Error(error.message) as Error & {
            code: string;
            stockAvailable: number;
            stockRequested: number;
          };
          stockError.code = 'INSUFFICIENT_STOCK';
          stockError.stockAvailable = error.stockAvailable;
          stockError.stockRequested = error.stockRequested;
          throw stockError;
        }
        throw new Error(error.error || "Failed to update task status");
      }
      return res.json();
    },
    onSuccess: (data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byJob(jobId) });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(jobId, taskId) });

      // If inventory was updated, invalidate inventory cache
      if (data.inventoryUpdate) {
        queryClient.invalidateQueries({ queryKey: ["inventory-snapshot"] });
      }
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      const res = await api.delete(`/api/jobs/${jobId}/tasks/${taskId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete task");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byJob(jobId) });
      // Invalidate estimate since deleting task removes the estimate item
      queryClient.invalidateQueries({ queryKey: queryKeys.estimates.byJob(jobId) });
    },
  });
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for common task actions (approve, complete, reactivate)
 */
export function useTaskActions(jobId: string) {
  const updateStatus = useUpdateTaskStatus(jobId);

  return {
    approve: (taskId: string) =>
      updateStatus.mutateAsync({ taskId, taskStatus: 'APPROVED' }),

    complete: (taskId: string) =>
      updateStatus.mutateAsync({ taskId, taskStatus: 'COMPLETED' }),

    reactivate: (taskId: string) =>
      updateStatus.mutateAsync({ taskId, taskStatus: 'DRAFT' }),

    isLoading: updateStatus.isPending,
    error: updateStatus.error,
  };
}

/**
 * Calculate task totals from a list of tasks
 */
export function calculateTaskTotals(tasks: JobCardTask[]) {
  let partsTotal = 0;
  let laborTotal = 0;
  let taxTotal = 0;

  for (const task of tasks) {
    if (task.actionType === 'REPLACED' && task.unitPriceSnapshot && task.qty) {
      const taskPartsTotal = task.unitPriceSnapshot * task.qty;
      partsTotal += taskPartsTotal;
      taxTotal += taskPartsTotal * ((task.taxRateSnapshot || 0) / 100);
    }
    laborTotal += task.laborCostSnapshot || 0;
  }

  return {
    partsTotal,
    laborTotal,
    taxTotal,
    subtotal: partsTotal + laborTotal,
    total: partsTotal + laborTotal + taxTotal,
    taskCount: tasks.length,
    completedCount: tasks.filter(t => t.taskStatus === 'COMPLETED').length,
  };
}
