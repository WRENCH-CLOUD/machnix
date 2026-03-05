"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
    Autocomplete,
    AutocompleteContent,
    AutocompleteInput,
    AutocompleteItem,
    AutocompleteList,
} from "@/components/ui/autocomplete";
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
                                <Autocomplete
                                    items={searchResults}
                                    value={inventorySearch}
                                    onValueChange={(val: any) => {
                                        if (typeof val === 'string') {
                                            setInventorySearch(val);
                                            if (selectedItem) {
                                                setSelectedItem(null);
                                            }
                                        } else if (val) {
                                            setSelectedItem(val);
                                            setInventorySearch(val.name);
                                            setQty(1);
                                        }
                                    }}
                                    itemToStringValue={(item: any) => item?.name || ""}
                                    filter={null}
                                >
                                    <div className="relative">
                                        <AutocompleteInput
                                            placeholder="Search parts to auto-fill..."
                                            className={cn(
                                                "pr-8",
                                                selectedItem && "border-emerald-500 ring-emerald-500/20"
                                            )}
                                        />
                                        {selectedItem && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                            </div>
                                        )}
                                    </div>

                                    <AutocompleteContent align="start" className="w-[340px] p-0 shadow-xl border-border/60" showBackdrop={false}>
                                        <div className="max-h-56">
                                            {searchResults.length > 0 ? (
                                                <AutocompleteList className="p-1.5 space-y-0.5">
                                                    {(item: any) => {
                                                        const avail = getStockAvailable(item);
                                                        const outOfStock = avail <= 0;
                                                        return (
                                                            <AutocompleteItem
                                                                key={item.id}
                                                                value={item}
                                                                disabled={outOfStock}
                                                                onClick={() => {
                                                                    if (outOfStock) return;
                                                                    setSelectedItem(item);
                                                                    setInventorySearch(item.name);
                                                                    setQty(1);
                                                                }}
                                                                className={cn(
                                                                    "w-full text-left rounded-lg px-4 py-2.5 text-base transition-colors cursor-pointer",
                                                                    selectedItem?.id === item.id ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/70",
                                                                    outOfStock && "opacity-40 cursor-not-allowed hover:bg-transparent"
                                                                )}
                                                            >
                                                                <div className="flex items-start justify-between gap-3 w-full">
                                                                    <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                                                                        <p className="font-medium truncate text-left">{item.name}</p>
                                                                        {item.stockKeepingUnit && (
                                                                            <p className="text-sm text-muted-foreground mt-0.5">SKU: {item.stockKeepingUnit}</p>
                                                                        )}
                                                                        <span className={cn(
                                                                            "text-xs mt-1",
                                                                            avail > 0 ? "text-emerald-500" : "text-red-500"
                                                                        )}>
                                                                            {avail > 0 ? `${avail} available` : "Out of stock"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="shrink-0 text-right">
                                                                        <p className="text-sm font-semibold">₹{item.sellPrice?.toFixed(2)}</p>
                                                                        {selectedItem?.id === item.id && (
                                                                            <Check className="h-4 w-4 ml-auto mt-2 text-emerald-500" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </AutocompleteItem>
                                                        );
                                                    }}
                                                </AutocompleteList>
                                            ) : inventorySearch.trim() ? (
                                                <div className="py-10 text-center text-sm text-muted-foreground">No parts found.</div>
                                            ) : (
                                                <div className="py-10 text-center text-sm text-muted-foreground">Type to search inventory</div>
                                            )}
                                        </div>
                                    </AutocompleteContent>
                                </Autocomplete>
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
