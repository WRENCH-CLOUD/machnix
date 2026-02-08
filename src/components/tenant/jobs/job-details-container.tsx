"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  useVehicleJobHistory,
  useUpdateInvoice,
  transformTenantSettingsForJobDetails,
} from "@/hooks/queries";
import { usePrintableFunctions } from "./printable-function";
import { type TodoItem, type TodoStatus, generateTodoId } from "@/modules/job/domain/todo.types";
import { useDebounce } from "@/hooks/useDebounce";

// Maximum number of tasks allowed per job
const MAX_TASKS = 30;

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
  onViewJob?: (jobId: string) => void;
}

export function JobDetailsContainer({
  job,
  isOpen,
  onClose,
  onJobUpdate,
  currentUser,
  tenantDetails: tenantDetailsProp,
  onViewJob,
}: JobDetailsContainerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // GST and discount state for invoice generation
  const [isGstBilled, setIsGstBilled] = useState(true);
  const [discountPercentage, setDiscountPercentage] = useState(0);

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

  // Service history for print
  const { data: serviceHistoryData } = useVehicleJobHistory(job.vehicle.id, job.id);

  // Mutations
  const addItemMutation = useAddEstimateItem(job.id);
  const removeItemMutation = useRemoveEstimateItem(job.id);
  const updateItemMutation = useUpdateEstimateItem(job.id);
  const generateInvoiceMutation = useGenerateInvoice(job.id);
  const recordPaymentMutation = useRecordPayment(job.id);
  const updateStatusMutation = useUpdateJobStatus(job.id);
  const updateTodosMutation = useUpdateJobTodos(job.id);
  const updateNotesMutation = useUpdateJobNotes(job.id);
  const updateInvoiceMutation = useUpdateInvoice(job.id);

  // Debounce ref for rate-limiting invoice updates (500ms)
  const updateInvoiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced function to update invoice GST/discount
  const debouncedUpdateInvoice = useCallback(
    (newIsGstBilled: boolean, newDiscountPercentage: number) => {
      if (!invoice) return;

      // Clear previous timeout
      if (updateInvoiceTimeoutRef.current) {
        clearTimeout(updateInvoiceTimeoutRef.current);
      }

      // Set new timeout
      updateInvoiceTimeoutRef.current = setTimeout(() => {
        updateInvoiceMutation.mutate({
          invoiceId: invoice.id,
          isGstBilled: newIsGstBilled,
          discountPercentage: newDiscountPercentage,
        });
      }, 500);
    },
    [invoice, updateInvoiceMutation]
  );

  // GST toggle handler - updates local state immediately, debounces API call
  const handleGstToggle = useCallback(
    (value: boolean) => {
      setIsGstBilled(value);
      debouncedUpdateInvoice(value, discountPercentage);
    },
    [discountPercentage, debouncedUpdateInvoice]
  );

  // Discount change handler - updates local state immediately, debounces API call
  const handleDiscountChange = useCallback(
    (value: number) => {
      setDiscountPercentage(value);
      debouncedUpdateInvoice(isGstBilled, value);
    },
    [isGstBilled, debouncedUpdateInvoice]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateInvoiceTimeoutRef.current) {
        clearTimeout(updateInvoiceTimeoutRef.current);
      }
    };
  }, []);

  // Helper to normalize todos (add default status for legacy todos)
  const normalizeTodos = (todos: any[]): TodoItem[] => {
    return (todos || []).map(t => ({
      ...t,
      status: t.status ?? null,
    }));
  };

  // Local state for todos and notes (optimistic updates)
  const [localTodos, setLocalTodos] = useState<TodoItem[]>(normalizeTodos(job.todos || []));
  const [localNotes, setLocalNotes] = useState<string>(job.complaints || "");
  
  // Pending updates ref to track if there are unsaved changes
  const pendingTodosRef = useRef<TodoItem[] | null>(null);
  const isSavingTodosRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRY_COUNT = 3;

  // Sync local state when job changes
  useEffect(() => {
    setLocalTodos(normalizeTodos(job.todos || []));
    setLocalNotes(job.complaints || "");
  }, [job.id]);

  // Function to persist todos to backend
  const persistTodos = useCallback(async (todos: TodoItem[], isRetry: boolean = false) => {
    if (isSavingTodosRef.current) {
      // If already saving, queue these todos for next save
      pendingTodosRef.current = todos;
      return;
    }

    try {
      isSavingTodosRef.current = true;
      await updateTodosMutation.mutateAsync(todos);
      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error) {
      console.error("Error persisting todos:", error);
      toast.error("Failed to save task changes");
      throw error;
    } finally {
      isSavingTodosRef.current = false;
      
      // Check if there are pending updates after finishing
      if (pendingTodosRef.current) {
        // Prevent infinite retry loops by limiting retry attempts
        // Only increment retry count if this was already a retry
        const currentRetryCount = isRetry ? retryCountRef.current : 0;
        
        if (currentRetryCount >= MAX_RETRY_COUNT) {
          console.error("Max retry count reached for queued todos");
          toast.error("Unable to save task changes after multiple attempts. Please refresh and try again.");
          pendingTodosRef.current = null;
          retryCountRef.current = 0;
          return;
        }
        
        const nextTodos = pendingTodosRef.current;
        pendingTodosRef.current = null;
        if (isRetry) {
          retryCountRef.current += 1;
        }
        
        // Recursively save pending todos (async, don't await)
        // Mark this as a retry if the parent was a retry
        persistTodos(nextTodos, isRetry || currentRetryCount > 0).catch(err => {
          console.error("Error persisting queued todos:", err);
          toast.error("Failed to save queued task changes");
        });
      }
    }
  }, [updateTodosMutation]);

  // Debounced version of persistTodos (500ms delay)
  // IMPORTANT: Debounced operations accept eventual consistency trade-off
  // - UI updates immediately (optimistic)
  // - Backend sync happens after 500ms delay
  // - Errors shown via toast, but NO automatic rollback to prevent jarring UX
  // - If network fails, UI may show stale data until page refresh
  // - This is acceptable for low-risk operations (toggle/text/status updates)
  const debouncedPersistTodos = useDebounce(persistTodos, 500);

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

  const handleMarkPaid = async () => {
    // If already paid, direct completion (bypass payment modal)
    if (invoice?.status === "paid") {
      // Guardrail: Ensure all todos have a status
      const todosWithUnassignedStatus = localTodos.filter(t => t.status === null);
      if (todosWithUnassignedStatus.length > 0) {
        toast.warning(
          `Please set status (Changed/Repaired/No Change) for ${todosWithUnassignedStatus.length} task(s) before completing the job.`,
          { duration: 5000 }
        );
        return;
      }

      try {
        await updateStatusMutation.mutateAsync("completed");
        toast.success("Job completed successfully");
        onJobUpdate?.();
      } catch (error) {
        console.error("Error completing job:", error);
        toast.error("Failed to complete job");
      }
      return;
    }

    setShowPaymentModal(true);
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    try {
      // Guardrail: When job is being completed/ready, ensure all todos have a status
      // Block completion if any todo has no status assigned
      if (newStatus === "completed" || newStatus === "ready") {
        const todosWithUnassignedStatus = localTodos.filter(t => t.status === null);
        if (todosWithUnassignedStatus.length > 0) {
          toast.warning(
            `Please set status (Changed/Repaired/No Change) for ${todosWithUnassignedStatus.length} task(s) before completing the job.`,
            { duration: 5000 }
          );
          return; // Block the status change
        }
      }

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
    notes: localNotes,
    todos: localTodos,
    serviceHistory: serviceHistoryData,
    isGstBilled,
    discountPercentage,
  });

  const handleGenerateInvoice = async () => {
    if (!estimate) {
      toast.error("Cannot generate invoice: Estimate not found");
      return;
    }

    try {
      await generateInvoiceMutation.mutateAsync({
        estimateId: estimate.id,
        isGstBilled,
        discountPercentage,
      });
      toast.success("Invoice generated");
    } catch (error) {
      console.error("Error generating invoice:", error);
    }
  };

  // Todo handlers with debouncing and task limit
  const handleAddTodo = async (text: string) => {
    // Note: Task limit is now enforced in JobTodos component
    const newTodo: TodoItem = {
      id: generateTodoId(),
      text,
      completed: false,
      status: null,
      createdAt: new Date().toISOString(),
    };
    const previousTodos = localTodos;
    const updatedTodos = [...localTodos, newTodo];
    
    // Optimistic update
    setLocalTodos(updatedTodos);

    try {
      // Immediate save for add operations (no debounce)
      await updateTodosMutation.mutateAsync(updatedTodos);
    } catch (error) {
      console.error("Error adding todo:", error);
      setLocalTodos(previousTodos); // Revert on error
      toast.error("Failed to add task");
    }
  };

  const handleToggleTodo = async (todoId: string) => {
    const previousTodos = localTodos;
    const updatedTodos = localTodos.map((t) =>
      t.id === todoId
        ? {
          ...t,
          completed: !t.completed,
          completedAt: !t.completed ? new Date().toISOString() : undefined,
        }
        : t
    );
    
    // Optimistic update
    setLocalTodos(updatedTodos);

    // Use debounced save for toggle operations
    // Note: Errors are shown via toast in persistTodos, but no rollback
    // This is acceptable for toggle/status updates as they're low-risk
    debouncedPersistTodos(updatedTodos);
  };

  const handleRemoveTodo = async (todoId: string) => {
    const previousTodos = localTodos;
    const updatedTodos = localTodos.filter((t) => t.id !== todoId);
    
    // Optimistic update
    setLocalTodos(updatedTodos);

    try {
      // Immediate save for delete operations (no debounce)
      await updateTodosMutation.mutateAsync(updatedTodos);
    } catch (error) {
      console.error("Error removing todo:", error);
      setLocalTodos(previousTodos);
      toast.error("Failed to remove task");
    }
  };

  const handleUpdateTodo = async (todoId: string, text: string) => {
    const previousTodos = localTodos;
    const updatedTodos = localTodos.map((t) =>
      t.id === todoId ? { ...t, text } : t
    );
    
    // Optimistic update
    setLocalTodos(updatedTodos);

    // Use debounced save for text updates (reduces API calls during typing)
    // Note: Errors are shown via toast in persistTodos, but no rollback
    // User can manually fix if needed by refreshing or re-editing
    debouncedPersistTodos(updatedTodos);
  };

  const handleUpdateTodoStatus = async (todoId: string, status: TodoStatus) => {
    const previousTodos = localTodos;
    const updatedTodos = localTodos.map((t) =>
      t.id === todoId ? { ...t, status } : t
    );
    
    // Optimistic update
    setLocalTodos(updatedTodos);

    // Use debounced save for status updates
    // Note: Errors are shown via toast in persistTodos, but no rollback
    // This is acceptable for status updates as they're low-risk
    debouncedPersistTodos(updatedTodos);
  };

  // Notes handler
  const handleUpdateNotes = async (notes: string) => {
    const previousNotes = localNotes;
    setLocalNotes(notes);

    try {
      await updateNotesMutation.mutateAsync(notes);
      onJobUpdate?.();
    } catch (error) {
      console.error("Error updating notes:", error);
      setLocalNotes(previousNotes);
      toast.error("Failed to update notes");
    }
  };

  // Mechanic assignment handler
  const handleMechanicChange = async (mechanicId: string) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/assign-mechanic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mechanicId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign mechanic');
      }

      toast.success('Mechanic assigned');
      onJobUpdate?.();
    } catch (error) {
      console.error('Error assigning mechanic:', error);
      toast.error('Failed to assign mechanic');
    }
  };

  const handlePaymentComplete = async (method: string) => {
    if (!invoice) return;

    // Guardrail: Ensure all todos have a status before completing via payment
    const todosWithUnassignedStatus = localTodos.filter(t => t.status === null);
    if (todosWithUnassignedStatus.length > 0) {
      toast.warning(
        `Please set status (Changed/Repaired/No Change) for ${todosWithUnassignedStatus.length} task(s) before completing the job.`,
        { duration: 5000 }
      );
      throw new Error("Tasks require status assignment"); // Throw to keep payment modal open
    }

    try {
      // 1. Record Payment
      await recordPaymentMutation.mutateAsync({
        invoiceId: invoice.id,
        amount: invoice.totalAmount || 0,
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
      onUpdateTodoStatus={handleUpdateTodoStatus}
      maxTodos={MAX_TASKS}
      notes={localNotes}
      onUpdateNotes={handleUpdateNotes}
      onViewJob={onViewJob}
      onMechanicChange={handleMechanicChange}
      isGstBilled={isGstBilled}
      onGstToggle={handleGstToggle}
      discountPercentage={discountPercentage}
      onDiscountChange={handleDiscountChange}
    />
  );
}
