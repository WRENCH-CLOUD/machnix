"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  X,
  Check,
  ArrowUpDown,
  Info as InfoIcon,
  CreditCard,
  Wallet,
  Banknote,
  Smartphone,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface UnpaidWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobNumber?: string;
  outstandingBalance: number;
  invoiceId: string;
  onCancel: () => void;
  onMarkPaidAndComplete: (
    paymentMethod: string,
    referenceId?: string
  ) => Promise<void>;
}

const paymentMethodIcons: Record<string, any> = {
  cash: Wallet,
  card: CreditCard,
  upi: Smartphone,
  bank_transfer: Building2,
  cheque: Banknote,
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash Payment",
  card: "Card Payment",
  upi: "UPI Payment",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque Payment",
};

export function UnpaidWarningDialog({
  isOpen,
  onClose,
  jobNumber,
  outstandingBalance,
  invoiceId,
  onCancel,
  onMarkPaidAndComplete,
}: UnpaidWarningDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [referenceId, setReferenceId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleMarkPaidAndComplete = async () => {
    try {
      setIsProcessing(true);
      await onMarkPaidAndComplete(paymentMethod, referenceId || undefined);
      setIsCompleted(true);

      // Auto close after success animation
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (error: any) {
      console.error(
        "[UnpaidWarningDialog] Payment failed:",
        error?.message || error
      );
      setIsProcessing(false);
      // Let the modal stay open so user can see the error and try again
    }
  };

  if (!isOpen) return null;

  const PaymentIcon = paymentMethodIcons[paymentMethod] || Wallet;

  return (
    <TooltipProvider>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (!isProcessing && !isCompleted) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-border shadow-2xl bg-white dark:bg-zinc-900">
              <CardHeader className="pb-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-500/20">
                      <DollarSign className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Payment Required
                      </CardTitle>
                      {jobNumber && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Job #{jobNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  {!isProcessing && !isCompleted && (
                    <Button variant="ghost" size="icon" onClick={onClose}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center min-h-[420px]">
                  {/* Status Icon */}
                  <div className="h-[100px] flex items-center justify-center mb-6">
                    <motion.div
                      className="flex justify-center"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <div className="relative w-[100px] h-[100px] flex items-center justify-center">
                        <motion.div
                          className="absolute inset-0 blur-2xl bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: isCompleted
                              ? [0, 1, 0.8]
                              : isProcessing
                              ? [0.5, 0.8, 0.5]
                              : 0,
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: isProcessing && !isCompleted ? Infinity : 0,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                        <AnimatePresence mode="wait">
                          {isCompleted ? (
                            <motion.div
                              key="completed"
                              initial={{
                                opacity: 0,
                                rotate: -180,
                              }}
                              animate={{
                                opacity: 1,
                                rotate: 0,
                              }}
                              transition={{
                                duration: 0.6,
                                ease: "easeInOut",
                              }}
                              className="w-[100px] h-[100px] flex items-center justify-center"
                            >
                              <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-full p-5 border border-emerald-500">
                                <Check
                                  className="h-10 w-10 text-emerald-500"
                                  strokeWidth={3.5}
                                />
                              </div>
                            </motion.div>
                          ) : isProcessing ? (
                            <motion.div
                              key="processing"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{
                                opacity: 0,
                                rotate: 360,
                              }}
                              transition={{
                                duration: 0.6,
                                ease: "easeInOut",
                              }}
                              className="w-[100px] h-[100px] flex items-center justify-center"
                            >
                              <div className="relative z-10">
                                <motion.div
                                  className="absolute inset-0 rounded-full border-2 border-transparent"
                                  style={{
                                    borderLeftColor: "rgb(16 185 129)",
                                    borderTopColor: "rgb(16 185 129 / 0.2)",
                                    filter: "blur(0.5px)",
                                  }}
                                  animate={{
                                    rotate: 360,
                                  }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                />
                                <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-full p-5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                  <ArrowUpDown className="h-10 w-10 text-emerald-500" />
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="pending"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="w-[100px] h-[100px] flex items-center justify-center"
                            >
                              <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-full p-5 border-2 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                <DollarSign className="h-10 w-10 text-amber-500" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </div>

                  {/* Title and Status */}
                  <motion.div
                    className="space-y-2 text-center w-full mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.2,
                      duration: 0.8,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.h2
                          key="completed-title"
                          className="text-lg text-zinc-900 dark:text-zinc-100 tracking-tight font-semibold"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          Payment Completed
                        </motion.h2>
                      ) : isProcessing ? (
                        <motion.h2
                          key="processing-title"
                          className="text-lg text-zinc-900 dark:text-zinc-100 tracking-tight font-semibold"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          Processing Payment
                        </motion.h2>
                      ) : (
                        <motion.h2
                          key="pending-title"
                          className="text-lg text-zinc-900 dark:text-zinc-100 tracking-tight font-semibold"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          Outstanding Balance
                        </motion.h2>
                      )}
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="completed-status"
                          className="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          Job marked as completed
                        </motion.div>
                      ) : isProcessing ? (
                        <motion.div
                          key="processing-status"
                          className="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          Processing transaction...
                        </motion.div>
                      ) : (
                        <motion.div
                          key="pending-status"
                          className="text-xs text-muted-foreground font-medium"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          Complete this job requires payment
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Payment Flow */}
                  {!isProcessing && !isCompleted && (
                    <motion.div
                      className="w-full space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.3,
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {/* Amount Display */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <span className="text-sm font-medium text-muted-foreground">
                          Amount Due
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-amber-500">
                            ₹{outstandingBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Payment Method Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="payment-method">Payment Method</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <SelectTrigger id="payment-method" className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(paymentMethodLabels).map(
                              ([value, label]) => {
                                const Icon = paymentMethodIcons[value];
                                return (
                                  <SelectItem key={value} value={value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="w-4 h-4" />
                                      {label}
                                    </div>
                                  </SelectItem>
                                );
                              }
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Reference ID */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="reference-id"
                          className="flex items-center gap-1"
                        >
                          Reference / Transaction ID
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoIcon className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Optional reference number for tracking
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="reference-id"
                          placeholder="Enter reference number (optional)"
                          value={referenceId}
                          onChange={(e) => setReferenceId(e.target.value)}
                          className="h-12"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 pt-4">
                        <Button
                          onClick={handleMarkPaidAndComplete}
                          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Confirm Payment & Complete Job
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            onCancel();
                            onClose();
                          }}
                          className="w-full h-12"
                        >
                          Cancel
                        </Button>
                      </div>

                      <p className="text-xs text-center text-muted-foreground">
                        This will record the payment and mark the job as
                        completed
                      </p>
                    </motion.div>
                  )}

                  {/* Processing/Completed Summary */}
                  {(isProcessing || isCompleted) && (
                    <motion.div
                      className="w-full space-y-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: 0.2,
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <div
                        className={cn(
                          "w-full rounded-xl p-4 border backdrop-blur-md transition-all duration-300",
                          isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                            : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50"
                        )}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center shadow-lg border transition-colors",
                                isCompleted
                                  ? "bg-emerald-500 border-emerald-600"
                                  : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                              )}
                            >
                              <PaymentIcon
                                className={cn(
                                  "w-5 h-5",
                                  isCompleted
                                    ? "text-white"
                                    : "text-zinc-900 dark:text-zinc-100"
                                )}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {paymentMethodLabels[paymentMethod]}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ₹{outstandingBalance.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {referenceId && (
                            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                              <div className="text-xs text-muted-foreground">
                                Reference: {referenceId}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}
