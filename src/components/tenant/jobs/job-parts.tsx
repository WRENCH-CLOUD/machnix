"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Plus,
  Check,
  Pencil,
  X,
  Scroll,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type JobStatus } from "@/modules/job/domain/job.entity";
import { useInventoryItems } from "@/hooks/queries";
// Using strict types instead of any where possible
import type { Database } from "@/lib/supabase/types";

type EstimateItem = Database["tenant"]["Tables"]["estimate_items"]["Row"];
type EstimateWithRelations = any; // Defining loosely to avoid importing full type chain for dumb component, or import if available

export interface Part {
  id: string; // Temporary ID for UI list
  inventoryItemId?: string; // Links to actual inventory item
  name: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  laborCost: number;
}

interface JobPartsProps {
  estimate: EstimateWithRelations | null;
  estimateItems: EstimateItem[];
  jobStatus: JobStatus;
  onAddItem: (part: Part) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onUpdateItem?: (
    itemId: string,
    updates: { qty?: number; unitPrice?: number; laborCost?: number }
  ) => Promise<void>;
  onGenerateEstimatePdf: () => void;
  // Inventory props
  inventoryItems?: any[];
  loadingInventory?: boolean;
  inventoryError?: any;
}

export function JobParts({
  estimate,
  estimateItems,
  jobStatus,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onGenerateEstimatePdf,
  inventoryItems,
  loadingInventory = false,
  inventoryError,
}: JobPartsProps) {
  // Inventory query moved to parent

  // Local state for new parts being added
  const [parts, setParts] = useState<Part[]>([]);
  // Editing state for estimate items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    qty: number;
    unitPrice: number;
    laborCost: number;
  } | null>(null);

  // Combobox state per part row (keyed by part.id)
  const [openComboboxes, setOpenComboboxes] = useState<Record<string, boolean>>(
    {}
  );

  const isEstimateLocked = jobStatus === "completed";
  const isReady = jobStatus === "ready";

  // Calculations from props
  const partsSubtotal = estimate?.parts_total || 0;
  const laborSubtotal = estimate?.labor_total || 0;
  const subtotal = partsSubtotal + laborSubtotal;
  const tax = estimate?.tax_amount || 0;
  const total = estimate?.total_amount || 0;

  const addPart = () => {
    const newPart: Part = {
      id: `p${Date.now()}`,
      name: "",
      partNumber: "",
      quantity: 1,
      unitPrice: 0,
      laborCost: 0,
    };
    setParts((prev) => [...prev, newPart]);
  };

  const removePart = (partId: string) => {
    setParts((prev) => prev.filter((p) => p.id !== partId));
  };

  const updatePart = <K extends keyof Part>(
    partId: string,
    field: K,
    value: Part[K]
  ) => {
    setParts((prev) =>
      prev.map((part) =>
        part.id === partId ? { ...part, [field]: value } : part
      )
    );
  };

  // Special handler to update multiple fields at once (e.g. from inventory selection)
  const updatePartFromInventory = (
    partId: string,
    inventoryItem: any
  ) => {
    setParts((prev) =>
      prev.map((part) =>
        part.id === partId
          ? {
            ...part,
            inventoryItemId: inventoryItem.id,
            name: inventoryItem.name,
            partNumber: inventoryItem.stockKeepingUnit || "",
            unitPrice: Number(inventoryItem.sellPrice),
            // Reset quantity to 1 when selecting new item
            quantity: 1,
          }
          : part
      )
    );
  };

  const handleAddToEstimate = async (part: Part) => {
    // Edge Case: Validate part existence if it has an inventory ID
    if (part.inventoryItemId && inventoryItems) {
      const exists = inventoryItems.find((i) => i.id === part.inventoryItemId);
      if (!exists) {
        toast.error("Part does not exist in inventory");
        return;
      }
    }

    // Edge Case: Low Stock Warning
    if (part.inventoryItemId && inventoryItems) {
      const item = inventoryItems.find((i) => i.id === part.inventoryItemId);
      if (item && item.stockOnHand <= item.reorderLevel) {
        toast.warning(
          `${item.name} is low on stock (Only ${item.stockOnHand} left)`
        );
      }
    }

    await onAddItem(part);
    removePart(part.id);
  };

  const startEditItem = (item: EstimateItem) => {
    setEditingItemId(item.id);
    setEditValues({
      qty: item.qty,
      unitPrice: Number(item.unit_price),
      laborCost: Number(item.labor_cost) || 0,
    });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditValues(null);
  };

  const saveEdit = async () => {
    if (editingItemId && editValues && onUpdateItem) {
      await onUpdateItem(editingItemId, {
        qty: editValues.qty,
        unitPrice: editValues.unitPrice,
        laborCost: editValues.laborCost,
      });
      cancelEdit();
    }
  };

  const toggleCombobox = (partId: string, open: boolean) => {
    setOpenComboboxes((prev) => ({ ...prev, [partId]: open }));
  };

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="p-6 space-y-6">
        {/* Estimate Lock Status Alerts */}
        {isEstimateLocked && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-500">
              <strong>Estimate Locked:</strong> The job is completed and the
              invoice has been generated. No further modifications to the
              estimate are allowed.
            </AlertDescription>
          </Alert>
        )}

        {isReady && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-500">
              <strong>Final Opportunity:</strong> The job is ready for
              completion. This is your last chance to modify the estimate before
              the invoice is generated.
            </AlertDescription>
          </Alert>
        )}

        {/* Estimate Items (Parts already in estimate) */}
        {estimateItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Estimate Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Header */}
                <div className="grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground px-2">
                  <div className="col-span-3">Item</div>
                  <div className="col-span-2">Part Identity.</div>
                  <div className="col-span-1">Qty</div>
                  <div className="col-span-2">Unit Price</div>
                  <div className="col-span-2">Labor</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Estimate Items List */}
                {estimateItems.map((item) => {
                  const isEditing = editingItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`grid grid-cols-12 gap-3 items-center rounded-lg p-2 ${isEditing
                        ? "bg-blue-500/5 border border-blue-500/20"
                        : "bg-emerald-500/5 border border-emerald-500/20"
                        }`}
                    >
                      <div className="col-span-3">
                        <div className="text-sm font-medium">
                          {item.custom_name}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">
                          {item.custom_part_number || "-"}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {isEditing && editValues ? (
                          <Input
                            type="number"
                            min="1"
                            value={editValues.qty}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                qty: parseInt(e.target.value) || 1,
                              })
                            }
                            className="h-8 text-sm"
                          />
                        ) : (
                          <div className="text-sm">{item.qty}</div>
                        )}
                      </div>
                      <div className="col-span-2">
                        {isEditing && editValues ? (
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                              ₹
                            </span>
                            <Input
                              type="number"
                              value={editValues.unitPrice}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  unitPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="h-8 pl-5 text-sm"
                            />
                          </div>
                        ) : (
                          <div className="text-sm">
                            ₹{Number(item.unit_price).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        {isEditing && editValues ? (
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                              ₹
                            </span>
                            <Input
                              type="number"
                              value={editValues.laborCost}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  laborCost: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="h-8 pl-5 text-sm"
                            />
                          </div>
                        ) : (
                          <div className="text-sm">
                            ₹{Number(item.labor_cost || 0).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 flex gap-1 justify-end">
                        {isEditing ? (
                          <>
                            <Button
                              variant="default"
                              size="icon"
                              className="h-8 w-8"
                              onClick={saveEdit}
                              title="Save changes"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={cancelEdit}
                              title="Cancel editing"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-foreground h-8 w-8"
                              onClick={() => startEditItem(item)}
                              disabled={isEstimateLocked}
                              title={
                                isEstimateLocked
                                  ? "Cannot modify - estimate is locked"
                                  : "Edit item"
                              }
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive h-8 w-8"
                              onClick={() => onRemoveItem(item.id)}
                              disabled={isEstimateLocked}
                              title={
                                isEstimateLocked
                                  ? "Cannot modify - estimate is locked"
                                  : "Remove item"
                              }
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Temporary Parts (Not yet added to estimate) */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Add New Items
              <span className="text-xs font-normal text-muted-foreground ml-2">
                ({loadingInventory ? "Loading..." : inventoryError ? "Error loading" : `${inventoryItems?.length || 0} items available`})
              </span>
            </CardTitle>
            <Button
              size="sm"
              onClick={addPart}
              className="gap-1"
              disabled={isEstimateLocked}
              title={
                isEstimateLocked
                  ? "Cannot add items - estimate is locked"
                  : "Add new item"
              }
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground px-2">
                <div className="col-span-3">Item</div>
                <div className="col-span-2">Part Identity.</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2">Labor</div>
                <div className="col-span-2"></div>
              </div>

              {/* Temporary Parts List */}
              {parts.map((part) => (
                <div
                  key={part.id}
                  className="grid grid-cols-12 gap-3 items-center border border-dashed border-border rounded-lg p-2"
                >
                  <div className="col-span-3">
                    <div className="relative">
                      <Popover
                        open={!!openComboboxes[part.id]}
                        onOpenChange={(open) => toggleCombobox(part.id, open)}
                      >
                        <PopoverAnchor asChild>
                          <div className="relative">
                            <Input
                              placeholder="Type part name..."
                              value={part.name}
                              onChange={(e) => {
                                updatePart(part.id, "name", e.target.value);
                                // If user types, unlink inventory item unless they re-select
                                if (part.inventoryItemId) {
                                  updatePart(
                                    part.id,
                                    "inventoryItemId",
                                    undefined
                                  );
                                }
                                toggleCombobox(part.id, true);
                              }}
                              onFocus={() => toggleCombobox(part.id, true)}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCombobox(part.id, true);
                              }}
                              autoComplete="off"
                              className={cn(
                                "h-9",
                                part.inventoryItemId &&
                                "border-emerald-500 pr-8 ring-emerald-500/20"
                              )}
                              disabled={isEstimateLocked}
                            />
                            {part.inventoryItemId && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Check className="h-4 w-4 text-emerald-500" />
                              </div>
                            )}
                          </div>
                        </PopoverAnchor>
                        <PopoverContent
                          className="w-[300px] p-0"
                          align="start"
                          onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                          <Command shouldFilter={false}>
                            <CommandList>
                              {(() => {
                                const filteredInventory = inventoryItems?.filter(
                                  (item) => {
                                    if (!part.name) return true;
                                    const search = part.name.toLowerCase();
                                    return (
                                      item.name
                                        .toLowerCase()
                                        .includes(search) ||
                                      item.stockKeepingUnit
                                        ?.toLowerCase()
                                        .includes(search)
                                    );
                                  }
                                );

                                if (filteredInventory?.length === 0) {
                                  return (
                                    <CommandEmpty>
                                      No parts found.
                                    </CommandEmpty>
                                  );
                                }

                                return (
                                  <CommandGroup heading="Inventory">
                                    {filteredInventory
                                      ?.slice(0, 50)
                                      .map((item) => (
                                        <CommandItem
                                          key={item.id}
                                          value={`${item.name} ${item.stockKeepingUnit || ""
                                            }`}
                                          onSelect={() => {
                                            updatePartFromInventory(
                                              part.id,
                                              item
                                            );
                                            toggleCombobox(part.id, false);
                                          }}
                                        >
                                          <div className="flex flex-col">
                                            <span>{item.name}</span>
                                            {item.stockKeepingUnit && (
                                              <span className="text-xs text-muted-foreground">
                                                SKU: {item.stockKeepingUnit}
                                              </span>
                                            )}
                                          </div>
                                          <Check
                                            className={cn(
                                              "ml-auto h-4 w-4",
                                              part.inventoryItemId ===
                                                item.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                );
                              })()}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Part #"
                      value={part.partNumber}
                      onChange={(e) =>
                        updatePart(part.id, "partNumber", e.target.value)
                      }
                      className="h-9"
                      disabled={isEstimateLocked}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="1"
                      value={part.quantity || ""}
                      onChange={(e) =>
                        updatePart(
                          part.id,
                          "quantity",
                          Number.parseInt(e.target.value) || 1
                        )
                      }
                      className="h-9"
                      disabled={isEstimateLocked}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        ₹
                      </span>
                      <Input
                        type="number"
                        className="pl-7 h-9"
                        value={part.unitPrice === 0 ? "" : part.unitPrice}
                        onChange={(e) =>
                          updatePart(
                            part.id,
                            "unitPrice",
                            Number.parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                        disabled={isEstimateLocked}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        ₹
                      </span>
                      <Input
                        type="number"
                        className="pl-7 h-9"
                        value={part.laborCost === 0 ? "" : part.laborCost}
                        onChange={(e) =>
                          updatePart(
                            part.id,
                            "laborCost",
                            Number.parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                        disabled={isEstimateLocked}
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex gap-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 h-9"
                      onClick={() => handleAddToEstimate(part)}
                      disabled={
                        !part.name || part.quantity <= 0 || isEstimateLocked
                      }
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Add to Estimate
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-9 w-9"
                      onClick={() => removePart(part.id)}
                      disabled={isEstimateLocked}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {parts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Click "Add Item" to add parts to this job
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parts Subtotal</span>
                  <span>₹{partsSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Labor Subtotal</span>
                  <span>₹{laborSubtotal.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span>₹{tax.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-end items-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={onGenerateEstimatePdf}
                  disabled={!estimate || estimateItems.length === 0}
                >
                  <Scroll className="w-3 h-3" />
                  Generate Estimate PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
