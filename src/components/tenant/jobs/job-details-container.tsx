"use client";

import { useState, useEffect } from "react";
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
  useUpdateJobTodos,
  useUpdateJobNotes,
  transformTenantSettingsForJobDetails,
} from "@/hooks/queries";
import { usePrintableFunctions } from "./printable-function";
import { type TodoItem } from "./job-todos";

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
  const updateTodosMutation = useUpdateJobTodos(job.id);
  const updateNotesMutation = useUpdateJobNotes(job.id);

  // Local state for todos and notes (optimistic updates)
  const [localTodos, setLocalTodos] = useState<TodoItem[]>(job.todos || []);
  const [localNotes, setLocalNotes] = useState<string>(job.complaints || "");

  // Sync local state when job changes
  useEffect(() => {
    setLocalTodos(job.todos || []);
    setLocalNotes(job.complaints || "");
  }, [job.id, job.todos, job.complaints]);

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

  const {
    handleGenerateInvoicePdf,
    handleGenerateEstimatePdf,
    handleGenerateJobPdf,
  } = usePrintableFunctions({
    job,
    estimateItems,
    invoice,
    tenantDetails,
    estimate,
    notes: job.complaints,
  });

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

  // Todo handlers
  const handleAddTodo = async (text: string) => {
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updatedTodos = [...localTodos, newTodo];
    setLocalTodos(updatedTodos);
    
    try {
      await updateTodosMutation.mutateAsync(updatedTodos);
    } catch (error) {
      console.error("Error adding todo:", error);
      setLocalTodos(localTodos); // Revert on error
      toast.error("Failed to add task");
    }
  };

  const handleToggleTodo = async (todoId: string) => {
    const updatedTodos = localTodos.map((t) =>
      t.id === todoId
        ? {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date().toISOString() : undefined,
          }
        : t
    );
    setLocalTodos(updatedTodos);
    
    try {
      await updateTodosMutation.mutateAsync(updatedTodos);
    } catch (error) {
      console.error("Error toggling todo:", error);
      setLocalTodos(localTodos);
      toast.error("Failed to update task");
    }
  };

  const handleRemoveTodo = async (todoId: string) => {
    const updatedTodos = localTodos.filter((t) => t.id !== todoId);
    setLocalTodos(updatedTodos);
    
    try {
      await updateTodosMutation.mutateAsync(updatedTodos);
    } catch (error) {
      console.error("Error removing todo:", error);
      setLocalTodos(localTodos);
      toast.error("Failed to remove task");
    }
  };

  const handleUpdateTodo = async (todoId: string, text: string) => {
    const updatedTodos = localTodos.map((t) =>
      t.id === todoId ? { ...t, text } : t
    );
    setLocalTodos(updatedTodos);
    
    try {
      await updateTodosMutation.mutateAsync(updatedTodos);
    } catch (error) {
      console.error("Error updating todo:", error);
      setLocalTodos(localTodos);
      toast.error("Failed to update task");
    }
  };

  // Notes handler
  const handleUpdateNotes = async (notes: string) => {
    setLocalNotes(notes);
    
    try {
      await updateNotesMutation.mutateAsync(notes);
      onJobUpdate?.();
    } catch (error) {
      console.error("Error updating notes:", error);
      setLocalNotes(job.complaints || "");
      toast.error("Failed to update notes");
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
      onGenerateJobPdf={handleGenerateJobPdf}
      tenantDetails={tenantDetails}
      // Todo props
      todos={localTodos}
      onAddTodo={handleAddTodo}
      onToggleTodo={handleToggleTodo}
      onRemoveTodo={handleRemoveTodo}
      onUpdateTodo={handleUpdateTodo}
      // Notes props
      notes={localNotes}
      onUpdateNotes={handleUpdateNotes}
    />
  );
}
