"use client";

import { CreditCard, Download, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UIJob } from "@/modules/job/application/job-transforms-service";

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
}

export function JobInvoice({
  tenantDetails,
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
  onGenerateInvoice,
}: JobInvoiceProps) {
  
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

  // Use invoice values if available (after generation)
  const hasInvoice = Boolean(invoice);
  const invoiceIsGstBilled = invoice?.is_gst_billed ?? true;
  const invoiceDiscountPercentage = invoice?.discount_percentage ?? 0;
  const finalDiscount = invoice?.discount_amount ?? previewDiscountAmount;
  const finalTax = invoice?.tax_amount ?? previewTax;
  const finalTotal = invoice?.total_amount ?? previewTotal;
  const finalParts = invoice?.parts_total ?? partsSubtotal;
  const finalLabor = invoice?.labor_total ?? laborSubtotal;
  const paidAmount = invoice?.paid_amount ?? 0;

  // Use invoice values or current toggle state
  // Show GST line only if GST is enabled AND tax amount > 0
  const showGst = hasInvoice
    ? (invoiceIsGstBilled && finalTax > 0)
    : (isGstBilled && previewTax > 0);
  // Show discount line only if discount > 0
  const showDiscount = hasInvoice
    ? finalDiscount > 0
    : discountPercentage > 0;

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
            value={discountPercentage}
            onChange={(e) => onDiscountChange?.(parseFloat(e.target.value) || 0)}
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

            {/* Invoice Preview */}
            <Card className="bg-white text-black">
              <CardContent className="p-8">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {showGst ? "TAX INVOICE" : "BILL OF SUPPLY"}
                    </h2>
                    <p className="text-gray-600">
                      {invoice.invoice_number || job.jobNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      Date:{" "}
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-gray-900">{tenantDetails.name}</h3>
                    <p className="text-sm text-gray-600">
                      {tenantDetails.address}
                    </p>
                    {showGst && (
                      <p className="text-sm text-gray-600">
                        GSTIN: {tenantDetails.gstin}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bill To */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">
                      BILL TO
                    </h4>
                    <p className="font-semibold text-gray-900">
                      {job.customer?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {job.customer?.phone}
                    </p>
                    <p className="text-sm text-gray-600">
                      {job.customer?.email}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">
                      VEHICLE
                    </h4>
                    <p className="font-semibold text-gray-900">
                      {job.vehicle?.year} {job.vehicle?.make}{" "}
                      {job.vehicle?.model}
                    </p>
                    <p className="text-sm text-gray-600 font-mono">
                      {job.vehicle?.regNo}
                    </p>
                  </div>
                </div>

                {/* Line Items */}
                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2 text-sm font-semibold text-gray-500">
                        Description
                      </th>
                      <th className="text-right py-2 text-sm font-semibold text-gray-500">
                        Qty
                      </th>
                      <th className="text-right py-2 text-sm font-semibold text-gray-500">
                        Rate
                      </th>
                      <th className="text-right py-2 text-sm font-semibold text-gray-500">
                        Labor
                      </th>
                      <th className="text-right py-2 text-sm font-semibold text-gray-500">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimateItems.map((item) => {
                      const partsAmount = item.qty * item.unit_price;
                      const laborAmount = item.labor_cost || 0;
                      const lineTotal = partsAmount + laborAmount;

                      return (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3">
                            <p className="font-medium text-gray-900">
                              {item.custom_name}
                            </p>
                            {item.custom_part_number && (
                              <p className="text-xs text-gray-500">
                                {item.custom_part_number}
                              </p>
                            )}
                          </td>
                          <td className="text-right py-3 text-gray-600">
                            {item.qty}
                          </td>
                          <td className="text-right py-3 text-gray-600">
                            ₹{item.unit_price.toLocaleString()}
                          </td>
                          <td className="text-right py-3 text-gray-600">
                            {laborAmount > 0
                              ? `₹${laborAmount.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="text-right py-3 font-medium text-gray-900">
                            ₹{lineTotal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Parts</span>
                      <span>₹{finalParts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Labor</span>
                      <span>₹{finalLabor.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-200">
                      <span>Subtotal</span>
                      <span>₹{(finalParts + finalLabor).toLocaleString()}</span>
                    </div>
                    {showDiscount && (
                      <div className="flex justify-between text-amber-600">
                        <span>Discount ({invoiceDiscountPercentage || discountPercentage}%)</span>
                        <span>-₹{finalDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    {showGst && (
                      <div className="flex justify-between text-gray-600">
                        <span>GST (18%)</span>
                        <span>₹{finalTax.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t-2 border-gray-200">
                      <span>Total</span>
                      <span>₹{finalTotal.toLocaleString()}</span>
                    </div>
                    {paidAmount > 0 && (
                      <>
                        <div className="flex justify-between text-emerald-600">
                          <span>Paid</span>
                          <span>₹{Number(paidAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-amber-600 pt-2 border-t border-gray-200">
                          <span>Balance Due</span>
                          <span>
                            ₹{(finalTotal - paidAmount).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
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
                Generate PDF
              </Button>
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                disabled={loading || (invoice.status === "paid" && job.status === "completed")}
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
