"use client";

import { CreditCard, Download, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type UIJob } from "@/modules/job/application/job-transforms-service";

interface JobInvoiceProps {
  job: UIJob;
  invoice: any; // Using any for simplicity for now, ideally InvoiceWithRelations
  estimateItems: any[];
  loading: boolean;
  onGenerateInvoice: () => void;
  onRetry: () => void;
  onMarkPaid: () => void;
  onGeneratePdf: () => void;
}

export function JobInvoice({
  job,
  invoice,
  estimateItems,
  loading,
  onRetry,
  onMarkPaid,
  onGeneratePdf,
  onGenerateInvoice,
}: JobInvoiceProps) {
  // Calculations
  const partsSubtotal = estimateItems.reduce(
    (acc, item) => acc + item.qty * item.unit_price,
    0
  );
  const laborSubtotal = estimateItems.reduce(
    (acc, item) => acc + (item.labor_cost || 0),
    0
  );
  const subtotal = partsSubtotal + laborSubtotal;
  const tax = subtotal * 0.18; // Approximate
  const total = subtotal + tax;

  // Use invoice values if available
  const finalTotal = invoice?.total_amount || total;
  const finalTax = invoice?.tax_amount || tax;
  const finalParts = invoice?.parts_total || partsSubtotal;
  const finalLabor = invoice?.labor_total || laborSubtotal;
  const paidAmount = invoice?.paid_amount || 0;

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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                <Button size="sm" onClick={onGenerateInvoice}>
                  Generate Invoice
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Invoice Preview */}
            <Card className="bg-white text-black">
              <CardContent className="p-8">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      INVOICE
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
                    <h3 className="font-bold text-gray-900">Garage A</h3>
                    <p className="text-sm text-gray-600">
                      {/*TODO: {tenant.address} which is not there and need to create @sagun-py0909 */}
                    </p>
                    <p className="text-sm text-gray-600">
                      {/*TODO: need to create GSTIN for tenant */}
                    </p>
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
                    <div className="flex justify-between text-gray-600">
                      <span>GST (18%)</span>
                      <span>₹{finalTax.toLocaleString()}</span>
                    </div>
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
                disabled={!invoice || loading || invoice.status === "paid"}
                onClick={onMarkPaid}
              >
                <Check className="w-4 h-4" />
                {invoice?.status === "paid" ? "Already Paid" : "Mark Paid"}
              </Button>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
