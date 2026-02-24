"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MoreVertical,
  Plus,
  CheckCircle2,
  Wrench,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TaskModal } from "@/components/tenant/jobs/task-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useJobTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useTaskActions,
  calculateTaskTotals,
  type CreateTaskInput,
} from "@/hooks/use-job-tasks";
import type {
  JobCardTaskWithItem,
  TaskStatus,
  TaskActionType,
} from "@/modules/job/domain/task.entity";
import type { InventoryItem } from "@/modules/inventory/domain/inventory.entity";

// ============================================================================
// Constants
// ============================================================================

const ACTION_TYPE_CONFIG = {
  LABOR_ONLY: {
    label: "Labor Only",
    icon: Wrench,
    color: "bg-gray-500/20 text-gray-200 border-gray-500/30",
    activeColor: "bg-gray-600 hover:bg-gray-700 text-white",
  },
  REPLACED: {
    label: "Replaced",
    icon: RefreshCw,
    color: "bg-blue-500/20 text-blue-200 border-blue-500/30",
    activeColor: "bg-blue-600 hover:bg-blue-700 text-white",
  },
} as const;

const STATUS_CONFIG: Record<
  TaskStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
    description: "Not yet approved",
  },
  APPROVED: {
    label: "Approved",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    description: "Stock reserved",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    description: "Done",
  },
};

// ============================================================================
// Props Interface
// ============================================================================

interface JobTasksProps {
  jobId: string;
  disabled?: boolean;
  className?: string;
  /** Search inventory items (from delta-sync snapshot) */
  searchInventory?: (query: string, limit?: number) => InventoryItem[];
}

// ============================================================================
// Task Item Component
// ============================================================================

interface TaskItemProps {
  task: JobCardTaskWithItem;
  disabled: boolean;
  onDelete: () => void;
  onStatusForward: () => void;
  onOpenEdit: () => void;
  isUpdating: boolean;
}

