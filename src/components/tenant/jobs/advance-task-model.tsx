"use client";

import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
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
    RiTimeLine,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type {
    InventorySnapshotItem,
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
    searchInventory?: (query: string, limit?: number) => InventorySnapshotItem[];
}

// ============================================================================
// Inline Task Form (Add / Edit)
// ============================================================================

interface TaskFormValues {
    taskName: string;
    description: string;
    laborCost: string;
    showInEstimate: boolean;
    selectedItem: InventorySnapshotItem | null;
    qty: string;
}

const defaultForm = (): TaskFormValues => ({
    taskName: "",
    description: "",
    laborCost: "0",
    showInEstimate: true,
    selectedItem: null,
    qty: "1",
});

function fromTask(task: JobCardTaskWithItem): TaskFormValues {
    return {
        taskName: task.taskName,
        description: task.description ?? "",
        laborCost: String(task.laborCostSnapshot ?? 0),
        showInEstimate: task.showInEstimate,
        qty: String(task.qty ?? 1),
        selectedItem: task.inventoryItem
            ? ({
                id: task.inventoryItem.id,
                name: task.inventoryItem.name,
                stockKeepingUnit: task.inventoryItem.stockKeepingUnit,
                sellPrice: task.unitPriceSnapshot ?? 0,
                unitCost: task.unitPriceSnapshot ?? 0,
                stockOnHand: task.inventoryItem.stockOnHand,
                stockReserved: task.inventoryItem.stockReserved,
                stockAvailable: task.inventoryItem.stockAvailable,
                reorderLevel: 0,
                updatedAt: '',
            } as InventorySnapshotItem)
            : null,
    };
}

interface TaskFormProps {
    initialValues?: TaskFormValues;
    onSubmit: (data: CreateTaskInput, opts?: { keepOpen?: boolean }) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
    searchInventory?: (query: string, limit?: number) => InventorySnapshotItem[];
    mode: "add" | "edit";
}

