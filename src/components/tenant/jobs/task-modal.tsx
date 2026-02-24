"use client";

import { useState, useEffect, useMemo } from "react";
import { Package, Check, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [qty, setQty] = useState(1);
  const [showInEstimate, setShowInEstimate] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(false);

  // Populate when editing
  useEffect(() => {
    if (!isOpen) return;

    setTaskName(initialData?.taskName || "");
    setDescription(initialData?.description || "");
    setLaborCost(
      initialData?.laborCostSnapshot !== undefined
        ? String(initialData.laborCostSnapshot)
        : "",
    );
    setQty(initialData?.qty || 1);
    setShowInEstimate(initialData?.showInEstimate ?? true);

    if (initialInventoryItem) {
      setSelectedItem({
        ...initialInventoryItem,
        sellPrice: initialInventoryItem.sellPrice ?? 0,
        unitCost: initialInventoryItem.unitCost ?? 0,
      } as InventoryItem);
      setInventorySearch(initialInventoryItem.name);
    } else {
      setSelectedItem(null);
      setInventorySearch("");
    }
  }, [isOpen, initialData, initialInventoryItem]);

  const searchResults = useMemo(() => {
    if (!searchInventory || !inventorySearch.trim()) return [];
    return searchInventory(inventorySearch.trim(), 5);
  }, [inventorySearch, searchInventory]);

  const handleSubmit = () => {
    if (!taskName.trim()) return;

    const hasPart = selectedItem && qty > 0;

    const payload: CreateTaskInput = {
      taskName: taskName.trim(),
      description: description.trim() || undefined,
      actionType: hasPart ? "REPLACED" : "LABOR_ONLY",
      laborCostSnapshot: laborCost ? parseFloat(laborCost) : 0,
      showInEstimate,
    };

    if (hasPart) {
      payload.inventoryItemId = selectedItem.id;
      payload.qty = qty;
      payload.unitPriceSnapshot =
        selectedItem.sellPrice ?? selectedItem.unitCost ?? 0;
      payload.taxRateSnapshot = 18;
    }

    onSubmit(payload);
  };

  const canSubmit = taskName.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Task" : "Edit Task"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">

          {/* BASIC INFO */}
          <div className="space-y-3">
            <div>
              <Label>Task Name *</Label>
              <Input
                className="mt-2"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Check brake pads"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-2"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <Label>Labor Cost (₹)</Label>
              <Input
                className="mt-2"
                type="number"
                min={0}
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* PART SECTION */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-md font-medium">
              <Package className="h-4 w-4" />
              Add Part (Optional)
            </Label>

            <Input
              placeholder="Search inventory..."
              value={inventorySearch}
              onChange={(e) => {
                setInventorySearch(e.target.value);
                setSelectedItem(null);
                setOpenDropdown(true);
              }}
              onFocus={() => setOpenDropdown(true)}
              onBlur={() => setTimeout(() => setOpenDropdown(false), 150)}
            />

            {openDropdown && searchResults.length > 0 && (
              <div className="border rounded-md bg-background shadow-sm max-h-48 overflow-y-auto">
                {searchResults.map((item: InventoryItem) => (
                  <div
                    key={item.id}
                    className="px-3 py-2 text-md hover:bg-muted cursor-pointer"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSelectedItem(item);
                      setInventorySearch(item.name);
                      setQty(1);
                      setOpenDropdown(false);
                    }}
                  >
                    {item.name}
                    <div className="text-sm text-muted-foreground">
                      {getStockAvailable(item)} available
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedItem && (
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={getStockAvailable(selectedItem)}
                  value={qty}
                  onChange={(e) =>
                    setQty(parseInt(e.target.value) || 1)
                  }
                />

                {qty > getStockAvailable(selectedItem) && (
                  <p className="text-sm text-destructive flex gap-1 items-center">
                    <AlertTriangle className="h-3 w-3" />
                    Only {getStockAvailable(selectedItem)} available
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ESTIMATE TOGGLE */}
          <div className="flex items-center justify-between">
            <Label className="text-md">
              Include in customer estimate
            </Label>
            <Switch
              checked={showInEstimate}
              onCheckedChange={setShowInEstimate}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
          >
            {isLoading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {mode === "add" ? "Add Task" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}