"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Package,
    Check,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CreateTaskInput } from "@/hooks/use-job-tasks";
import type { TaskActionType } from "@/modules/job/domain/task.entity";
import type { InventoryItem } from "@/modules/inventory/domain/inventory.entity";
import { getStockAvailable } from "@/modules/inventory/domain/inventory.entity";

// ============================================================================
// Props Interface
// ============================================================================

export interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTaskInput) => void;
    isLoading?: boolean;
    initialData?: Partial<CreateTaskInput> & { showInEstimate?: boolean };
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

// ============================================================================
// TaskModal Component
// ============================================================================

export function TaskModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    initialData,
    initialInventoryItem,
    searchInventory,
    mode,
}: TaskModalProps) {
    const [taskName, setTaskName] = useState(initialData?.taskName || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [inventorySearch, setInventorySearch] = useState("");
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [qty, setQty] = useState(initialData?.qty || 1);
    const [laborCost, setLaborCost] = useState(initialData?.laborCostSnapshot || 0);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [showInEstimate, setShowInEstimate] = useState(initialData?.showInEstimate ?? true);

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
            setShowInEstimate(initialData?.showInEstimate ?? true);
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
            showInEstimate,
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
            <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
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

                    {/* Show in Estimate toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                        <Label htmlFor="showInEstimate" className="flex flex-col gap-1 cursor-pointer">
                            <span className="text-sm font-medium">Show in Estimate</span>
                            <span className="text-xs text-muted-foreground font-normal">
                                Include this task in the customer estimate
                            </span>
                        </Label>
                        <Switch
                            id="showInEstimate"
                            checked={showInEstimate}
                            onCheckedChange={setShowInEstimate}
                        />
                    </div>
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
