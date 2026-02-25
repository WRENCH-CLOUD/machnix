"use client";

import { useState, useMemo, useRef } from "react";
import {
    RiAddLine,
    RiCheckDoubleLine,
    RiCheckboxCircleLine,
    RiCloseCircleLine,
    RiCloseLine,
    RiDeleteBin6Line,
    RiEditLine,
    RiMore2Fill,
    RiArrowDownSLine,
    RiBox3Line,
    RiToolsLine,
    RiRefreshLine,
    RiLoader4Line,
    RiFileListLine,
    RiShieldCheckLine,
    RiAlertLine,
    RiEyeLine,
    RiEyeOffLine,
    RiInformationLine,
    RiFileCopyLine,
    RiBarChartFill,
    RiTimeLine,
    RiUserLine,
    RiPriceTag3Line,
    RiReceiptLine,
    RiArrowGoBackLine,
    RiTrophyLine,
} from "@remixicon/react";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import {
    getStockAvailable,
    type InventoryItem,
} from "@/modules/inventory/domain/inventory.entity";
import type {
    JobCardTaskWithItem,
    TaskStatus,
    TaskActionType,
} from "@/modules/job/domain/task.entity";

// ============================================================================
// Constants & Config
// ============================================================================

const STATUS_CONFIG: Record<
    TaskStatus,
    { label: string; dotClass: string; badgeClass: string; textClass: string; description: string }
> = {
    DRAFT: {
        label: "Draft",
        dotClass: "bg-zinc-400",
        badgeClass: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
        textClass: "text-zinc-400",
        description: "Pending approval",
    },
    APPROVED: {
        label: "Approved",
        dotClass: "bg-amber-400",
        badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        textClass: "text-amber-400",
        description: "Stock reserved",
    },
    COMPLETED: {
        label: "Completed",
        dotClass: "bg-emerald-400",
        badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        textClass: "text-emerald-400",
        description: "Done",
    },
};

const ACTION_CONFIG: Record<
    TaskActionType,
    { label: string; chipClass: string; bgClass: string; borderClass: string }
> = {
    LABOR_ONLY: {
        label: "Labor Only",
        chipClass: "border-violet-500/20 bg-violet-500/10 text-violet-400",
        bgClass: "bg-violet-500/8",
        borderClass: "border-violet-500/20",
    },
    REPLACED: {
        label: "Part Replaced",
        chipClass: "border-blue-500/20 bg-blue-500/10 text-blue-400",
        bgClass: "bg-blue-500/8",
        borderClass: "border-blue-500/20",
    },
};

// ============================================================================
// Helpers
// ============================================================================

