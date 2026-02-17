"use client";

import {
  X,
  FileText,
  CreditCard,
  Car,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Printer,
  ClipboardList,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type JobStatus, statusConfig } from "@/modules/job/domain/job.entity";
import { type UIJob } from "@/modules/job/application/job-transforms-service";
import { JobOverview } from "./job-overview";
import { JobParts, type Part } from "./job-parts";
import { JobInvoice } from "./job-invoice";
import { JobTasks } from "./job-tasks";
import { UnpaidWarningDialog } from "@/components/tenant/dialogs/unpaid-warning-dialog";
import type { InventorySnapshotItem, InventoryItem } from "@/modules/inventory/domain/inventory.entity";

// Using compatible types that match what child components expect
interface EstimatePartial {
  id?: string;
  parts_total?: number;
  labor_total?: number;
  tax_amount?: number;
  total_amount?: number;
  estimate_items?: unknown[];
}

/** Minimal estimate item - only fields actually used */
interface EstimateItemPartial {
  id: string;
  custom_name: string | null;
  custom_part_number?: string | null;
  qty: number;
  unit_price: number;
  labor_cost?: number | null;
}

interface InvoicePartial {
  id?: string;
  status?: string;
  totalAmount?: number;
  total_amount?: number;
  is_gst_billed?: boolean;
  isGstBilled?: boolean;
  discount_percentage?: number;
  discountPercentage?: number;
  tax_amount?: number;
  paid_amount?: number;
  parts_total?: number;
  labor_total?: number;
  discount_amount?: number;
}

interface JobDetailsDialogProps {
  job: UIJob;
  isOpen: boolean;
  onClose: () => void;
  isMechanicMode: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onStatusChange?: (newStatus: JobStatus) => void;
  onMechanicChange?: (mechanicId: string) => void;
  isRefreshing?: boolean;

  // Estimate props
  estimate: EstimatePartial | null | undefined;
  estimateItems: EstimateItemPartial[];
  onAddEstimateItem: (part: Part) => Promise<void>;
  onRemoveEstimateItem: (itemId: string) => Promise<void>;
  onUpdateEstimateItem?: (itemId: string, updates: { qty?: number; unitPrice?: number; laborCost?: number }) => Promise<void>;
  onGenerateEstimatePdf: () => void;

  // Invoice props
  invoice: InvoicePartial | null | undefined;
  loadingInvoice: boolean;
  onRetryInvoice: () => void;
  onMarkPaid: () => void;
  onGenerateInvoicePdf: () => void;
  onGenerateInvoice: () => void;
  // GST and discount props
  isGstBilled?: boolean;
  onGstToggle?: (value: boolean) => void;
  discountPercentage?: number;
  onDiscountChange?: (value: number) => void;

  // Inventory props
  inventoryItems?: InventorySnapshotItem[];
  loadingInventory?: boolean;
  inventoryError?: Error | null;
  /** Optimized search function from inventory snapshot */
  searchInventory?: (query: string, limit?: number) => InventorySnapshotItem[];
  /** Function to refresh inventory from server */
  onRefreshInventory?: () => void;

  // Payment Modal props
  showPaymentModal: boolean;
  setShowPaymentModal: (show: boolean) => void;
  onPaymentComplete: (method: string, ref?: string) => Promise<void>;

  // Tenant props
  tenantDetails: {
    name: string;
    address: string;
    gstin: string;
  };
  onGenerateJobPdf?: () => void;

  // Notes props
  notes?: string;
  onUpdateNotes?: (notes: string) => void;
  onViewJob?: (jobId: string) => void;
}

