"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MoreVertical,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Package,
  Wrench,
  Search,
  Check,
  ChevronsUpDown,
  Loader2,
  RefreshCw,
  MinusCircle,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TaskModal } from "@/components/tenant/jobs/task-modal";
import { Switch } from "@/components/ui/switch";
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
  TaskActionType
} from "@/modules/job/domain/task.entity";
import type { InventoryItem } from "@/modules/inventory/domain/inventory.entity";
import { getStockAvailable } from "@/modules/inventory/domain/inventory.entity";

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

const STATUS_CONFIG: Record<TaskStatus, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
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
  onStatusChange: (status: TaskStatus) => void;
  onActionTypeChange: (actionType: TaskActionType, openEditDialog?: boolean) => void;
  onToggleEstimate: (showInEstimate: boolean) => void;
  isUpdating: boolean;
}

function TaskItem({
  task,
  disabled,
  onDelete,
  onStatusChange,
  onActionTypeChange,
  onToggleEstimate,
  isUpdating,
}: TaskItemProps) {
  const actionConfig = ACTION_TYPE_CONFIG[task.actionType];
  const statusConfig = STATUS_CONFIG[task.taskStatus];
  const ActionIcon = actionConfig.icon;

  // Can only edit action type for draft tasks
  const canEditActionType = task.taskStatus === "DRAFT" && !disabled;

  const isCompleted = task.taskStatus === "COMPLETED";
  const isTerminal = isCompleted;

  // Calculate line total for REPLACED items
  const lineTotal = task.actionType === "REPLACED" && task.unitPriceSnapshot && task.qty
    ? task.unitPriceSnapshot * task.qty
    : 0;

  // Determine valid next statuses
  const getValidNextStatuses = (): TaskStatus[] => {
    switch (task.taskStatus) {
      case "DRAFT":
        return ["APPROVED"];
      case "APPROVED":
        return ["DRAFT", "COMPLETED"];
      case "COMPLETED":
        return []; // Terminal
      default:
        return [];
    }
  };

  const validNextStatuses = getValidNextStatuses();

  return (
    <div
      className={cn(
        "group p-3 rounded-lg border transition-colors",
        isTerminal
          ? "bg-muted/30 border-transparent"
          : "bg-background hover:bg-muted/50 border-border/50"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start gap-3">
        {/* Action Type Badge - Editable dropdown for draft tasks */}
        {canEditActionType ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isUpdating}>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 px-2 gap-1 text-sm shrink-0",
                  actionConfig.color
                )}
              >
                <ActionIcon className="h-3 w-3" />
                {actionConfig.label}
                <ChevronDown className="h-3 w-3 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(Object.keys(ACTION_TYPE_CONFIG) as TaskActionType[]).map((type) => {
                const config = ACTION_TYPE_CONFIG[type];
                const TypeIcon = config.icon;
                const isSelected = type === task.actionType;
                const needsInventory = type === "REPLACED" && !task.inventoryItemId;
                return (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => {
                      if (type !== task.actionType) {
                        // If changing to REPLACED and no inventory item, open edit dialog
                        onActionTypeChange(type, needsInventory);
                      }
                    }}
                    className={cn(isSelected && "bg-accent")}
                  >
                    <TypeIcon className={cn("h-3 w-3 mr-2", isSelected && "text-primary")} />
                    {config.label}
                    {needsInventory && (
                      <span className="ml-auto text-sm text-muted-foreground">
                        + select part
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Badge
            variant="outline"
            className={cn("shrink-0 gap-1 text-sm", actionConfig.color)}
          >
            <ActionIcon className="h-3 w-3" />
            {actionConfig.label}
          </Badge>
        )}

        {/* Task Name & Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={cn(
              "font-medium text-sm",
              isTerminal && "line-through text-muted-foreground"
            )}>
              {task.taskName}
            </p>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {task.description}
            </p>
          )}
          {/* Estimate toggle */}
          {!disabled && (
            <div className="flex items-center gap-1.5 mt-1">
              <Switch
                id={`estimate-${task.id}`}
                checked={task.showInEstimate}
                onCheckedChange={onToggleEstimate}
                className="scale-75 origin-left"
              />
              <label
                htmlFor={`estimate-${task.id}`}
                className={cn(
                  "text-[11px] cursor-pointer",
                  task.showInEstimate ? "text-blue-400" : "text-muted-foreground"
                )}
              >
                {task.showInEstimate ? "In estimate" : "Not in estimate"}
              </label>
            </div>
          )}
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status dropdown */}
          {validNextStatuses.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 gap-1 text-sm",
                    statusConfig.bgColor,
                    statusConfig.color
                  )}
                >
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      {statusConfig.label}
                      <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {validNextStatuses.map((status) => {
                  const config = STATUS_CONFIG[status];
                  return (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => onStatusChange(status)}
                    >
                      <div className={cn("w-2 h-2 rounded-full mr-2", config.bgColor)} />
                      {config.label}
                      <span className="ml-auto text-sm text-muted-foreground">
                        {config.description}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Badge className={cn(statusConfig.bgColor, statusConfig.color, "text-sm")}>
              {statusConfig.label}
            </Badge>
          )}

          {/* Delete button - only for draft tasks */}
          {task.taskStatus === "DRAFT" && !disabled && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Inventory Info Row - Only for REPLACED tasks with linked item */}
      {task.actionType === "REPLACED" && task.inventoryItem && (
        <div className="mt-2 ml-0 p-2 rounded bg-muted/50 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{task.inventoryItem.name}</span>
            <span className="text-muted-foreground">
              {task.inventoryItem.stockKeepingUnit || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>Qty: {task.qty}</span>
            <span>@ ₹{task.unitPriceSnapshot?.toFixed(2)}</span>
            <span className="font-medium">= ₹{lineTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Labor cost if set */}
      {task.laborCostSnapshot !== undefined && task.laborCostSnapshot > 0 && (
        <div className="mt-1 ml-0 text-sm text-muted-foreground">
          Labor: ₹{task.laborCostSnapshot.toFixed(2)}
        </div>
      )}
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
  const [editingTask, setEditingTask] = useState<JobCardTaskWithItem | null>(null);
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
    openEditDialog?: boolean
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

  const handleToggleEstimate = async (taskId: string, showInEstimate: boolean) => {
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
              <CheckCircle2 className="w-4 h-4" />
              Tasks
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
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  disabled={disabled}
                  onDelete={() => handleDeleteTask(task.id)}
                  onStatusChange={(status) => handleStatusChange(task.id, status)}
                  onActionTypeChange={(actionType, openEditDialog) =>
                    handleActionTypeChange(task, actionType, openEditDialog)
                  }
                  onToggleEstimate={(show) => handleToggleEstimate(task.id, show)}
                  isUpdating={updatingTaskId === task.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">
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
        initialData={editingTask ? {
          taskName: editingTask.taskName,
          description: editingTask.description ?? undefined,
          actionType: editingTask.actionType,
          laborCostSnapshot: editingTask.laborCostSnapshot,
          qty: editingTask.qty ?? undefined,
          unitPriceSnapshot: editingTask.unitPriceSnapshot,
          inventoryItemId: editingTask.inventoryItemId,
          showInEstimate: editingTask.showInEstimate,
        } : undefined}
        initialInventoryItem={editingTask?.inventoryItem ? {
          id: editingTask.inventoryItem.id,
          name: editingTask.inventoryItem.name,
          stockKeepingUnit: editingTask.inventoryItem.stockKeepingUnit,
          sellPrice: editingTask.unitPriceSnapshot,
          unitCost: editingTask.unitPriceSnapshot,
          stockOnHand: editingTask.inventoryItem.stockOnHand,
          stockReserved: editingTask.inventoryItem.stockReserved,
        } : null}
      />
    </>
  );
}
