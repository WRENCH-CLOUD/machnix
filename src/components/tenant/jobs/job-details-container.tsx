"use client";

import { useState, useEffect } from "react";
import { JobDetailsDialog } from "@/components/tenant/jobs/job-details-dialog";
import { type UIJob } from "@/modules/job/application/job-transforms-service";
import { toast } from "sonner"; // Assuming sonner is used for toasts, or use other toast lib
import { type JobStatus } from "@/modules/job/domain/job.entity";
import { api } from "@/lib/supabase/client";

interface JobDetailsContainerProps {
  job: UIJob;
  isOpen: boolean;
  onClose: () => void;
  onJobUpdate?: () => void;
  currentUser?: any; // Pass current user for mechanic mode check or auth
}

export function JobDetailsContainer({
  job,
  isOpen,
  onClose,
  onJobUpdate,
  currentUser,
}: JobDetailsContainerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateItems, setEstimateItems] = useState<any[]>([]);
  const [invoice, setInvoice] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Determine mechanic mode based on user role or prop
  // For now, let's assume if user is mechanic (TODO: robust check)
  const isMechanicMode = currentUser?.role === "mechanic";

  // Fetch estimate
  const fetchEstimate = async () => {
    try {
      const res = await api.get(`/api/estimates/by-job/${job.id}`);
      if (res.ok) {
        const data = await res.json();
        setEstimate(data);
        setEstimateItems(data.estimate_items || []);
      } else {
        if (res.status === 404) {
          // Create estimate if not found (legacy behavior)
          const createRes = await api.post("/api/estimates/create", {
            jobcard_id: job.id,
            customer_id: job.customer.id,
            vehicle_id: job.vehicle.id,
            status: "draft",
            estimate_number: `EST-${job.jobNumber}`,
          });
          if (createRes.ok) {
            const data = await createRes.json();
            setEstimate(data);
            setEstimateItems([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching estimate:", error);
    }
  };

  // Fetch invoice
  const fetchInvoice = async () => {
    setLoadingInvoice(true);
    try {
      const res = await api.get(`/api/invoices/by-job/${job.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      } else {
        setInvoice(null);
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoadingInvoice(false);
    }
  };

  useEffect(() => {
    if (isOpen && job.id) {
      fetchEstimate();
      if (job.status === "ready" || job.status === "completed") {
        fetchInvoice();
      }
    }
  }, [isOpen, job.id, job.status]);

  // Handlers
  const handleAddEstimateItem = async (part: any) => {
    if (!estimate) return;

    try {
      const res = await api.post(`/api/estimates/${estimate.id}/items`, {
        custom_name: part.name,
        custom_part_number: part.partNumber,
        qty: part.quantity,
        unit_price: part.unitPrice,
        labor_cost: part.laborCost,
      });

      if (!res.ok) throw new Error("Failed to add item");

      const newItem = await res.json();
      setEstimateItems((prev) => [...prev, newItem]);

      // Refresh estimate to get updated totals
      await fetchEstimate();
      toast.success("Item added to estimate");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    }
  };

  const handleRemoveEstimateItem = async (itemId: string) => {
    try {
      const res = await api.delete(`/api/estimates/items/${itemId}`);

      if (!res.ok) throw new Error("Failed to remove item");

      setEstimateItems((prev) => prev.filter((i) => i.id !== itemId));

      // Refresh estimate to get updated totals
      await fetchEstimate();
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
      const res = await api.patch(`/api/estimates/items/${itemId}`, {
        qty: updates.qty,
        unitPrice: updates.unitPrice,
        laborCost: updates.laborCost,
      });

      if (!res.ok) throw new Error("Failed to update item");

      // Refresh estimate to get updated data and totals
      await fetchEstimate();
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
      (acc, item) => acc + item.qty * item.unit_price,
      0
    );
    const laborSubtotal = estimateItems.reduce(
      (acc, item) => acc + (item.labor_cost || 0),
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
            <div style="font-size: 12px; color: #666;">Date: ${new Date(
              invoice.invoice_date
            ).toLocaleDateString()}</div>
          </div>
          <div class="header-right">
            <div style="font-weight: bold; font-size: 18px;">Garage A</div>
            <div style="font-size: 12px;">123 Auto Street, Bangalore</div>
            <div style="font-size: 12px;">GSTIN: 29XXXXX1234X1Z5</div>
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
              .map((item) => {
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
        (acc: number, item: any) => acc + item.qty * item.unit_price,
        0
      );
    const laborSubtotal =
      estimate.labor_total ??
      estimateItems.reduce(
        (acc: number, item: any) => acc + (item.labor_cost || 0),
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
          <div>Estimate #: ${
            estimate.estimate_number || job.jobNumber
          }</div>
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
              .map((item: any) => {
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
    fetchInvoice();
  };

  const handleMarkPaid = () => {
    setShowPaymentModal(true);
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    try {
      const res = await api.post(`/api/jobs/${job.id}/update-status`, { status: newStatus });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Job status updated to ${newStatus}`);
      if (onJobUpdate) onJobUpdate();

      // If status changed to ready/completed, fetch invoice
      if (newStatus === "ready" || newStatus === "completed") {
        // Attempt to auto-generate invoice if ready
        if (newStatus === "ready") {
          await handleGenerateInvoice();
        }
        fetchInvoice();
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
      const res = await api.post("/api/invoices/generate", {
        jobcardId: job.id,
        estimateId: estimate.id,
      });

      if (res.ok) {
        fetchInvoice();
        toast.success("Invoice generated");
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
    }
  };

  const handlePaymentComplete = async (
    method: string,
    ref: string | undefined
  ) => {
    if (!invoice) return;

    try {
      // 1. Record Payment
      const paymentRes = await api.post(`/api/invoices/${invoice.id}/pay`, {
        amount: invoice.totalAmount || invoice.total_amount || 0,
        method: method,  // API expects 'method', not 'mode'
      });

      if (!paymentRes.ok) throw new Error("Payment failed");

      // 2. Mark Job Completed
      const jobRes = await api.post(`/api/jobs/${job.id}/update-status`, { status: "completed" });

      if (!jobRes.ok) throw new Error("Failed to complete job");

      toast.success("Payment recorded and job completed");
      if (onJobUpdate) onJobUpdate();
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
    />
  );
}
