"use client";

import { useState, useEffect } from "react";
import { JobDetailsDialog } from "@/components/tenant/jobs/job-details-dialog";
import { type UIJob } from "@/lib/job-transforms";
import { toast } from "sonner"; // Assuming sonner is used for toasts, or use other toast lib
import { type JobStatus } from "@/lib/mock-data";

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
      const res = await fetch(`/api/estimates/by-job/${job.id}`);
      if (res.ok) {
        const data = await res.json();
        setEstimate(data);
        setEstimateItems(data.estimate_items || []);
      } else {
        if (res.status === 404) {
          // Create estimate if not found (legacy behavior)
          const createRes = await fetch("/api/estimates/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobcard_id: job.id,
              customer_id: job.customer.id,
              vehicle_id: job.vehicle.id,
              status: "draft",
              estimate_number: `EST-${job.jobNumber}`,
            }),
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
      const res = await fetch(`/api/invoices/by-job/${job.id}`);
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
      const res = await fetch(`/api/estimates/${estimate.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_name: part.name,
          custom_part_number: part.partNumber,
          qty: part.quantity,
          unit_price: part.unitPrice,
          labor_cost: part.laborCost,
        }),
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
      const res = await fetch(`/api/estimates/items/${itemId}`, {
        method: "DELETE",
      });

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

  const handleGenerateInvoicePdf = () => {
    // Generate PDF logic - reusing legacy logic or creating new service
    // For now, we can keep using the window.print approach within the component or move it here
    // The dumb component handles the PDF generation for now as it's purely frontend
    console.log("Generate PDF triggered");
  };

  const handleRetryInvoice = () => {
    fetchInvoice();
  };

  const handleMarkPaid = () => {
    setShowPaymentModal(true);
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

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
    if (!estimate) return;

    try {
      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobcardId: job.id,
          estimateId: estimate.id,
        }),
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
      const paymentRes = await fetch(`/api/invoices/${invoice.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: invoice.total_amount - (invoice.paid_amount || 0), // Paying full remaining?
          mode: method,
          status: "success",
          paidAt: new Date(),
          reference: ref,
        }),
      });

      if (!paymentRes.ok) throw new Error("Payment failed");

      // 2. Mark Job Completed
      const jobRes = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

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
      invoice={invoice}
      loadingInvoice={loadingInvoice}
      onRetryInvoice={handleRetryInvoice}
      onMarkPaid={handleMarkPaid}
      onGenerateInvoicePdf={handleGenerateInvoicePdf}
      showPaymentModal={showPaymentModal}
      setShowPaymentModal={setShowPaymentModal}
      onPaymentComplete={handlePaymentComplete}
    />
  );
}
