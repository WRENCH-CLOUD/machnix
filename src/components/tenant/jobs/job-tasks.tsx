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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
// Add/Edit Task Dialog
// ============================================================================

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => void;
  isLoading?: boolean;
  initialData?: Partial<CreateTaskInput>;
  /** Pre-selected inventory item for edit mode */
  initialInventoryItem?: {
    id: string;
    name: string;
    stockKeepingUnit?: string | null;
    sellPrice?: number | null;
    unitCost?: number | null;
    stockOnHand: number;
    stockReserved: number;
  } | null;
  searchInventory?: (query: string, limit?: number) => InventoryItem[];
  mode: "add" | "edit";
}

function TaskDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  initialData,
  initialInventoryItem,
  searchInventory,
  mode,
}: TaskDialogProps) {
  const [taskName, setTaskName] = useState(initialData?.taskName || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [inventorySearch, setInventorySearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [qty, setQty] = useState(initialData?.qty || 1);
  const [laborCost, setLaborCost] = useState(initialData?.laborCostSnapshot || 0);
  const [openCombobox, setOpenCombobox] = useState(false);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchInventory || !inventorySearch.trim()) return [];
    return searchInventory(inventorySearch.trim(), 5);
  }, [searchInventory, inventorySearch]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTaskName(initialData?.taskName || "");
      setDescription(initialData?.description || "");
      setInventorySearch("");
      // Pre-select inventory item if provided (edit mode)
      if (initialInventoryItem) {
        setSelectedItem({
          id: initialInventoryItem.id,
          name: initialInventoryItem.name,
          stockKeepingUnit: initialInventoryItem.stockKeepingUnit ?? undefined,
          sellPrice: initialInventoryItem.sellPrice ?? 0,
          unitCost: initialInventoryItem.unitCost ?? 0,
          stockOnHand: initialInventoryItem.stockOnHand,
          stockReserved: initialInventoryItem.stockReserved,
        } as InventoryItem);
        setInventorySearch(initialInventoryItem.name); // Set search input to item name
      } else {
        setSelectedItem(null);
      }
      setQty(initialData?.qty || 1);
      setLaborCost(initialData?.laborCostSnapshot || 0);
    }
  }, [isOpen, initialData, initialInventoryItem]);

  const handleSubmit = () => {
    if (!taskName.trim()) return;

    // Auto-derive action type from inventory selection
    const derivedActionType: TaskActionType = (selectedItem && qty > 0) ? "REPLACED" : "LABOR_ONLY";

    const data: CreateTaskInput = {
      taskName: taskName.trim(),
      description: description.trim() || undefined,
      actionType: derivedActionType,
      laborCostSnapshot: laborCost,
    };

    // If inventory item selected, include inventory details
    if (selectedItem && qty > 0) {
      data.inventoryItemId = selectedItem.id;
      data.qty = qty;
      data.unitPriceSnapshot = selectedItem.sellPrice ?? selectedItem.unitCost ?? 0;
      data.taxRateSnapshot = 18; // Default GST rate
    }

    onSubmit(data);
  };

  const canSubmit = !!taskName.trim();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add a new task to this job card"
              : "Update task details"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="taskName">Task Name *</Label>
            <Input
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g., Check brake pads"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={2}
            />
          </div>



          {/* Labor Cost */}
          <div className="space-y-2">
            <Label htmlFor="laborCost">Labor Cost (₹)</Label>
            <Input
              id="laborCost"
              type="number"
              min={0}
              value={laborCost}
              onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          {/* Inventory Section - Always visible */}
          {
            <div className="space-y-3 p-3 rounded-lg bg-muted/50 border">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Part/Item (optional)
              </Label>

              <div className="relative">
                <div className="relative">
                  <Input
                    placeholder="Search parts to auto-fill..."
                    value={inventorySearch}
                    onChange={(e) => {
                      setInventorySearch(e.target.value);
                      if (selectedItem) {
                        setSelectedItem(null); // Unlink if user types
                      }
                      setOpenCombobox(true);
                    }}
                    onFocus={() => setOpenCombobox(true)}
                    onBlur={() => {
                      // Small delay to allow click events to process if clicking an item
                      setTimeout(() => setOpenCombobox(false), 200);
                    }}
                    className={cn(
                      "pr-8",
                      selectedItem && "border-emerald-500 ring-emerald-500/20"
                    )}
                  />
                  {selectedItem && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Check className="h-4 w-4 text-emerald-500" />
                    </div>
                  )}
                </div>

                {/* Custom Dropdown List - Replaces Popover to avoid Modal focus issues */}
                {openCombobox && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Inventory
                      </div>
                      {searchResults.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                            selectedItem?.id === item.id && "bg-accent text-accent-foreground"
                          )}
                          onMouseDown={(e) => e.preventDefault()} // Prevent blur on Input
                          onClick={() => {
                            setSelectedItem(item);
                            setInventorySearch(item.name);
                            setQty(1);
                            setOpenCombobox(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            {item.stockKeepingUnit && (
                              <span className="text-xs text-muted-foreground">
                                SKU: {item.stockKeepingUnit}
                              </span>
                            )}
                            <span className={cn(
                              "text-xs",
                              getStockAvailable(item) > 0 ? "text-green-500" : "text-red-500"
                            )}>
                              {getStockAvailable(item)} available @ ₹{item.sellPrice?.toFixed(2)}
                            </span>
                          </div>
                          {selectedItem?.id === item.id && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {openCombobox && searchResults.length === 0 && inventorySearch && (
                  <div className="absolute top-full left-0 w-full z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md p-4 text-sm text-center text-muted-foreground">
                    No parts found.
                  </div>
                )}
              </div>

              {selectedItem && (
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    max={getStockAvailable(selectedItem)}
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                  />
                  {qty > getStockAvailable(selectedItem) && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Only {getStockAvailable(selectedItem)} available
                    </p>
                  )}
                </div>
              )}

              {!selectedItem && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Search and select a part to auto-link inventory
                </p>
              )}
            </div>
          }
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !canSubmit}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "add" ? "Add Task" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  isUpdating: boolean;
}

function TaskItem({
  task,
  disabled,
  onDelete,
  onStatusChange,
  onActionTypeChange,
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
                  "h-6 px-2 gap-1 text-xs shrink-0",
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
                      <span className="ml-auto text-xs text-muted-foreground">
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
            className={cn("shrink-0 gap-1 text-xs", actionConfig.color)}
          >
            <ActionIcon className="h-3 w-3" />
            {actionConfig.label}
          </Badge>
        )}

        {/* Task Name & Description */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium text-sm",
            isTerminal && "line-through text-muted-foreground"
          )}>
            {task.taskName}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {task.description}
            </p>
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
                    "h-7 px-2 gap-1 text-xs",
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
                      <span className="ml-auto text-xs text-muted-foreground">
                        {config.description}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Badge className={cn(statusConfig.bgColor, statusConfig.color, "text-xs")}>
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
        <div className="mt-2 ml-0 p-2 rounded bg-muted/50 text-xs flex items-center justify-between">
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
        <div className="mt-1 ml-0 text-xs text-muted-foreground">
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
              <span className="text-xs font-normal text-muted-foreground">
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
            <div className="pt-2 border-t text-xs space-y-1">
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
      <TaskDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddTask}
        isLoading={createTask.isPending}
        searchInventory={searchInventory}
        mode="add"
      />

      {/* Edit Task Dialog */}
      <TaskDialog
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