function TaskForm({ initialValues, onSubmit, onCancel, isLoading, searchInventory, mode }: TaskFormProps) {
    const [form, setForm] = useState<TaskFormValues>(initialValues ?? defaultForm());
    const [mentionActive, setMentionActive] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionAnchorPos, setMentionAnchorPos] = useState(0);
    const [mentionHighlight, setMentionHighlight] = useState(0);
    const [createMore, setCreateMore] = useState(false);
    const [showDescription, setShowDescription] = useState(!!(initialValues?.description));
    const inputRef = useRef<HTMLInputElement>(null);
    // Tracks where the selected part's name sits inside form.taskName so we can remove it atomically
    const selectedItemRangeRef = useRef<{ start: number; end: number } | null>(null);

    const patch = (partial: Partial<TaskFormValues>) =>
        setForm((prev) => ({ ...prev, ...partial }));

    // Synchronous search from in-memory inventory snapshot
    const mentionResults = useMemo(() => {
        if (!searchInventory || !mentionActive) return [];
        return searchInventory(mentionQuery.trim(), 8);
    }, [searchInventory, mentionActive, mentionQuery]);

    const parsedQty = Math.max(1, parseInt(form.qty) || 1);
    const parsedLaborCost = parseFloat(form.laborCost) || 0;
    const stockAvail = form.selectedItem?.stockAvailable ?? 0;
    const qtyExceeds = form.selectedItem ? parsedQty > stockAvail : false;
    const partsSubtotal = form.selectedItem ? (form.selectedItem.sellPrice ?? 0) * parsedQty : 0;
    const grandTotal = partsSubtotal + parsedLaborCost;

    // Backdrop highlight: split taskName around the selected part's range
    const hlRange = form.selectedItem ? selectedItemRangeRef.current : null;
    const hlBefore = hlRange ? form.taskName.slice(0, hlRange.start) : '';
    const hlPart   = hlRange ? form.taskName.slice(hlRange.start, hlRange.end) : '';
    const hlAfter  = hlRange ? form.taskName.slice(hlRange.end) : '';

    const handleMentionSelect = (item: InventorySnapshotItem) => {
        if (item.stockOnHand <= 0) return;
        const before = form.taskName.slice(0, mentionAnchorPos);
        const rawAfter = form.taskName.slice(mentionAnchorPos + 1 + mentionQuery.length);
        const after = rawAfter && !rawAfter.startsWith(' ') ? ' ' + rawAfter : rawAfter;
        const newName = (before + item.name + after).trim();
        // Record exactly where the part name lives so we can remove it atomically later
        const nameIdx = newName.indexOf(item.name);
        selectedItemRangeRef.current = nameIdx !== -1
            ? { start: nameIdx, end: nameIdx + item.name.length }
            : null;
        patch({ taskName: newName, selectedItem: item, qty: '1' });
        setMentionActive(false);
        setMentionQuery('');
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const pos = nameIdx !== -1 ? nameIdx + item.name.length : newName.length;
                inputRef.current.setSelectionRange(pos, pos);
            }
        }, 0);
    };

    const handleTaskNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // If a part is already linked, keep the range in sync with any text edits
        if (form.selectedItem) {
            const idx = val.indexOf(form.selectedItem.name);
            if (idx === -1) {
                // User manually edited the part name away — clear the card, keep whatever text remains
                selectedItemRangeRef.current = null;
                setForm(prev => ({ ...prev, taskName: val, selectedItem: null, qty: '1' }));
            } else {
                selectedItemRangeRef.current = { start: idx, end: idx + form.selectedItem.name.length };
                patch({ taskName: val });
            }
            return; // don't re-open the mention dropdown while a part is selected
        }

        patch({ taskName: val });
        if (!searchInventory) return;
        const cursorPos = e.target.selectionStart ?? val.length;
        const textBeforeCursor = val.slice(0, cursorPos);
        const lastAtIdx = textBeforeCursor.lastIndexOf('#');
        if (lastAtIdx !== -1) {
            const query = textBeforeCursor.slice(lastAtIdx + 1);
            if (!query.includes(' ')) {
                setMentionActive(true);
                setMentionQuery(query);
                setMentionAnchorPos(lastAtIdx);
                setMentionHighlight(0);
                return;
            }
        }
        setMentionActive(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (mentionActive) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionHighlight(i => (i + 1) % Math.max(1, mentionResults.length));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionHighlight(i => (i - 1 + Math.max(1, mentionResults.length)) % Math.max(1, mentionResults.length));
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const item = mentionResults[mentionHighlight];
                if (item && item.stockOnHand > 0) handleMentionSelect(item);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setMentionActive(false);
                const before = form.taskName.slice(0, mentionAnchorPos);
                const after = form.taskName.slice(mentionAnchorPos + 1 + mentionQuery.length);
                patch({ taskName: (before + after).trimEnd() });
                return;
            }
        } else {
            // Backspace anywhere within the linked part name → nuke the whole token
            if (e.key === 'Backspace' && form.selectedItem && selectedItemRangeRef.current) {
                const range = selectedItemRangeRef.current;
                const cursor = inputRef.current?.selectionStart ?? 0;
                const selEnd = inputRef.current?.selectionEnd ?? cursor;
                if (cursor > range.start && selEnd <= range.end + 1) {
                    e.preventDefault();
                    const beforePart = form.taskName.slice(0, range.start).trimEnd();
                    const afterPart = form.taskName.slice(range.end).trimStart();
                    const sep = beforePart && afterPart ? ' ' : '';
                    const newName = beforePart + sep + afterPart;
                    selectedItemRangeRef.current = null;
                    patch({ taskName: newName, selectedItem: null, qty: '1' });
                    setTimeout(() => {
                        if (inputRef.current) {
                            inputRef.current.focus();
                            inputRef.current.setSelectionRange(beforePart.length, beforePart.length);
                        }
                    }, 0);
                    return;
                }
            }
            if (e.key === 'Escape') { onCancel(); return; }
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
        }
    };

    const handleSubmit = async () => {
        if (!form.taskName.trim() || isLoading) return;
        const hasItem = !!form.selectedItem && parsedQty > 0;
        const data: CreateTaskInput = {
            taskName: form.taskName.trim(),
            description: form.description.trim() || undefined,
            actionType: hasItem ? "REPLACED" : "LABOR_ONLY",
            laborCostSnapshot: parsedLaborCost,
            showInEstimate: form.showInEstimate,
        };
        if (hasItem && form.selectedItem) {
            data.inventoryItemId = form.selectedItem.id;
            data.qty = parsedQty;
            data.unitPriceSnapshot = form.selectedItem.sellPrice ?? form.selectedItem.unitCost ?? 0;
        }
        try {
            await onSubmit(data, { keepOpen: mode === 'add' && createMore });
            if (mode === 'add' && createMore) {
                setForm(defaultForm());
                setShowDescription(false);
                setTimeout(() => inputRef.current?.focus(), 50);
            }
        } catch {
            // error toast handled by parent
        }
    };

    return (
        <div className="rounded-xl border border-border/60 bg-muted/30 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-background/40">
                <div className="flex items-center gap-2">
                    {mode === "add"
                        ? <RiAddLine className="h-4 w-4 text-primary" />
                        : <RiEditLine className="h-4 w-4 text-primary" />
                    }
                    <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                        {mode === "add" ? "New Task" : "Edit Task"}
                    </span>
                    <span className="text-xs text-muted-foreground/40 hidden sm:inline">
                        · ⌘↵ save{searchInventory ? " · # part" : ""}
                    </span>
                </div>
                <button onClick={onCancel} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <RiCloseLine className="h-4 w-4" />
                </button>
            </div>

            <div className="p-4 space-y-3">
                {/* Task Name with #-mention trigger */}
                <div className="relative">
                    <Input
                        ref={inputRef}
                        autoFocus
                        placeholder={
                            searchInventory
                                ? "Task name — type # to add a part"
                                : "e.g. Oil change, brake inspection"
                        }
                        value={form.taskName}
                        onChange={handleTaskNameChange}
                        onKeyDown={handleNameKeyDown}
                        className={cn(
                            "border-border/60 focus-visible:ring-primary/40 h-11 caret-foreground",
                            hlRange ? "bg-transparent" : "bg-background/70"
                        )}
                        style={hlRange ? { color: 'transparent' } : undefined}
                    />
                    {/* Highlight backdrop — visible only when a part is selected */}
                    {hlRange && (
                        <div
                            aria-hidden
                            className="absolute inset-px flex items-center px-3 pointer-events-none overflow-hidden text-sm select-none rounded-[calc(var(--radius)-1px)] text-foreground"
                            style={{ fontFamily: 'inherit', letterSpacing: 'inherit' }}
                        >
                            <span className="whitespace-pre">
                                {hlBefore}
                                <span
                                    className="bg-blue-500/20 text-blue-400 rounded-[3px]"
                                    style={{ padding: '1px 1px' }}
                                >
                                    {hlPart}
                                </span>
                                {hlAfter}
                            </span>
                        </div>
                    )}

                    {/* # mention dropdown */}
                    {mentionActive && searchInventory && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border/60 bg-popover shadow-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30 bg-muted/40">
                                <RiBox3Line className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <span className="text-xs text-muted-foreground">
                                    {mentionQuery
                                        ? <><span className="text-foreground/70 font-medium">"{mentionQuery}"</span> in inventory</>
                                        : "Inventory — start typing to filter"
                                    }
                                </span>
                                <span className="ml-auto text-xs text-muted-foreground/40 hidden sm:inline">↑↓ navigate · ↵ select · ⎋ close</span>
                            </div>
                            {mentionResults.length > 0 ? (
                                <div className="py-1 max-h-60 overflow-y-auto">
                                    {mentionResults.map((item, idx) => {
                                        const outOfStock = item.stockOnHand <= 0;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                disabled={outOfStock}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => !outOfStock && handleMentionSelect(item)}
                                                onMouseEnter={() => !outOfStock && setMentionHighlight(idx)}
                                                className={cn(
                                                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors text-sm",
                                                    idx === mentionHighlight && !outOfStock ? "bg-muted/80" : "hover:bg-muted/40",
                                                    outOfStock && "opacity-40 cursor-not-allowed"
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/15 border border-blue-500/20 shrink-0">
                                                        <RiBox3Line className="h-3.5 w-3.5 text-blue-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">{item.name}</p>
                                                        {item.stockKeepingUnit && (
                                                            <p className="text-xs text-muted-foreground">SKU: {item.stockKeepingUnit}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="font-semibold tabular-nums">₹{(item.sellPrice ?? 0).toFixed(0)}</p>
                                                    <p className={cn(
                                                        "text-xs tabular-nums mt-0.5",
                                                        item.stockAvailable > 0 ? "text-emerald-400" : "text-red-400"
                                                    )}>
                                                        {item.stockAvailable > 0 ? `${item.stockAvailable} avail` : "Out of stock"}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : mentionQuery ? (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-muted-foreground">No parts matching "{mentionQuery}"</p>
                                    <p className="text-xs text-muted-foreground/50 mt-1">Press ⎋ to dismiss</p>
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <RiBox3Line className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Type to search parts</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Selected part pill + quantity stepper */}
                {form.selectedItem && (
                    <div className="flex items-center gap-2">
                        <div className="flex flex-1 items-center gap-2 min-w-0 rounded-lg border border-blue-500/30 bg-blue-500/8 px-3 py-2">
                            <RiBox3Line className="h-4 w-4 text-blue-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{form.selectedItem.name}</p>
                                <p className="text-xs text-muted-foreground tabular-nums">
                                    ₹{(form.selectedItem.sellPrice ?? 0).toFixed(0)} · {form.selectedItem.stockAvailable} avail
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    // Also strip the part name from the task name text
                                    const range = selectedItemRangeRef.current;
                                    let newName = form.taskName;
                                    if (range) {
                                        const beforePart = newName.slice(0, range.start).trimEnd();
                                        const afterPart = newName.slice(range.end).trimStart();
                                        const sep = beforePart && afterPart ? ' ' : '';
                                        newName = beforePart + sep + afterPart;
                                    } else if (form.selectedItem) {
                                        const idx = newName.indexOf(form.selectedItem.name);
                                        if (idx !== -1) {
                                            const beforePart = newName.slice(0, idx).trimEnd();
                                            const afterPart = newName.slice(idx + form.selectedItem.name.length).trimStart();
                                            const sep = beforePart && afterPart ? ' ' : '';
                                            newName = beforePart + sep + afterPart;
                                        }
                                    }
                                    selectedItemRangeRef.current = null;
                                    patch({ selectedItem: null, qty: '1', taskName: newName });
                                    setTimeout(() => inputRef.current?.focus(), 0);
                                }}
                                className="shrink-0 text-muted-foreground/60 hover:text-muted-foreground rounded transition-colors"
                                aria-label="Remove part"
                            >
                                <RiCloseLine className="h-4 w-4" />
                            </button>
                        </div>
                        {/* Quantity stepper */}
                        <div className="flex items-center rounded-lg border border-border/60 bg-background/70 overflow-hidden shrink-0">
                            <button
                                type="button"
                                onClick={() => patch({ qty: String(Math.max(1, parsedQty - 1)) })}
                                className="h-9 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-base leading-none border-r border-border/40"
                            >−</button>
                            <input
                                type="number" min={1}
                                value={form.qty}
                                onChange={(e) => patch({ qty: e.target.value })}
                                className="w-10 h-9 text-center text-sm font-semibold bg-transparent border-none outline-none tabular-nums"
                            />
                            <button
                                type="button"
                                onClick={() => patch({ qty: String(parsedQty + 1) })}
                                className="h-9 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-base leading-none border-l border-border/40"
                            >+</button>
                        </div>
                    </div>
                )}

                {qtyExceeds && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-400">
                        <RiAlertLine className="h-3.5 w-3.5 shrink-0" />
                        Only {stockAvail} unit{stockAvail === 1 ? "" : "s"} in stock
                    </p>
                )}

                {/* Labor Cost */}
                <div className="relative">
                    <RiToolsLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="number" min={0} step={50}
                        value={form.laborCost}
                        onChange={(e) => patch({ laborCost: e.target.value })}
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
                            if (e.key === 'Escape') onCancel();
                        }}
                        placeholder="Labor cost (₹)"
                        className="pl-9 h-10 bg-background/70 border-border/60 focus-visible:ring-primary/40"
                    />
                </div>

                {/* Description — expandable on demand */}
                {showDescription ? (
                    <div className="space-y-1">
                        <Textarea
                            autoFocus={mode === 'add'}
                            placeholder="Optional notes or instructions..."
                            value={form.description}
                            onChange={(e) => patch({ description: e.target.value })}
                            rows={2}
                            className="bg-background/70 border-border/60 resize-none text-sm focus-visible:ring-primary/40"
                            onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
                            }}
                        />
                        {!form.description && (
                            <button
                                type="button"
                                onClick={() => setShowDescription(false)}
                                className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowDescription(true)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                        <RiAddLine className="h-3.5 w-3.5" />
                        Add notes
                    </button>
                )}

                {/* Live cost preview */}
                {grandTotal > 0 && (
                    <div className="flex items-center justify-between rounded-lg border border-primary/15 bg-primary/5 px-3 py-2">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {partsSubtotal > 0 && (
                                <span className="flex items-center gap-1">
                                    <RiBox3Line className="h-3.5 w-3.5" />
                                    ₹{partsSubtotal.toFixed(0)}
                                </span>
                            )}
                            {parsedLaborCost > 0 && (
                                <span className="flex items-center gap-1">
                                    <RiToolsLine className="h-3.5 w-3.5" />
                                    ₹{parsedLaborCost.toFixed(0)}
                                </span>
                            )}
                        </div>
                        <span className="text-sm font-bold text-primary">₹{grandTotal.toFixed(2)}</span>
                    </div>
                )}

                {/* Show in estimate */}
                <div className="flex items-center justify-between rounded-lg border border-border/30 bg-background/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                        {form.showInEstimate
                            ? <RiEyeLine className="h-4 w-4 text-blue-400" />
                            : <RiEyeOffLine className="h-4 w-4 text-muted-foreground/60" />
                        }
                        <span className={cn(
                            "text-sm",
                            form.showInEstimate ? "text-foreground/80" : "text-muted-foreground"
                        )}>
                            Show in estimate
                        </span>
                    </div>
                    <Switch checked={form.showInEstimate} onCheckedChange={(val) => patch({ showInEstimate: val })} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-0.5">
                    {mode === "add" && (
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={createMore}
                                onChange={(e) => setCreateMore(e.target.checked)}
                                className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                            />
                            <span className="text-xs text-muted-foreground">Create another</span>
                        </label>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 px-3 text-sm text-muted-foreground"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="h-9 gap-1.5 px-4 min-w-22.5"
                            onClick={handleSubmit}
                            disabled={isLoading || !form.taskName.trim()}
                        >
                            {isLoading
                                ? <RiLoader4Line className="h-4 w-4 animate-spin" />
                                : <RiCheckDoubleLine className="h-4 w-4" />
                            }
                            {mode === "add" ? (createMore ? "Add & Next" : "Add Task") : "Save"}
                        </Button>
                    </div>
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
    searchInventory?: (query: string, limit?: number) => InventorySnapshotItem[];
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
                        "flex items-center gap-3 px-4.5 py-4 cursor-pointer select-none rounded-xl",
                        isEditing && "pointer-events-none"
                    )}>
                        {/* Animated status dot */}
                        <div className="shrink-0 relative">
                            <div className={cn(
                                "h-3 w-3 rounded-full",
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
                        <Badge variant="outline" className={cn("shrink-0 gap-1 text-xs h-6 px-3 font-medium", actionCfg.chipClass)}>
                            {task.actionType === "LABOR_ONLY"
                                ? <RiToolsLine className="h-4 w-4" />
                                : <RiRefreshLine className="h-4 w-4" />
                            }
                            {task.actionType === "LABOR_ONLY" ? "Labor" : "Part"}
                        </Badge>

                        {/* Task name */}
                        <span className={cn(
                            "flex-1 min-w-0 text-base font-medium truncate",
                            isCompleted && "line-through text-muted-foreground"
                        )}>
                            {task.taskName}
                        </span>

                        {/* Estimate indicator */}
                        {task.showInEstimate && !isCompleted && (
                            <RiReceiptLine className="h-5 w-5 text-blue-400/70 shrink-0" aria-label="In estimate" />
                        )}

                        {/* Row total */}
                        {rowTotal > 0 && (
                            <span className="shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
                                {formatCurrency(rowTotal)}
                            </span>
                        )}

                        {/* Status badge — compact */}
                        <Badge variant="outline" className={cn("shrink-0 text-xs h-6 px-3 hidden sm:flex", statusCfg.badgeClass)}>
                            {statusCfg.label}
                        </Badge>

                        {/* Expand chevron */}
                        <RiArrowDownSLine className={cn(
                            "h-5 w-5 text-muted-foreground/60 transition-transform duration-200 shrink-0",
                            isOpen && "rotate-180"
                        )} />

                        {/* ── Actions Dropdown ── */}
                        {!disabled && (
                            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
                                            disabled={isUpdating}
                                        >
                                            {isUpdating
                                                ? <RiLoader4Line className="h-5 w-5 animate-spin" />
                                                : <RiMore2Fill className="h-5 w-5" />
                                            }
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">

                                        {/* ── Task actions ── */}
                                        <DropdownMenuLabel className="text-sm text-muted-foreground font-normal">Task</DropdownMenuLabel>
                                        {isDraft && (
                                            <DropdownMenuItem onClick={onEdit}>
                                                <RiEditLine className="h-5 w-5" />
                                                Edit task
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={onDuplicate}>
                                            <RiFileCopyLine className="h-5 w-5" />
                                            Duplicate task
                                        </DropdownMenuItem>

                                        {/* ── Estimate visibility ── */}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="text-sm text-muted-foreground font-normal">Visibility</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onToggleEstimate(!task.showInEstimate)}>
                                            {task.showInEstimate
                                                ? <><RiEyeOffLine className="h-5 w-5" />Hide from estimate</>
                                                : <><RiEyeLine className="h-5 w-5 text-blue-400" />Show in estimate</>
                                            }
                                        </DropdownMenuItem>

                                        {/* ── Status transitions ── */}
                                        {nextStatuses.length > 0 && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel className="text-sm text-muted-foreground font-normal">Workflow</DropdownMenuLabel>
                                                {nextStatuses.map((s) => (
                                                    <DropdownMenuItem key={s} onClick={() => onStatusChange(s)}>
                                                        {s === "APPROVED" && <RiShieldCheckLine className="h-5 w-5 text-amber-400" />}
                                                        {s === "COMPLETED" && <RiTrophyLine className="h-5 w-5 text-emerald-400" />}
                                                        {s === "DRAFT" && <RiArrowGoBackLine className="h-5 w-5 text-zinc-400" />}
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
                                                    <RiDeleteBin6Line className="h-5 w-5" />
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
                            <div className="p-4">
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
                                        <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground/60">Description</p>
                                        <p className="text-base text-foreground/80 leading-relaxed bg-muted/30 rounded-lg px-4 py-2.5 border border-border/30">
                                            {task.description}
                                        </p>
                                    </div>
                                ) : (
                                    !disabled && (
                                        <button
                                            onClick={onEdit}
                                            className="text-sm text-muted-foreground/50 hover:text-muted-foreground italic flex items-center gap-1 transition-colors"
                                        >
                                            <RiEditLine className="h-4 w-4" />
                                            Add a description...
                                        </button>
                                    )
                                )}

                                {/* Inventory / Part Card */}
                                {task.actionType === "REPLACED" && (
                                    <div>
                                        <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground/60 mb-1.5">Part Used</p>
                                        {task.inventoryItem ? (
                                            <div className={cn("rounded-lg border p-4 space-y-2.5", actionCfg.borderClass, actionCfg.bgClass)}>
                                                {/* Part header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-8 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/20 shrink-0">
                                                            <RiBox3Line className="h-5 w-5 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-semibold text-foreground">{task.inventoryItem.name}</p>
                                                            {task.inventoryItem.stockKeepingUnit && (
                                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                                    SKU: {task.inventoryItem.stockKeepingUnit}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="shrink-0 text-xs border-blue-500/20 bg-blue-500/10 text-blue-400">
                                                        Part
                                                    </Badge>
                                                </div>

                                                {/* Price breakdown table */}
                                                <div className="space-y-1.5 rounded-md bg-background/40 border border-border/20 px-4 py-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Unit price</span>
                                                        <span className="font-medium">{formatCurrency(task.unitPriceSnapshot)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Quantity</span>
                                                        <span className="font-medium">{task.qty} units</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Parts subtotal</span>
                                                        <span className="font-medium">{formatCurrency(lineTotal)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm pt-1.5 border-t border-border/20">
                                                        <span className="font-semibold">Parts total</span>
                                                        <span className="font-bold text-foreground">{formatCurrency(lineTotal)}</span>
                                                    </div>
                                                </div>

                                                {/* Stock info */}
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <RiBox3Line className="h-4 w-4" />
                                                        <span>{task.inventoryItem.stockOnHand} on hand</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <RiTimeLine className="h-4 w-4" />
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
                                            <div className="rounded-lg border border-dashed border-border/40 px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                                                <RiAlertLine className="h-5 w-5 text-amber-400 shrink-0" />
                                                No inventory item linked — edit task to add one
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Audit trail */}
                                <div className="space-y-1.5">
                                    <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground/60">Timeline</p>
                                    <div className="space-y-1">
                                        {task.createdAt && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <RiTimeLine className="h-5 w-5 shrink-0" />
                                                <span>Created {formatDate(task.createdAt)}</span>
                                            </div>
                                        )}
                                        {task.approvedAt && (
                                            <div className="flex items-center gap-2 text-sm text-amber-400/80">
                                                <RiShieldCheckLine className="h-5 w-5 shrink-0" />
                                                <span>Approved {formatDate(task.approvedAt)}</span>
                                            </div>
                                        )}
                                        {task.completedAt && (
                                            <div className="flex items-center gap-2 text-sm text-emerald-400/80">
                                                <RiTrophyLine className="h-5 w-5 shrink-0" />
                                                <span>Completed {formatDate(task.completedAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Estimate visibility row */}
                                <div className="flex items-center justify-between pt-0.5">
                                    <div className="flex items-center gap-2">
                                        {task.showInEstimate
                                            ? <RiReceiptLine className="h-5 w-5 text-blue-400" />
                                            : <RiEyeOffLine className="h-5 w-5 text-muted-foreground" />
                                        }
                                        <span className={cn("text-sm", task.showInEstimate ? "text-blue-400" : "text-muted-foreground")}>
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
                                                    "h-10 text-sm gap-2 flex-1",
                                                    s === "APPROVED" && "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50",
                                                    s === "DRAFT" && "border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/10"
                                                )}
                                                onClick={() => onStatusChange(s)}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? (
                                                    <RiLoader4Line className="h-5 w-5 animate-spin" />
                                                ) : s === "APPROVED" ? (
                                                    <RiShieldCheckLine className="h-5 w-5" />
                                                ) : s === "COMPLETED" ? (
                                                    <RiTrophyLine className="h-5 w-5" />
                                                ) : (
                                                    <RiArrowGoBackLine className="h-5 w-5" />
                                                )}
                                                {nextStatusLabels[s]}
                                            </Button>
                                        ))}
                                        {isDraft && !isEditing && (
                                            <Button
                                                size="sm" variant="outline"
                                                className="h-10 text-sm gap-2"
                                                onClick={onEdit}
                                            >
                                                <RiEditLine className="h-5 w-5" />
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

    const handleAdd = async (data: CreateTaskInput, opts?: { keepOpen?: boolean }) => {
        await createTask.mutateAsync(data);
        if (!opts?.keepOpen) setShowAddForm(false);
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

            toast.success(
                status === "APPROVED" ? "Task approved — stock reserved"
                    : status === "COMPLETED" ? "Task marked complete"
                        : "Task reverted to draft"
            );
        } catch (err: any) {
            console.error("[TaskPanel] Status change failed:", err);
            if (err?.code === 'INSUFFICIENT_STOCK') {
                toast.error("Insufficient stock", {
                    description: `Only ${err.stockAvailable} units available. Cannot reserve ${err.stockRequested} units.`,
                    duration: 5000,
                });
            } else {
                toast.error(err?.message || "Failed to update task status");
            }
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
                <p className="text-sm text-muted-foreground">Loading tasks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn("flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-4 text-base text-destructive", className)}>
                <RiAlertLine className="h-5 w-5 shrink-0" />
                Failed to load tasks. Please refresh.
            </div>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                        <RiFileListLine className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold leading-none">Tasks</h3>
                        {taskCount > 0 && (
                            <p className="text-sm text-muted-foreground mt-0.5 leading-none">
                                {completedCount} of {taskCount} completed
                            </p>
                        )}
                    </div>
                </div>

                {!disabled && (
                    <Button
                        size="sm"
                        variant={showAddForm ? "secondary" : "outline"}
                        className="h-10 gap-2 text-sm"
                        onClick={() => { setShowAddForm((v) => !v); setEditingTaskId(null); }}
                    >
                        {showAddForm
                            ? <><RiCloseLine className="h-5 w-5" />Cancel</>
                            : <><RiAddLine className="h-5 w-5" />Add Task</>
                        }
                    </Button>
                )}
            </div>

            {/* ── Progress bar ── */}
            {taskCount > 0 && (
                <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-linear-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    {taskCount > 0 && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                            <p className="text-base font-medium text-muted-foreground">No tasks yet</p>
                            <p className="text-sm text-muted-foreground/50 mt-1">
                                Break down this job into specific tasks to track progress
                            </p>
                        </div>
                        {!disabled && (
                            <Button size="sm" variant="outline" className="gap-2 text-sm h-10 mt-1" onClick={() => setShowAddForm(true)}>
                                <RiAddLine className="h-5 w-5" />
                                Add First Task
                            </Button>
                        )}
                    </div>
                )
            )}

            {/* ── Totals footer ── */}
            {taskCount > 0 && totals.total > 0 && (
                <div className="rounded-xl border border-border/40 bg-muted/20 overflow-hidden">
                    <div className="grid grid-cols-3 divide-x divide-border/40">
                        {[
                            { label: "Parts", value: totals.partsTotal },
                            { label: "Labor", value: totals.laborTotal },
                            { label: "Total", value: totals.total, highlight: true },
                        ].map(({ label, value, highlight }) => (
                            <div key={label} className={cn("px-4 py-2.5 text-center", highlight && "bg-primary/5")}>
                                <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">{label}</p>
                                <p className={cn("text-base font-bold mt-0.5 tabular-nums", highlight ? "text-primary" : "text-foreground")}>
                                    {formatCurrency(value)}
                                </p>
                            </div>
                        ))}
                    </div>
                    {totals.partsTotal > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 border-t border-border/30 bg-muted/20">
                            <RiInformationLine className="h-4 w-4 text-muted-foreground/60" />
                            <p className="text-xs text-muted-foreground/60">18% GST applied on parts only</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
