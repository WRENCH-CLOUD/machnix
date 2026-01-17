"use client";

import { useState } from "react";
import { JobDetailsDialog } from "@/components/tenant/jobs/job-details-dialog";
import { type UIJob } from "@/modules/job/application/job-transforms-service";
import { toast } from "sonner";
import { type JobStatus } from "@/modules/job/domain/job.entity";
import {
  useTenantSettings,
  useEstimateByJob,
  useInvoiceByJob,
  useAddEstimateItem,
  useRemoveEstimateItem,
  useUpdateEstimateItem,
  useGenerateInvoice,
  useRecordPayment,
  useUpdateJobStatus,
  transformTenantSettingsForJobDetails,
} from "@/hooks/queries";

interface JobDetailsContainerProps {
  job: UIJob;
  isOpen: boolean;
  onClose: () => void;
  onJobUpdate?: () => void;
  currentUser?: { role?: string };
  tenantDetails?: {
    name: string;
    address: string;
    gstin: string;
  };
}

export function JobDetailsContainer({
  job,
  isOpen,
  onClose,
  onJobUpdate,
  currentUser,
  tenantDetails: tenantDetailsProp,
}: JobDetailsContainerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Determine mechanic mode based on user role
  const isMechanicMode = currentUser?.role === "mechanic";

  // React Query hooks for data fetching
  const { data: tenantSettings } = useTenantSettings();
  const tenantDetails = tenantDetailsProp || transformTenantSettingsForJobDetails(tenantSettings);

  const { data: estimate, refetch: refetchEstimate } = useEstimateByJob(
    job.id,
    {
      jobNumber: job.jobNumber,
      customerId: job.customer.id,
      vehicleId: job.vehicle.id,
    }
  );
  const estimateItems = estimate?.estimate_items || [];

  const { data: invoice, isLoading: loadingInvoice, refetch: refetchInvoice } = useInvoiceByJob(job.id);

  // Mutations
  const addItemMutation = useAddEstimateItem(job.id);
  const removeItemMutation = useRemoveEstimateItem(job.id);
  const updateItemMutation = useUpdateEstimateItem(job.id);
  const generateInvoiceMutation = useGenerateInvoice(job.id);
  const recordPaymentMutation = useRecordPayment(job.id);
  const updateStatusMutation = useUpdateJobStatus(job.id);

  // Handlers
  const handleAddEstimateItem = async (part: {
    name: string;
    partNumber?: string;
    quantity: number;
    unitPrice: number;
    laborCost?: number;
  }) => {
    if (!estimate) return;

    try {
      await addItemMutation.mutateAsync({
        estimateId: estimate.id,
        item: part,
      });
      toast.success("Item added to estimate");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    }
  };

  const handleRemoveEstimateItem = async (itemId: string) => {
    try {
      await removeItemMutation.mutateAsync(itemId);
      toast.success("Item removed");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const handleUpdateEstimateItem = async (
    itemId: string,
    updates: { qty?: number; unitPrice?: number; laborCost?: number }
  ) => {
    try {
      await updateItemMutation.mutateAsync({ itemId, updates });
      toast.success("Item updated");
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleGenerateInvoicePdf = () => {
    if (!invoice) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const partsSubtotal = estimateItems.reduce(
      (acc: number, item: { qty: number; unit_price: number }) => acc + item.qty * item.unit_price,
      0
    );
    const laborSubtotal = estimateItems.reduce(
      (acc: number, item: { labor_cost?: number }) => acc + (item.labor_cost || 0),
      0
    );
    const subtotal = partsSubtotal + laborSubtotal;
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const customerName = job.customer?.name ?? "";
    const customerPhone = job.customer?.phone ?? "";
    const customerEmail = job.customer?.email ?? "";
    const vehicleTitle = `${job.vehicle?.year ?? ""} ${
      job.vehicle?.make ?? ""
    } ${job.vehicle?.model ?? ""}`.trim();
    const vehicleReg = job.vehicle?.regNo ?? "";

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${job.jobNumber}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .header-left .title { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
          .header-right { text-align: right; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .section-title { font-weight: bold; margin-bottom: 10px; color: #666; font-size: 12px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border-bottom: 1px solid #ddd; padding: 12px 8px; text-align: left; }
          th { background-color: #f8f8f8; font-weight: bold; border-bottom: 2px solid #333; }
          .text-right { text-align: right; }
          .totals { margin-left: auto; width: 350px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-final { font-weight: bold; font-size: 22px; border-top: 2px solid #000; padding-top: 15px; margin-top: 10px; }
          .paid { color: #059669; }
          .balance { color: #d97706; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <div class="title">INVOICE</div>
            <div>${invoice.invoice_number || job.jobNumber}</div>
            <div style="font-size: 12px; color: #666;">Date: ${
              invoice.invoice_date 
                ? new Date(invoice.invoice_date).toLocaleDateString() 
                : new Date().toLocaleDateString()
            }</div>
          </div>
          <div class="header-right">
            <div style="font-weight: bold; font-size: 18px;">${tenantDetails.name || 'Garage'}</div>
            <div style="font-size: 12px;">${tenantDetails.address || ''}</div>
            ${tenantDetails.gstin ? `<div style="font-size: 12px;">GSTIN: ${tenantDetails.gstin}</div>` : ''}
          </div>
        </div>
        
        <div class="info">
          <div>
            <div class="section-title">Bill To</div>
            <div style="font-weight: bold; font-size: 16px;">${customerName}</div>
            <div style="font-size: 14px;">${customerPhone}</div>
            <div style="font-size: 14px;">${customerEmail}</div>
          </div>
          <div>
            <div class="section-title">Vehicle</div>
            <div style="font-weight: bold; font-size: 16px;">${vehicleTitle}</div>
            <div style="font-size: 14px; font-family: monospace;">${vehicleReg}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Labor</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${estimateItems
              .map((item: { custom_name: string; custom_part_number?: string; qty: number; unit_price: number; labor_cost?: number }) => {
                const partsAmount = item.qty * item.unit_price;
                const laborAmount = item.labor_cost || 0;
                const lineTotal = partsAmount + laborAmount;
                const partNumber =
                  item.custom_part_number && item.custom_part_number !== ""
                    ? `<div style="font-size: 11px; color: #666;">${item.custom_part_number}</div>`
                    : "";

                return `
                  <tr>
                    <td>
                      <div style="font-weight: 500;">${item.custom_name}</div>
                      ${partNumber}
                    </td>
                    <td class="text-right">${item.qty}</td>
                    <td class="text-right">₹${item.unit_price.toLocaleString()}</td>
                    <td class="text-right">${
                      laborAmount > 0
                        ? "₹" + laborAmount.toLocaleString()
                        : "-"
                    }</td>
                    <td class="text-right" style="font-weight: 500;">₹${lineTotal.toLocaleString()}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Parts:</span>
            <span>₹${partsSubtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>Labor:</span>
            <span>₹${laborSubtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row" style="padding-top: 10px; border-top: 1px solid #ddd;">
            <span>Subtotal:</span>
            <span>₹${subtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>GST (18%):</span>
            <span>₹${tax.toLocaleString()}</span>
          </div>
          <div class="totals-row total-final">
            <span>Total:</span>
            <span>₹${total.toLocaleString()}</span>
          </div>
          ${
            invoice.paid_amount > 0
              ? `
            <div class="totals-row paid" style="padding-top: 10px; border-top: 1px solid #ddd;">
              <span>Paid:</span>
              <span>₹${Number(invoice.paid_amount).toLocaleString()}</span>
            </div>
            <div class="totals-row balance" style="font-weight: bold; font-size: 18px;">
              <span>Balance Due:</span>
              <span>₹${(total - invoice.paid_amount).toLocaleString()}</span>
            </div>
          `
              : ""
          }
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(pdfContent);
    printWindow.document.close();
  };

  const handleGenerateEstimatePdf = () => {
    if (!estimate || estimateItems.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const partsSubtotal =
      estimate.parts_total ??
      estimateItems.reduce(
        (acc: number, item: { qty: number; unit_price: number }) => acc + item.qty * item.unit_price,
        0
      );
    const laborSubtotal =
      estimate.labor_total ??
      estimateItems.reduce(
        (acc: number, item: { labor_cost?: number }) => acc + (item.labor_cost || 0),
        0
      );
    const subtotal = estimate.subtotal ?? partsSubtotal + laborSubtotal;
    const tax = estimate.tax_amount ?? subtotal * 0.18;
    const total = estimate.total_amount ?? subtotal + tax;

    const customerName = job.customer?.name ?? "";
    const customerPhone = job.customer?.phone ?? "";
    const customerEmail = job.customer?.email ?? "";
    const vehicleTitle = `${job.vehicle?.year ?? ""} ${
      job.vehicle?.make ?? ""
    } ${job.vehicle?.model ?? ""}`.trim();
    const vehicleReg = job.vehicle?.regNo ?? "";

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Estimate - ${job.jobNumber}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .info { margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .text-right { text-align: right; }
          .totals { margin-left: auto; width: 350px; margin-top: 20px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-final { font-weight: bold; font-size: 20px; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ESTIMATE</div>
          <div>Estimate #: ${estimate.estimate_number || job.jobNumber}</div>
          <div>Date: ${new Date().toLocaleDateString()}</div>
        </div>
        
        <div class="info">
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div>Name: ${customerName}</div>
            <div>Phone: ${customerPhone}</div>
            <div>Email: ${customerEmail}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Vehicle Information</div>
            <div>${vehicleTitle}</div>
            <div>Registration: ${vehicleReg}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Part Number</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Labor</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${estimateItems
              .map((item: { custom_name: string; custom_part_number?: string; qty: number; unit_price: number; labor_cost?: number }) => {
                const partsAmount = item.qty * item.unit_price;
                const laborAmount = item.labor_cost || 0;
                const lineTotal = partsAmount + laborAmount;
                const partNumber =
                  item.custom_part_number && item.custom_part_number !== ""
                    ? item.custom_part_number
                    : "-";
                return `
                  <tr>
                    <td>${item.custom_name}</td>
                    <td>${partNumber}</td>
                    <td class="text-right">${item.qty}</td>
                    <td class="text-right">₹${item.unit_price.toLocaleString()}</td>
                    <td class="text-right">${
                      laborAmount > 0
                        ? "₹" + laborAmount.toLocaleString()
                        : "-"
                    }</td>
                    <td class="text-right">₹${lineTotal.toLocaleString()}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Parts Subtotal:</span>
            <span>₹${partsSubtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>Labor Subtotal:</span>
            <span>₹${laborSubtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>₹${subtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>GST (18%):</span>
            <span>₹${tax.toLocaleString()}</span>
          </div>
          <div class="totals-row total-final">
            <span>Total:</span>
            <span>₹${total.toLocaleString()}</span>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(pdfContent);
    printWindow.document.close();
  };

  const handleRetryInvoice = () => {
    refetchInvoice();
  };

  const handleMarkPaid = () => {
    setShowPaymentModal(true);
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    try {
      await updateStatusMutation.mutateAsync(newStatus);
      toast.success(`Job status updated to ${newStatus}`);
      onJobUpdate?.();

      // If status changed to ready, attempt to auto-generate invoice
      if (newStatus === "ready" && estimate) {
        await handleGenerateInvoice();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update job status");
    }
  };

  const handleGenerateInvoice = async () => {
    if (!estimate) {
      toast.error("Cannot generate invoice: Estimate not found");
      return;
    }

    try {
      await generateInvoiceMutation.mutateAsync({ estimateId: estimate.id });
      toast.success("Invoice generated");
    } catch (error) {
      console.error("Error generating invoice:", error);
    }
  };

  const handlePaymentComplete = async (method: string) => {
    if (!invoice) return;

    try {
      // 1. Record Payment
      await recordPaymentMutation.mutateAsync({
        invoiceId: invoice.id,
        amount: invoice.totalAmount || invoice.total_amount || 0,
        method,
      });

      // 2. Mark Job Completed
      await updateStatusMutation.mutateAsync("completed");

      toast.success("Payment recorded and job completed");
      onJobUpdate?.();
      onClose();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
      throw error; // Re-throw for dialog to handle state
    }
  };

  return (
    <JobDetailsDialog
      job={job}
      isOpen={isOpen}
      onClose={onClose}
      isMechanicMode={isMechanicMode}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onStatusChange={handleStatusChange}
      estimate={estimate}
      estimateItems={estimateItems}
      onAddEstimateItem={handleAddEstimateItem}
      onRemoveEstimateItem={handleRemoveEstimateItem}
      onUpdateEstimateItem={handleUpdateEstimateItem}
      onGenerateEstimatePdf={handleGenerateEstimatePdf}
      invoice={invoice}
      loadingInvoice={loadingInvoice}
      onRetryInvoice={handleRetryInvoice}
      onMarkPaid={handleMarkPaid}
      onGenerateInvoicePdf={handleGenerateInvoicePdf}
      onGenerateInvoice={handleGenerateInvoice}
      showPaymentModal={showPaymentModal}
      setShowPaymentModal={setShowPaymentModal}
      onPaymentComplete={handlePaymentComplete}
      tenantDetails={tenantDetails}
    />
  );
}