export function JobDetailsDialog({
  job,
  isOpen,
  onClose,
  isMechanicMode,
  activeTab,
  onTabChange,
  onStatusChange,
  isRefreshing = false,
  estimate,
  estimateItems,
  onAddEstimateItem,
  onRemoveEstimateItem,
  onUpdateEstimateItem,
  onGenerateEstimatePdf,
  invoice,
  loadingInvoice,
  onRetryInvoice,

  onMarkPaid,
  onGenerateInvoicePdf,
  onGenerateInvoice,
  showPaymentModal,
  setShowPaymentModal,
  onPaymentComplete,
  tenantDetails,
  onGenerateJobPdf,
  notes,
  onUpdateNotes,
  onViewJob,
  onMechanicChange,
  isGstBilled = true,
  onGstToggle,
  discountPercentage = 0,
  onDiscountChange,
  inventoryItems,
  loadingInventory,
  inventoryError,
  searchInventory,
  onRefreshInventory,
}: JobDetailsDialogProps) {
  if (!isOpen) return null;

  const currentStatus = job.status as JobStatus;
  const statusInfo = statusConfig[currentStatus] || statusConfig.received; // fallback
  const statusOptions: JobStatus[] = [
    "received",
    "working",
    "ready",
    "completed",
  ];

  // Get valid status transitions based on current status
  const getValidTransitions = (currentStatus: string): JobStatus[] => {
    switch (currentStatus) {
      case "received":
        return ["received", "working"];
      case "working":
        return ["received", "working", "ready"];
      case "ready":
        return ["working", "ready", "completed"];
      case "completed":
        return ["completed"];
      default:
        return statusOptions;
    }
  };

  const validStatuses = getValidTransitions(currentStatus);

  // Simple payment: use total amount (no partial payment support)
  const totalAmount =
    invoice?.totalAmount ??
    invoice?.total_amount ??
    0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center overflow-y-auto py-4 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "w-full bg-card rounded-xl border border-border shadow-2xl overflow-hidden my-4 relative h-[90vh] flex flex-col",
            isMechanicMode ? "max-w-lg" : "max-w-5xl"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading Overlay */}
          {isRefreshing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Updating job details...
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-border bg-secondary/30">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-foreground">
                  {job.jobNumber}
                </h2>
                {!isMechanicMode && onStatusChange ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        className={cn(
                          "text-xs cursor-pointer gap-1.5 transition-all hover:opacity-80 px-3 py-1",
                          statusInfo.bgColor,
                          statusInfo.color,
                          "border-0"
                        )}
                      >
                        {statusInfo.label}
                        <ChevronDown className="w-3 h-3" />
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {statusOptions.map((status) => {
                        const config = statusConfig[status];
                        const isValid = validStatuses.includes(status);
                        const isCurrent = currentStatus === status;

                        return (
                          <DropdownMenuItem
                            key={status}
                            disabled={!isValid}
                            onClick={() => isValid && onStatusChange(status)}
                            className={cn(
                              "cursor-pointer",
                              isCurrent && "bg-accent",
                              !isValid && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mr-2",
                                config.bgColor
                              )}
                            />
                            {config.label}
                            {!isValid && !isCurrent && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                Locked
                              </span>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge
                    className={cn(
                      "text-xs",
                      statusInfo.bgColor,
                      statusInfo.color,
                      "border-0"
                    )}
                  >
                    {statusInfo.label}
                  </Badge>
                )}
                {job.dviPending && (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs gap-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    DVI Pending
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Car className="w-4 h-4" />
                  {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                </span>
                <span className="font-mono">{job.vehicle.regNo}</span>
              </div>
            </div>
            {onGenerateJobPdf && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onGenerateJobPdf}
                title="Print Job Card"
                className="mr-2"
              >
                <Printer className="w-5 h-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="border-b border-border px-6 flex-none">
              <TabsList className="h-12 bg-transparent border-0 p-0 gap-6">
                {!isMechanicMode && (
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 h-12"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                )}

                {!isMechanicMode && (
                  <>
                    <TabsTrigger
                      value="tasks"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 h-12"
                    >
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Tasks
                    </TabsTrigger>
                    <TabsTrigger
                      value="parts"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 h-12"
                    >
                      <Car className="w-4 h-4 mr-2" />
                      Parts & Estimate
                    </TabsTrigger>
                    <TabsTrigger
                      value="invoice"
                      disabled={
                        job.status !== "ready" && job.status !== "completed"
                      }
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Invoice
                      {job.status !== "ready" && job.status !== "completed" && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Available when Ready for Delivery)
                        </span>
                      )}
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <TabsContent value="overview" className="m-0 h-full">
                <JobOverview
                  job={job}
                  notes={notes}
                  onUpdateNotes={onUpdateNotes}
                  onViewJob={onViewJob}
                  onMechanicChange={onMechanicChange}
                  isEditable={job.status !== "completed" && job.status !== "cancelled"}
                  estimate={estimate}
                />
              </TabsContent>

              <TabsContent value="tasks" className="m-0 h-full">
                <JobTasks
                  jobId={job.id}
                  disabled={job.status === "completed" || job.status === "cancelled"}
                  searchInventory={searchInventory as ((query: string, limit?: number) => InventoryItem[]) | undefined}
                />
              </TabsContent>

              <TabsContent value="parts" className="m-0 h-full">
                <JobParts
                  estimate={estimate ?? null}
                  estimateItems={estimateItems}
                  jobStatus={currentStatus}
                  onAddItem={onAddEstimateItem}
                  onRemoveItem={onRemoveEstimateItem}
                  onUpdateItem={onUpdateEstimateItem}
                  onGenerateEstimatePdf={onGenerateEstimatePdf}
                  inventoryItems={inventoryItems}
                  loadingInventory={loadingInventory}
                  inventoryError={inventoryError}
                  searchInventory={searchInventory}
                  onRefreshInventory={onRefreshInventory}
                />
              </TabsContent>

              <TabsContent value="invoice" className="m-0 h-full">
                <JobInvoice
                  tenantDetails={tenantDetails}
                  job={job}
                  invoice={invoice}
                  estimateItems={estimateItems}
                  loading={loadingInvoice}
                  isGstBilled={isGstBilled}
                  onGstToggle={onGstToggle}
                  discountPercentage={discountPercentage}
                  onDiscountChange={onDiscountChange}
                  onRetry={onRetryInvoice}
                  onMarkPaid={onMarkPaid}
                  onGeneratePdf={onGenerateInvoicePdf}
                  onGenerateInvoice={onGenerateInvoice}
                />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Payment Modal */}
      {invoice && (
        <UnpaidWarningDialog
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          jobNumber={job.jobNumber}
          outstandingBalance={totalAmount}
          invoiceId={invoice.id}
          onCancel={() => setShowPaymentModal(false)}
          onMarkPaidAndComplete={onPaymentComplete}
        />
      )}
    </>
  );
}
