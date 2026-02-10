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
import { type JobStatus } from "@/modules/job/domain/job.entity";
// Using strict types instead of any where possible
import type { Database } from "@/lib/supabase/types";

type EstimateItem = Database["tenant"]["Tables"]["estimate_items"]["Row"];
type EstimateWithRelations = any; // Defining loosely to avoid importing full type chain for dumb component, or import if available

export interface Part {
  id: string;
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
  onUpdateItem?: (itemId: string, updates: { qty?: number; unitPrice?: number; laborCost?: number }) => Promise<void>;
  onGenerateEstimatePdf: () => void;
}

export function JobParts({
  estimate,
  estimateItems,
  jobStatus,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onGenerateEstimatePdf,
}: JobPartsProps) {
  // Local state for new parts being added
  const [parts, setParts] = useState<Part[]>([]);
  // Editing state for estimate items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ qty: number; unitPrice: number; laborCost: number } | null>(null);

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

  const updatePart = (
    partId: string,
    field: keyof Part,
    value: string | number
  ) => {
    setParts((prev) =>
      prev.map((part) =>
        part.id === partId ? { ...part, [field]: value } : part
      )
    );
  };

  const handleAddToEstimate = async (part: Part) => {
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
                      className={`grid grid-cols-12 gap-3 items-center rounded-lg p-2 ${
                        isEditing 
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
                            onChange={(e) => setEditValues({
                              ...editValues,
                              qty: parseInt(e.target.value) || 1
                            })}
                            className="h-8 text-sm"
                          />
                        ) : (
                          <div className="text-sm">{item.qty}</div>
                        )}
                      </div>
                      <div className="col-span-2">
                        {isEditing && editValues ? (
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                            <Input
                              type="number"
                              value={editValues.unitPrice}
                              onChange={(e) => setEditValues({
                                ...editValues,
                                unitPrice: parseFloat(e.target.value) || 0
                              })}
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
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                            <Input
                              type="number"
                              value={editValues.laborCost}
                              onChange={(e) => setEditValues({
                                ...editValues,
                                laborCost: parseFloat(e.target.value) || 0
                              })}
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
                    <Input
                      placeholder="Part name"
                      value={part.name}
                      onChange={(e) =>
                        updatePart(part.id, "name", e.target.value)
                      }
                      className="h-9"
                      disabled={isEstimateLocked}
                    />
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