function formatDate(d: Date | string | undefined) {
    if (!d) return null;
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatCurrency(val: number | undefined) {
    return `₹${(val ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

// ============================================================================
// Props
// ============================================================================

export interface AdvancedTaskPanelProps {
    jobId: string;
    disabled?: boolean;
    className?: string;
    searchInventory?: (query: string, limit?: number) => InventoryItem[];
}

// ============================================================================
// Inline Task Form (Add / Edit)
// ============================================================================

interface TaskFormValues {
    taskName: string;
    description: string;
    laborCost: number;
    showInEstimate: boolean;
    selectedItem: InventoryItem | null;
    inventorySearch: string;
    qty: number;
}

const defaultForm = (): TaskFormValues => ({
    taskName: "",
    description: "",
    laborCost: 0,
    showInEstimate: true,
    selectedItem: null,
    inventorySearch: "",
    qty: 1,
});

function fromTask(task: JobCardTaskWithItem): TaskFormValues {
    return {
        taskName: task.taskName,
        description: task.description ?? "",
        laborCost: task.laborCostSnapshot ?? 0,
        showInEstimate: task.showInEstimate,
        inventorySearch: task.inventoryItem?.name ?? "",
        qty: task.qty ?? 1,
        selectedItem: task.inventoryItem
            ? ({
                id: task.inventoryItem.id,
                name: task.inventoryItem.name,
                stockKeepingUnit: task.inventoryItem.stockKeepingUnit,
                sellPrice: task.unitPriceSnapshot ?? 0,
                unitCost: task.unitPriceSnapshot ?? 0,
                stockOnHand: task.inventoryItem.stockOnHand,
                stockReserved: task.inventoryItem.stockReserved,
            } as InventoryItem)
            : null,
    };
}

interface TaskFormProps {
    initialValues?: TaskFormValues;
    onSubmit: (data: CreateTaskInput) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
    searchInventory?: (query: string, limit?: number) => InventoryItem[];
    mode: "add" | "edit";
}

function TaskForm({ initialValues, onSubmit, onCancel, isLoading, searchInventory, mode }: TaskFormProps) {
    const [form, setForm] = useState<TaskFormValues>(initialValues ?? defaultForm());
    const [popoverOpen, setPopoverOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const searchResults = useMemo(() => {
        if (!searchInventory || !form.inventorySearch.trim()) return [];
        return searchInventory(form.inventorySearch.trim(), 6);
    }, [searchInventory, form.inventorySearch]);

    const patch = (partial: Partial<TaskFormValues>) =>
        setForm((prev) => ({ ...prev, ...partial }));

    const canSubmit = !!form.taskName.trim();
    const stockAvail = form.selectedItem ? getStockAvailable(form.selectedItem) : 0;
    const qtyExceeds = form.selectedItem ? form.qty > stockAvail : false;
    const partsSubtotal = form.selectedItem ? (form.selectedItem.sellPrice ?? 0) * form.qty : 0;
    const taxAmount = partsSubtotal * 0.18;
    const grandTotal = partsSubtotal + taxAmount + form.laborCost;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        const hasItem = !!form.selectedItem && form.qty > 0;
        const data: CreateTaskInput = {
            taskName: form.taskName.trim(),
            description: form.description.trim() || undefined,
            actionType: hasItem ? "REPLACED" : "LABOR_ONLY",
            laborCostSnapshot: form.laborCost,
            showInEstimate: form.showInEstimate,
        };
        if (hasItem && form.selectedItem) {
            data.inventoryItemId = form.selectedItem.id;
            data.qty = form.qty;
            data.unitPriceSnapshot = form.selectedItem.sellPrice ?? form.selectedItem.unitCost ?? 0;
            data.taxRateSnapshot = 18;
        }
        await onSubmit(data);
    };

    return (
        <div className="rounded-xl border border-border/60 bg-muted/30 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/40">
                <div className="flex items-center gap-2">
                    {mode === "add"
                        ? <RiAddLine className="h-3.5 w-3.5 text-primary" />
                        : <RiEditLine className="h-3.5 w-3.5 text-primary" />
                    }
                    <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                        {mode === "add" ? "New Task" : "Edit Task"}
                    </span>
                </div>
                <button onClick={onCancel} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <RiCloseLine className="h-4 w-4" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Task Name */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                        Task Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        ref={inputRef}
                        autoFocus
                        placeholder="e.g. Replace brake pads"
                        value={form.taskName}
                        onChange={(e) => patch({ taskName: e.target.value })}
                        className="bg-background/70 border-border/60 focus-visible:ring-primary/40 h-9"
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                    <Textarea
                        placeholder="Describe the work to be done, any special instructions..."
                        value={form.description}
                        onChange={(e) => patch({ description: e.target.value })}
                        rows={2}
                        className="bg-background/70 border-border/60 resize-none text-sm focus-visible:ring-primary/40"
                    />
                </div>

                {/* Two-column: Labor cost + Quantity */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <RiToolsLine className="h-3 w-3" /> Labor Cost (₹)
                        </Label>
                        <Input
                            type="number" min={0} step={50}
                            value={form.laborCost}
                            onChange={(e) => patch({ laborCost: parseFloat(e.target.value) || 0 })}
                            className="bg-background/70 border-border/60 h-9 focus-visible:ring-primary/40"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <RiBox3Line className="h-3 w-3" /> Quantity
                        </Label>
                        <Input
                            type="number" min={1}
                            value={form.qty}
                            disabled={!form.selectedItem}
                            onChange={(e) => patch({ qty: parseInt(e.target.value) || 1 })}
                            className={cn(
                                "bg-background/70 border-border/60 h-9 focus-visible:ring-primary/40",
                                !form.selectedItem && "opacity-40 cursor-not-allowed"
                            )}
                        />
                    </div>
                </div>

                {/* Inventory Search via Popover */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <RiBox3Line className="h-3.5 w-3.5" />
                        Link Part / Inventory Item
                        <span className="text-muted-foreground/50 font-normal">(optional)</span>
                    </Label>

                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div
                                role="button"
                                className={cn(
                                    "flex h-9 w-full items-center gap-2 rounded-md border bg-background/70 px-3 text-sm cursor-pointer transition-all",
                                    form.selectedItem
                                        ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                                        : "border-border/60 hover:border-border"
                                )}
                                onClick={() => setPopoverOpen(true)}
                            >
                                {form.selectedItem ? (
                                    <>
                                        <RiBox3Line className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                        <span className="flex-1 truncate">{form.selectedItem.name}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                patch({ selectedItem: null, inventorySearch: "", qty: 1 });
                                            }}
                                            className="text-muted-foreground hover:text-foreground rounded"
                                        >
                                            <RiCloseLine className="h-3.5 w-3.5" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <RiBox3Line className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="flex-1 text-muted-foreground">Search inventory...</span>
                                        <RiArrowDownSLine className="h-4 w-4 text-muted-foreground" />
                                    </>
                                )}
                            </div>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[340px] p-0 shadow-xl border-border/60" onOpenAutoFocus={(e) => e.preventDefault()}>
                            <div className="p-2 border-b border-border/40">
                                <Input
                                    autoFocus
                                    placeholder="Search by name, SKU..."
                                    value={form.inventorySearch}
                                    onChange={(e) => patch({ inventorySearch: e.target.value })}
                                    className="h-8 bg-muted/50 border-border/40 text-sm focus-visible:ring-primary/40"
                                />
                            </div>
                            <div className="max-h-56 overflow-y-auto">
                                {searchResults.length > 0 ? (
                                    <div className="p-1.5 space-y-0.5">
                                        {searchResults.map((item) => {
                                            const avail = getStockAvailable(item);
                                            const isSelected = form.selectedItem?.id === item.id;
                                            const outOfStock = avail <= 0;
                                            return (
                                                <button
                                                    key={item.id}
                                                    disabled={outOfStock}
                                                    className={cn(
                                                        "w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors",
                                                        isSelected ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/70",
                                                        outOfStock && "opacity-40 cursor-not-allowed"
                                                    )}
                                                    onClick={() => {
                                                        if (outOfStock) return;
                                                        patch({ selectedItem: item, inventorySearch: item.name, qty: 1 });
                                                        setPopoverOpen(false);
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium truncate">{item.name}</p>
                                                            {item.stockKeepingUnit && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.stockKeepingUnit}</p>
                                                            )}
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            <p className="text-xs font-semibold">₹{item.sellPrice?.toFixed(0)}</p>
                                                            <p className={cn("text-xs mt-0.5", avail > 0 ? "text-emerald-400" : "text-red-400")}>
                                                                {avail > 0 ? `${avail} avail` : "Out of stock"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : form.inventorySearch.trim() ? (
                                    <div className="py-10 text-center text-sm text-muted-foreground">No items found</div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <RiBox3Line className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">Start typing to search inventory</p>
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {qtyExceeds && (
                        <p className="flex items-center gap-1 text-xs text-amber-400">
                            <RiAlertLine className="h-3.5 w-3.5" />
                            Only {stockAvail} unit{stockAvail === 1 ? "" : "s"} available
                        </p>
                    )}

                    {form.selectedItem && (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-emerald-400 font-medium">{form.qty} × {form.selectedItem.name}</span>
                                <span className="text-muted-foreground">₹{partsSubtotal.toFixed(2)}</span>
                            </div>
                            {partsSubtotal > 0 && (
                                <div className="mt-1.5 pt-1.5 border-t border-emerald-500/10 flex items-center justify-between text-muted-foreground">
                                    <span>+18% GST</span>
                                    <span>₹{taxAmount.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Live cost preview */}
                {grandTotal > 0 && (
                    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                            <RiBarChartFill className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium">Estimated Total</span>
                        </div>
                        <span className="text-sm font-bold text-primary">₹{grandTotal.toFixed(2)}</span>
                    </div>
                )}

                {/* Show in estimate */}
                <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                        {form.showInEstimate ? (
                            <RiEyeLine className="h-4 w-4 text-blue-400" />
                        ) : (
                            <RiEyeOffLine className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                            <p className="text-sm font-medium leading-none">Show in Estimate</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Include in customer-facing estimate</p>
                        </div>
                    </div>
                    <Switch checked={form.showInEstimate} onCheckedChange={(val) => patch({ showInEstimate: val })} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-9" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button size="sm" className="flex-1 h-9 gap-1.5" onClick={handleSubmit} disabled={isLoading || !canSubmit}>
                        {isLoading ? (
                            <RiLoader4Line className="h-4 w-4 animate-spin" />
                        ) : (
                            <RiCheckDoubleLine className="h-4 w-4" />
                        )}
                        {mode === "add" ? "Add Task" : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Single Task Row (Collapsible)
// ============================================================================

interface TaskRowProps {
    task: JobCardTaskWithItem;
    disabled: boolean;
    isUpdating: boolean;
    searchInventory?: (query: string, limit?: number) => InventoryItem[];
    onDelete: () => void;
    onStatusChange: (status: TaskStatus) => void;
    onToggleEstimate: (show: boolean) => void;
    onEdit: () => void;
    onDuplicate: () => void;
    isEditing: boolean;
    onEditSubmit: (data: CreateTaskInput) => Promise<void>;
    onEditCancel: () => void;
    isEditLoading: boolean;
}

function TaskRow({
    task,
    disabled,
    isUpdating,
    searchInventory,
    onDelete,
    onStatusChange,
    onToggleEstimate,
    onEdit,
    onDuplicate,
    isEditing,
    onEditSubmit,
    onEditCancel,
    isEditLoading,
}: TaskRowProps) {
    const [open, setOpen] = useState(false);

    const statusCfg = STATUS_CONFIG[task.taskStatus];
    const actionCfg = ACTION_CONFIG[task.actionType];
    const isCompleted = task.taskStatus === "COMPLETED";
    const isDraft = task.taskStatus === "DRAFT";
    const isApproved = task.taskStatus === "APPROVED";

    const lineTotal = task.actionType === "REPLACED" && task.unitPriceSnapshot && task.qty
        ? task.unitPriceSnapshot * task.qty : 0;
    const taxAmount = lineTotal * ((task.taxRateSnapshot ?? 18) / 100);
    const rowTotal = lineTotal + (task.laborCostSnapshot ?? 0);

    const nextStatuses: TaskStatus[] = isDraft ? ["APPROVED"] : isApproved ? ["DRAFT", "COMPLETED"] : [];
    const nextStatusLabels: Record<TaskStatus, string> = {
        APPROVED: "Approve Task",
        COMPLETED: "Mark Complete",
        DRAFT: "Revert to Draft",
    };

    // Expanded state whenever editing
    const isOpen = isEditing ? true : open;

    return (
        <Collapsible open={isOpen} onOpenChange={isEditing ? undefined : setOpen}>
            <div className={cn(
                "group rounded-xl border transition-all duration-200",
                isCompleted
                    ? "border-border/30 bg-muted/20 opacity-60"
                    : isOpen
                        ? "border-border/60 bg-card shadow-sm"
                        : "border-border/40 bg-card/60 hover:border-border/60 hover:shadow-sm"
            )}>
                {/* ── Compact header row ── */}
                <CollapsibleTrigger asChild>
                    <div className={cn(
                        "flex items-center gap-2.5 px-3.5 py-3 cursor-pointer select-none rounded-xl",
                        isEditing && "pointer-events-none"
                    )}>
                        {/* Animated status dot */}
                        <div className="shrink-0 relative">
                            <div className={cn(
                                "h-2.5 w-2.5 rounded-full",
                                statusCfg.dotClass
                            )} />
                            {(isDraft || isApproved) && !isUpdating && (
                                <div className={cn(
                                    "absolute inset-0 rounded-full animate-ping opacity-30",
                                    statusCfg.dotClass
                                )} />
                            )}
                        </div>

                        {/* Action type chip */}
                        <Badge variant="outline" className={cn("shrink-0 gap-1 text-[10px] h-5 px-1.5 font-medium", actionCfg.chipClass)}>
                            {task.actionType === "LABOR_ONLY"
                                ? <RiToolsLine className="h-3 w-3" />
                                : <RiRefreshLine className="h-3 w-3" />
                            }
                            {task.actionType === "LABOR_ONLY" ? "Labor" : "Part"}
                        </Badge>

                        {/* Task name */}
                        <span className={cn(
                            "flex-1 min-w-0 text-sm font-medium truncate",
                            isCompleted && "line-through text-muted-foreground"
                        )}>
                            {task.taskName}
                        </span>

                        {/* Estimate indicator */}
                        {task.showInEstimate && !isCompleted && (
                            <RiReceiptLine className="h-3.5 w-3.5 text-blue-400/70 shrink-0" aria-label="In estimate" />
                        )}

                        {/* Row total */}
                        {rowTotal > 0 && (
                            <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                                {formatCurrency(rowTotal)}
                            </span>
                        )}

                        {/* Status badge — compact */}
                        <Badge variant="outline" className={cn("shrink-0 text-[10px] h-5 px-1.5 hidden sm:flex", statusCfg.badgeClass)}>
                            {statusCfg.label}
                        </Badge>

                        {/* Expand chevron */}
                        <RiArrowDownSLine className={cn(
                            "h-4 w-4 text-muted-foreground/60 transition-transform duration-200 shrink-0",
                            isOpen && "rotate-180"
                        )} />

                        {/* ── Actions Dropdown ── */}
                        {!disabled && (
                            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
                                            disabled={isUpdating}
                                        >
                                            {isUpdating
                                                ? <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
                                                : <RiMore2Fill className="h-3.5 w-3.5" />
                                            }
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">

                                        {/* ── Task actions ── */}
                                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Task</DropdownMenuLabel>
                                        {isDraft && (
                                            <DropdownMenuItem onClick={onEdit}>
                                                <RiEditLine className="h-4 w-4" />
                                                Edit task
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={onDuplicate}>
                                            <RiFileCopyLine className="h-4 w-4" />
                                            Duplicate task
                                        </DropdownMenuItem>

                                        {/* ── Estimate visibility ── */}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Visibility</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onToggleEstimate(!task.showInEstimate)}>
                                            {task.showInEstimate
                                                ? <><RiEyeOffLine className="h-4 w-4" />Hide from estimate</>
                                                : <><RiEyeLine className="h-4 w-4 text-blue-400" />Show in estimate</>
                                            }
                                        </DropdownMenuItem>

                                        {/* ── Status transitions ── */}
                                        {nextStatuses.length > 0 && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Workflow</DropdownMenuLabel>
                                                {nextStatuses.map((s) => (
                                                    <DropdownMenuItem key={s} onClick={() => onStatusChange(s)}>
                                                        {s === "APPROVED" && <RiShieldCheckLine className="h-4 w-4 text-amber-400" />}
                                                        {s === "COMPLETED" && <RiTrophyLine className="h-4 w-4 text-emerald-400" />}
                                                        {s === "DRAFT" && <RiArrowGoBackLine className="h-4 w-4 text-zinc-400" />}
                                                        {nextStatusLabels[s]}
                                                    </DropdownMenuItem>
                                                ))}
                                            </>
                                        )}

                                        {/* ── Danger zone ── */}
                                        {isDraft && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                                                    <RiDeleteBin6Line className="h-4 w-4" />
                                                    Delete task
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                </CollapsibleTrigger>

                {/* ── Expanded content ── */}
                <CollapsibleContent>
                    <div className="border-t border-border/30">
                        {isEditing ? (
                            /* Edit mode — inline form */
                            <div className="p-3">
                                <TaskForm
                                    initialValues={fromTask(task)}
                                    onSubmit={onEditSubmit}
                                    onCancel={onEditCancel}
                                    isLoading={isEditLoading}
                                    searchInventory={searchInventory}
                                    mode="edit"
                                />
                            </div>
                        ) : (
                            /* View mode — rich details */
                            <div className="px-4 pb-4 pt-3 space-y-4">

                                {/* Description */}
                                {task.description ? (
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Description</p>
                                        <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 rounded-lg px-3 py-2.5 border border-border/30">
                                            {task.description}
                                        </p>
                                    </div>
                                ) : (
                                    !disabled && (
                                        <button
                                            onClick={onEdit}
                                            className="text-xs text-muted-foreground/50 hover:text-muted-foreground italic flex items-center gap-1 transition-colors"
                                        >
                                            <RiEditLine className="h-3 w-3" />
                                            Add a description...
                                        </button>
                                    )
                                )}

                                {/* Inventory / Part Card */}
                                {task.actionType === "REPLACED" && (
                                    <div>
                                        <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60 mb-1.5">Part Used</p>
                                        {task.inventoryItem ? (
                                            <div className={cn("rounded-lg border p-3 space-y-2.5", actionCfg.borderClass, actionCfg.bgClass)}>
                                                {/* Part header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/20 shrink-0">
                                                            <RiBox3Line className="h-4 w-4 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{task.inventoryItem.name}</p>
                                                            {task.inventoryItem.stockKeepingUnit && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    SKU: {task.inventoryItem.stockKeepingUnit}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="shrink-0 text-[10px] border-blue-500/20 bg-blue-500/10 text-blue-400">
                                                        Part
                                                    </Badge>
                                                </div>

                                                {/* Price breakdown table */}
                                                <div className="space-y-1.5 rounded-md bg-background/40 border border-border/20 px-3 py-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Unit price</span>
                                                        <span className="font-medium">{formatCurrency(task.unitPriceSnapshot)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Quantity</span>
                                                        <span className="font-medium">{task.qty} units</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Parts subtotal</span>
                                                        <span className="font-medium">{formatCurrency(lineTotal)}</span>
                                                    </div>
                                                    {taxAmount > 0 && (
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground">GST ({task.taxRateSnapshot ?? 18}%)</span>
                                                            <span className="font-medium">{formatCurrency(taxAmount)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/20">
                                                        <span className="font-semibold">Parts total (incl. tax)</span>
                                                        <span className="font-bold text-foreground">{formatCurrency(lineTotal + taxAmount)}</span>
                                                    </div>
                                                </div>

                                                {/* Stock info */}
                                                <div className="flex items-center gap-4 text-xs">
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <RiBox3Line className="h-3 w-3" />
                                                        <span>{task.inventoryItem.stockOnHand} on hand</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <RiTimeLine className="h-3 w-3" />
                                                        <span>{task.inventoryItem.stockReserved} reserved</span>
                                                    </div>
                                                    <div className={cn(
                                                        "flex items-center gap-1 ml-auto font-medium",
                                                        task.inventoryItem.stockAvailable > 0 ? "text-emerald-400" : "text-red-400"
                                                    )}>
                                                        {task.inventoryItem.stockAvailable} available
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-dashed border-border/40 px-3 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                                                <RiAlertLine className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                                No inventory item linked — edit task to add one
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Cost summary grid */}
                                <div>
                                    <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60 mb-1.5">Cost Breakdown</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: "Parts", value: lineTotal, icon: RiBox3Line, color: "text-blue-400" },
                                            { label: "Labor", value: task.laborCostSnapshot ?? 0, icon: RiToolsLine, color: "text-violet-400" },
                                            { label: "Task Total", value: rowTotal, icon: RiPriceTag3Line, color: "text-primary", highlight: true },
                                        ].map(({ label, value, icon: Icon, color, highlight }) => (
                                            <div key={label} className={cn(
                                                "rounded-lg border px-3 py-2.5 text-center transition-colors",
                                                highlight
                                                    ? "border-primary/20 bg-primary/5"
                                                    : "border-border/30 bg-muted/30"
                                            )}>
                                                <Icon className={cn("h-3.5 w-3.5 mx-auto mb-1", color)} />
                                                <p className="text-[10px] text-muted-foreground uppercase font-medium">{label}</p>
                                                <p className={cn("text-sm font-bold mt-0.5", highlight && "text-primary")}>
                                                    {formatCurrency(value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Audit trail */}
                                <div className="space-y-1.5">
                                    <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Timeline</p>
                                    <div className="space-y-1">
                                        {task.createdAt && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <RiTimeLine className="h-3.5 w-3.5 shrink-0" />
                                                <span>Created {formatDate(task.createdAt)}</span>
                                                {task.createdBy && (
                                                    <span className="flex items-center gap-1">
                                                        <RiUserLine className="h-3 w-3" /> {task.createdBy}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {task.approvedAt && (
                                            <div className="flex items-center gap-2 text-xs text-amber-400/80">
                                                <RiShieldCheckLine className="h-3.5 w-3.5 shrink-0" />
                                                <span>Approved {formatDate(task.approvedAt)}</span>
                                                {task.approvedBy && (
                                                    <span className="flex items-center gap-1">
                                                        <RiUserLine className="h-3 w-3" /> {task.approvedBy}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {task.completedAt && (
                                            <div className="flex items-center gap-2 text-xs text-emerald-400/80">
                                                <RiTrophyLine className="h-3.5 w-3.5 shrink-0" />
                                                <span>Completed {formatDate(task.completedAt)}</span>
                                                {task.completedBy && (
                                                    <span className="flex items-center gap-1">
                                                        <RiUserLine className="h-3 w-3" /> {task.completedBy}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Estimate visibility row */}
                                <div className="flex items-center justify-between pt-0.5">
                                    <div className="flex items-center gap-1.5">
                                        {task.showInEstimate
                                            ? <RiReceiptLine className="h-3.5 w-3.5 text-blue-400" />
                                            : <RiEyeOffLine className="h-3.5 w-3.5 text-muted-foreground" />
                                        }
                                        <span className={cn("text-xs", task.showInEstimate ? "text-blue-400" : "text-muted-foreground")}>
                                            {task.showInEstimate ? "Visible in customer estimate" : "Hidden from customer estimate"}
                                        </span>
                                    </div>
                                    {!disabled && (
                                        <Switch
                                            checked={task.showInEstimate}
                                            onCheckedChange={onToggleEstimate}
                                            className="scale-75 origin-right"
                                        />
                                    )}
                                </div>

                                {/* Action buttons for status changes */}
                                {!disabled && nextStatuses.length > 0 && (
                                    <div className="flex gap-2">
                                        {nextStatuses.map((s) => (
                                            <Button
                                                key={s}
                                                size="sm"
                                                variant={s === "COMPLETED" ? "default" : "outline"}
                                                className={cn(
                                                    "h-8 text-xs gap-1.5 flex-1",
                                                    s === "APPROVED" && "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50",
                                                    s === "DRAFT" && "border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/10"
                                                )}
                                                onClick={() => onStatusChange(s)}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? (
                                                    <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
                                                ) : s === "APPROVED" ? (
                                                    <RiShieldCheckLine className="h-3.5 w-3.5" />
                                                ) : s === "COMPLETED" ? (
                                                    <RiTrophyLine className="h-3.5 w-3.5" />
                                                ) : (
                                                    <RiArrowGoBackLine className="h-3.5 w-3.5" />
                                                )}
                                                {nextStatusLabels[s]}
                                            </Button>
                                        ))}
                                        {isDraft && !isEditing && (
                                            <Button
                                                size="sm" variant="outline"
                                                className="h-8 text-xs gap-1.5"
                                                onClick={onEdit}
                                            >
                                                <RiEditLine className="h-3.5 w-3.5" />
                                                Edit
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

// ============================================================================
// Main Panel Component
// ============================================================================

export function AdvancedTaskPanel({ jobId, disabled = false, className, searchInventory }: AdvancedTaskPanelProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

    const { data: tasks = [], isLoading, error } = useJobTasks(jobId);
    const createTask = useCreateTask(jobId);
    const updateTask = useUpdateTask(jobId);
    const deleteTask = useDeleteTask(jobId);
    const taskActions = useTaskActions(jobId);
    const totals = useMemo(() => calculateTaskTotals(tasks), [tasks]);

    const handleAdd = async (data: CreateTaskInput) => {
        await createTask.mutateAsync(data);
        setShowAddForm(false);
    };

    const handleEdit = async (task: JobCardTaskWithItem, data: CreateTaskInput) => {
        await updateTask.mutateAsync({
            taskId: task.id,
            input: {
                taskName: data.taskName,
                description: data.description,
                actionType: data.actionType,
                laborCostSnapshot: data.laborCostSnapshot,
                showInEstimate: data.showInEstimate,
                inventoryItemId: data.inventoryItemId,
                unitPriceSnapshot: data.unitPriceSnapshot,
                qty: data.qty,
            },
        });
        setEditingTaskId(null);
    };

    const handleDuplicate = async (task: JobCardTaskWithItem) => {
        await createTask.mutateAsync({
            taskName: `${task.taskName} (copy)`,
            description: task.description ?? undefined,
            actionType: task.actionType,
            laborCostSnapshot: task.laborCostSnapshot,
            showInEstimate: task.showInEstimate,
            inventoryItemId: task.inventoryItemId ?? undefined,
            qty: task.qty ?? undefined,
            unitPriceSnapshot: task.unitPriceSnapshot ?? undefined,
            taxRateSnapshot: task.taxRateSnapshot,
        });
    };

    const handleDelete = async (taskId: string) => {
        await deleteTask.mutateAsync(taskId);
    };

    const handleStatusChange = async (taskId: string, status: TaskStatus) => {
        setUpdatingTaskId(taskId);
        try {
            if (status === "APPROVED") await taskActions.approve(taskId);
            else if (status === "COMPLETED") await taskActions.complete(taskId);
            else if (status === "DRAFT") await taskActions.reactivate(taskId);
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const handleToggleEstimate = async (taskId: string, show: boolean) => {
        setUpdatingTaskId(taskId);
        try {
            await updateTask.mutateAsync({ taskId, input: { showInEstimate: show } });
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const taskCount = totals.taskCount;
    const completedCount = totals.completedCount;
    const progressPct = taskCount > 0 ? (completedCount / taskCount) * 100 : 0;

    if (isLoading) {
        return (
            <div className={cn("flex flex-col items-center justify-center gap-3 py-12", className)}>
                <RiLoader4Line className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Loading tasks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn("flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive", className)}>
                <RiAlertLine className="h-4 w-4 shrink-0" />
                Failed to load tasks. Please refresh.
            </div>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                        <RiFileListLine className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold leading-none">Tasks</h3>
                        {taskCount > 0 && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                                {completedCount} of {taskCount} completed
                            </p>
                        )}
                    </div>
                </div>

                {!disabled && (
                    <Button
                        size="sm"
                        variant={showAddForm ? "secondary" : "outline"}
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => { setShowAddForm((v) => !v); setEditingTaskId(null); }}
                    >
                        {showAddForm
                            ? <><RiCloseLine className="h-3.5 w-3.5" />Cancel</>
                            : <><RiAddLine className="h-3.5 w-3.5" />Add Task</>
                        }
                    </Button>
                )}
            </div>

            {/* ── Progress bar ── */}
            {taskCount > 0 && (
                <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    {taskCount > 0 && (
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{Math.round(progressPct)}% complete</span>
                            <span>{taskCount - completedCount} remaining</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Add form ── */}
            {showAddForm && (
                <TaskForm
                    onSubmit={handleAdd}
                    onCancel={() => setShowAddForm(false)}
                    isLoading={createTask.isPending}
                    searchInventory={searchInventory}
                    mode="add"
                />
            )}

            {/* ── Task list ── */}
            {tasks.length > 0 ? (
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            disabled={disabled}
                            isUpdating={updatingTaskId === task.id}
                            searchInventory={searchInventory}
                            onDelete={() => handleDelete(task.id)}
                            onStatusChange={(s) => handleStatusChange(task.id, s)}
                            onToggleEstimate={(show) => handleToggleEstimate(task.id, show)}
                            onEdit={() => { setEditingTaskId(task.id); setShowAddForm(false); }}
                            onDuplicate={() => handleDuplicate(task)}
                            isEditing={editingTaskId === task.id}
                            onEditSubmit={(data) => handleEdit(task, data)}
                            onEditCancel={() => setEditingTaskId(null)}
                            isEditLoading={updateTask.isPending && editingTaskId === task.id}
                        />
                    ))}
                </div>
            ) : (
                !showAddForm && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/40 bg-muted/10 py-12">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 border border-border/40">
                            <RiFileListLine className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
                            <p className="text-xs text-muted-foreground/50 mt-1">
                                Break down this job into specific tasks to track progress
                            </p>
                        </div>
                        {!disabled && (
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 mt-1" onClick={() => setShowAddForm(true)}>
                                <RiAddLine className="h-3.5 w-3.5" />
                                Add First Task
                            </Button>
                        )}
                    </div>
                )
            )}

            {/* ── Totals footer ── */}
            {taskCount > 0 && totals.total > 0 && (
                <div className="rounded-xl border border-border/40 bg-muted/20 overflow-hidden">
                    <div className="grid grid-cols-4 divide-x divide-border/40">
                        {[
                            { label: "Parts", value: totals.partsTotal },
                            { label: "Labor", value: totals.laborTotal },
                            { label: "Tax", value: totals.taxTotal },
                            { label: "Total", value: totals.total, highlight: true },
                        ].map(({ label, value, highlight }) => (
                            <div key={label} className={cn("px-3 py-2.5 text-center", highlight && "bg-primary/5")}>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">{label}</p>
                                <p className={cn("text-sm font-bold mt-0.5 tabular-nums", highlight ? "text-primary" : "text-foreground")}>
                                    {formatCurrency(value)}
                                </p>
                            </div>
                        ))}
                    </div>
                    {totals.partsTotal > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-border/30 bg-muted/20">
                            <RiInformationLine className="h-3 w-3 text-muted-foreground/60" />
                            <p className="text-[10px] text-muted-foreground/60">18% GST applied on parts only</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