function TaskItem({
  task,
  disabled,
  onDelete,
  onStatusForward,
  onOpenEdit,
  isUpdating,
}: TaskItemProps) {
  const isCompleted = task.taskStatus === "COMPLETED";

  const getStatusColor = () => {
    switch (task.taskStatus) {
      case "DRAFT":
        return "bg-gray-400";
      case "APPROVED":
        return "bg-yellow-400";
      case "COMPLETED":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusTooltip = () => {
  if (task.actionType === "LABOR_ONLY") {
    if (task.taskStatus === "COMPLETED") {
      return "Labor task completed";
    }
    if (task.taskStatus === "APPROVED") {
      return "Labor approved (no inventory involved)";
    }
    return "Labor task (no inventory involved)";
  }

  // Replacement tasks
  if (task.actionType === "REPLACED") {
    if (task.taskStatus === "DRAFT") {
      return "Part not yet reserved in inventory";
    }
    if (task.taskStatus === "APPROVED") {
      return "Part reserved in inventory";
    }
    if (task.taskStatus === "COMPLETED") {
      return "Part deducted from inventory";
    }
  }

  return "";
};

  const calculateLineTotal = () => {
    const parts =
      task.actionType === "REPLACED" && task.unitPriceSnapshot && task.qty
        ? task.unitPriceSnapshot * task.qty
        : 0;

    const labor = task.laborCostSnapshot ?? 0;

    return parts + labor;
  };

  const total = calculateLineTotal();

  return (
    <div
      onClick={() => !disabled && onOpenEdit()}
      className={cn(
        "group flex items-center justify-between p-4 rounded-xl transition-all",
        "hover:bg-muted/50 cursor-pointer",
        isCompleted && "opacity-60",
      )}
    >
      {/* LEFT SIDE */}
      <div className="flex items-start gap-3">
        {/* Status Dot */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              disabled={disabled || isUpdating}
              onClick={(e) => {
                e.stopPropagation();
                onStatusForward();
              }}
              className={cn(
                "mt-1 h-3 w-3 rounded-full",
                getStatusColor(),
                "hover:scale-110 transition",
              )}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {getStatusTooltip()}
          </TooltipContent>
        </Tooltip>

        {/* Task Info */}
        <div>
          <p className="font-medium text-sm">{task.taskName}</p>

          {task.description && (
            <p className="text-xs text-muted-foreground">{task.description}</p>
          )}

          {/* Small meta */}
          <div className="text-xs text-muted-foreground mt-1">
            {task.actionType === "LABOR_ONLY"
              ? "🛠 Labor"
              : `📦 ${task.inventoryItem?.name ?? "Part"}`}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        {/* Total */}
        <div className="text-sm font-medium">₹{total.toFixed(2)}</div>

        {/* Menu */}
        {!disabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenEdit}>Edit</DropdownMenuItem>
              {task.taskStatus === "DRAFT" && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function JobTasks({
  jobId,
  disabled = false,
  className,
  searchInventory,
}: JobTasksProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<JobCardTaskWithItem | null>(
    null,
  );
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Queries & mutations
  const { data: tasks = [], isLoading, error } = useJobTasks(jobId);
  const createTask = useCreateTask(jobId);
  const updateTask = useUpdateTask(jobId);
  const deleteTask = useDeleteTask(jobId);
  const taskActions = useTaskActions(jobId);

  // Calculate totals
  const totals = useMemo(() => calculateTaskTotals(tasks), [tasks]);

  // Handlers
  const handleAddTask = async (data: CreateTaskInput) => {
    try {
      await createTask.mutateAsync(data);
      setShowAddDialog(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleUpdateTask = async (data: CreateTaskInput) => {
    if (!editingTask) return;
    try {
      await updateTask.mutateAsync({
        taskId: editingTask.id,
        input: {
          taskName: data.taskName,
          description: data.description,
          actionType: data.actionType,
          laborCostSnapshot: data.laborCostSnapshot,
          showInEstimate: data.showInEstimate,
          // Include inventory fields for REPLACED action type
          inventoryItemId: data.inventoryItemId,
          unitPriceSnapshot: data.unitPriceSnapshot,
          qty: data.qty,
        },
      });
      setEditingTask(null);
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    setUpdatingTaskId(taskId);
    try {
      switch (status) {
        case "APPROVED":
          await taskActions.approve(taskId);
          break;
        case "COMPLETED":
          await taskActions.complete(taskId);
          break;
        case "DRAFT":
          await taskActions.reactivate(taskId);
          break;
      }
    } catch (error: unknown) {
      console.error("Failed to update status:", error);
      // Error will be shown via toast in the hook or can be handled here
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleActionTypeChange = async (
    task: JobCardTaskWithItem,
    actionType: TaskActionType,
    openEditDialog?: boolean,
  ) => {
    // If changing to REPLACED, always open edit dialog to ensure inventory is selected
    // (API requires inventoryItemId and qty > 0 for REPLACED)
    if (actionType === "REPLACED") {
      setEditingTask({ ...task, actionType });
      return;
    }

    // If explicitly asked to open dialog (shouldn't happen for non-REPLACED)
    if (openEditDialog) {
      setEditingTask({ ...task, actionType });
      return;
    }

    // For LABOR_ONLY, update directly
    setUpdatingTaskId(task.id);
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        input: {
          actionType,
        },
      });
    } catch (error) {
      console.error("Failed to update action type:", error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleToggleEstimate = async (
    taskId: string,
    showInEstimate: boolean,
  ) => {
    setUpdatingTaskId(taskId);
    try {
      await updateTask.mutateAsync({
        taskId,
        input: { showInEstimate },
      });
    } catch (error) {
      console.error("Failed to toggle estimate:", error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-destructive">
          Failed to load tasks
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn(className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                      <CheckCircle2 className="w-4 h-4" />
                      Tasks
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-sm">
                    Tasks represent the work required to complete this job. They
                    can include labor work and replacement parts.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {tasks.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {totals.completedCount}/{totals.taskCount} done
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Task Items */}
          {tasks.length > 0 ? (
            <div className="divide-y">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  disabled={disabled}
                  isUpdating={updatingTaskId === task.id}
                  onOpenEdit={() => setEditingTask(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onStatusForward={async () => {
                    if (task.taskStatus === "DRAFT") {
                      await handleStatusChange(task.id, "APPROVED");
                    } else if (task.taskStatus === "APPROVED") {
                      await handleStatusChange(task.id, "COMPLETED");
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No tasks yet
            </p>
          )}

          {/* Totals Summary */}
          {tasks.length > 0 && totals.total > 0 && (
            <div className="pt-2 border-t text-sm space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Parts Total</span>
                <span>₹{totals.partsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Labor Total</span>
                <span>₹{totals.laborTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>₹{totals.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium pt-1 border-t">
                <span>Total</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Add Task Button */}
          {!disabled && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddDialog(true)}
              className="w-full h-9 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <TaskModal
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddTask}
        isLoading={createTask.isPending}
        searchInventory={searchInventory}
        mode="add"
      />

      {/* Edit Task Dialog */}
      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleUpdateTask}
        isLoading={updateTask.isPending}
        searchInventory={searchInventory}
        mode="edit"
        initialData={
          editingTask
            ? {
                taskName: editingTask.taskName,
                description: editingTask.description ?? undefined,
                actionType: editingTask.actionType,
                laborCostSnapshot: editingTask.laborCostSnapshot,
                qty: editingTask.qty ?? undefined,
                unitPriceSnapshot: editingTask.unitPriceSnapshot,
                inventoryItemId: editingTask.inventoryItemId,
                showInEstimate: editingTask.showInEstimate,
              }
            : undefined
        }
        initialInventoryItem={
          editingTask?.inventoryItem
            ? {
                id: editingTask.inventoryItem.id,
                name: editingTask.inventoryItem.name,
                stockKeepingUnit: editingTask.inventoryItem.stockKeepingUnit,
                sellPrice: editingTask.unitPriceSnapshot,
                unitCost: editingTask.unitPriceSnapshot,
                stockOnHand: editingTask.inventoryItem.stockOnHand,
                stockReserved: editingTask.inventoryItem.stockReserved,
              }
            : null
        }
      />
    </>
  );
}
