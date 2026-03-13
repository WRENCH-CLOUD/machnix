"use client";

import { CreditCard, Download, Check, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UIJob } from "@/modules/job/application/job-transforms-service";
import {
  InvoicePrintDocument,
  type InvoicePrintData,
  type InvoiceTemplateVariant,
} from "./invoice-print-document";

interface JobInvoiceProps {
  tenantDetails: {
    name: string;
    address: string;
    gstin: string;
  };
  job: UIJob;
  invoice: any; // Using any for simplicity for now, ideally InvoiceWithRelations
  estimateItems: any[];
  loading: boolean;
  // GST and discount controls
  isGstBilled?: boolean;
  onGstToggle?: (value: boolean) => void;
  discountPercentage?: number;
  onDiscountChange?: (value: number) => void;
  onGenerateInvoice: () => void;
  onRetry: () => void;
  onMarkPaid: () => void;
  onGeneratePdf: () => void;
  invoicePrintData: InvoicePrintData;
  resolvedInvoiceTemplate: InvoiceTemplateVariant;
}

export function JobInvoice({
  job,
  invoice,
  estimateItems,
  loading,
  isGstBilled = true,
  onGstToggle,
  discountPercentage = 0,
  onDiscountChange,
  onRetry,
  onMarkPaid,
  onGeneratePdf,
  invoicePrintData,
  resolvedInvoiceTemplate,
  onGenerateInvoice,
}: JobInvoiceProps) {
  // Local string state so the input can be emptied without snapping back to "0"
  const [discountInput, setDiscountInput] = useState(() =>
    discountPercentage > 0 ? String(discountPercentage) : ""
  );

  // Check if editing is allowed (only locked when job is completed)
  const isCompleted = job.status === "completed";
  const canEdit = !isCompleted;

  // Calculations for preview (before invoice is generated)
  const partsSubtotal = estimateItems.reduce(
    (acc, item) => acc + item.qty * item.unit_price,
    0
  );
  const laborSubtotal = estimateItems.reduce(
    (acc, item) => acc + (item.labor_cost || 0),
    0
  );
  const subtotal = partsSubtotal + laborSubtotal;

  // Calculate based on current toggle state (for preview)
  const previewDiscountAmount = subtotal * (discountPercentage / 100);
  const previewTaxableAmount = subtotal - previewDiscountAmount;
  const previewTax = isGstBilled ? previewTaxableAmount * 0.18 : 0;
  const previewTotal = previewTaxableAmount + previewTax;

  // GST/Discount controls component - reused in both pre and post invoice states
  const GstDiscountControls = () => (
    <div className="space-y-4">
      {/* GST Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div className="space-y-0.5">
          <Label htmlFor="gst-toggle" className="font-medium">
            GST Invoice
          </Label>
          <p className="text-xs text-muted-foreground">
            {isGstBilled ? "Tax Invoice (18% GST)" : "Bill of Supply (No GST)"}
          </p>
        </div>
        <Switch
          id="gst-toggle"
          checked={isGstBilled}
          onCheckedChange={onGstToggle}
          disabled={!canEdit}
        />
      </div>

      {/* Discount Percentage */}
      <div className="p-3 rounded-lg border bg-card space-y-2">
        <Label htmlFor="discount-input" className="font-medium">
          Discount (%)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="discount-input"
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={discountInput}
            onChange={(e) => {
              setDiscountInput(e.target.value);
              onDiscountChange?.(parseFloat(e.target.value) || 0);
            }}
            className="w-24"
            disabled={!canEdit}
          />
          <span className="text-sm text-muted-foreground">
            {discountPercentage > 0
              ? `Saves ₹${previewDiscountAmount.toLocaleString()}`
              : "No discount"}
          </span>
        </div>
      </div>

      {/* Preview Summary */}
      <div className="p-3 rounded-lg border bg-muted/50 space-y-1">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>
        {discountPercentage > 0 && (
          <div className="flex justify-between text-sm text-amber-600">
            <span>Discount ({discountPercentage}%)</span>
            <span>-₹{previewDiscountAmount.toLocaleString()}</span>
          </div>
        )}
        {isGstBilled && (
          <div className="flex justify-between text-sm">
            <span>GST (18%)</span>
            <span>₹{previewTax.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold pt-1 border-t">
          <span>Total</span>
          <span>₹{previewTotal.toLocaleString()}</span>
        </div>
      </div>

      {isCompleted && (
        <p className="text-xs text-muted-foreground text-center italic">
          Invoice is locked because job is completed
        </p>
      )}
    </div>
  );

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                Loading invoice...
              </p>
            </div>
          </div>
        ) : !invoice ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="text-center space-y-2">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                {job.status === "ready" || job.status === "completed"
                  ? "Invoice has not been generated yet."
                  : "Invoice will be created when status is Ready."}
              </p>
            </div>
            {(job.status === "ready" || job.status === "completed") && (
              <div className="w-full max-w-md space-y-4">
                <GstDiscountControls />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  <Button
                    size="sm"
                    onClick={onGenerateInvoice}
                    className="flex-1"
                    disabled={isCompleted}
                  >
                    Generate Invoice
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Settings Panel - Show only when job is not completed */}
            {canEdit && (
              <div className="max-w-md mx-auto mb-6">
                <GstDiscountControls />
              </div>
            )}

            <Card className="bg-card">
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    Active template: <span className="font-semibold text-foreground capitalize">{resolvedInvoiceTemplate}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Managed in Settings
                  </span>
                </div>

                <div className="invoice-print-root">
                  <InvoicePrintDocument
                    data={invoicePrintData}
                    variant={resolvedInvoiceTemplate}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={onGeneratePdf}
              >
                <Download className="w-4 h-4" />
                Print
              </Button>
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                disabled={!invoice || loading || (invoice.status === "paid" && job.status === "completed")}
                onClick={onMarkPaid}
              >
                <Check className="w-4 h-4" />
                {invoice?.status === "paid" ? "Complete Job" : "Mark Paid"}
              </Button>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
