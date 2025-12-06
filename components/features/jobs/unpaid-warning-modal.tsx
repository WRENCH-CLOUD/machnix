"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle,
  DollarSign,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UnpaidWarningModalProps {
  isOpen: boolean
  onClose: () => void
  jobNumber?: string
  outstandingBalance: number
  invoiceId: string
  onCancel: () => void
  onMarkPaidAndComplete: (paymentMethod: string, referenceId?: string) => Promise<void>
}

export function UnpaidWarningModal({
  isOpen,
  onClose,
  jobNumber,
  outstandingBalance,
  invoiceId,
  onCancel,
  onMarkPaidAndComplete,
}: UnpaidWarningModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [referenceId, setReferenceId] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleMarkPaidAndComplete = async () => {
    try {
      setIsProcessing(true)
      await onMarkPaidAndComplete(paymentMethod, referenceId || undefined)
      onClose()
    } catch (error) {
      console.error('Error marking paid and complete:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-amber-500/50 shadow-2xl">
            <CardHeader className="pb-4 bg-amber-500/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500/20">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Outstanding Balance</CardTitle>
                    {jobNumber && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Job #{jobNumber}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Warning Message */}
              <div className="space-y-2">
                <p className="text-foreground font-medium">
                  This job has an outstanding balance.
                </p>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-sm text-muted-foreground">Amount Due</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    <span className="text-lg font-bold text-amber-500">
                      ₹{outstandingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  You cannot mark this job as completed while there is an unpaid invoice.
                </p>
              </div>

              {/* Payment Details */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference-id">
                    Reference ID / Transaction ID{' '}
                    <span className="text-muted-foreground text-xs">(Optional)</span>
                  </Label>
                  <Input
                    id="reference-id"
                    placeholder="Enter transaction reference"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  onClick={handleMarkPaidAndComplete}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Mark Paid & Complete
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onCancel()
                    onClose()
                  }}
                  disabled={isProcessing}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                This will record a payment of ₹{outstandingBalance.toLocaleString()} and mark the job as completed.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
