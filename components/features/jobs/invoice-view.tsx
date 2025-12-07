"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  X,
  FileText,
  Download,
  Send,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { InvoiceService } from "@/lib/supabase/services/invoice.service"
import type { InvoiceWithRelations } from "@/lib/supabase/services/invoice.service"

interface InvoiceViewProps {
  invoiceId: string
  onClose: () => void
  readonly?: boolean
}

export function InvoiceView({ invoiceId, onClose, readonly = false }: InvoiceViewProps) {
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  const loadInvoice = async () => {
    try {
      setLoading(true)
      const data = await InvoiceService.getInvoiceById(invoiceId)
      setInvoice(data)
    } catch (error) {
      console.error('Error loading invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    )
  }

  const statusColors = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    partial: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    overdue: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-4 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-card rounded-xl border border-border shadow-2xl overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border bg-secondary/30">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                {invoice.invoice_number || 'Invoice'}
              </h2>
              <Badge className={cn("border", statusColors[invoice.status as keyof typeof statusColors] || statusColors.pending)}>
                {invoice.status?.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Issued: {new Date(invoice.invoice_date || invoice.issued_at).toLocaleDateString()}</span>
              </div>
              {invoice.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Send className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Customer Info */}
            {invoice.customer && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Bill To</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-semibold">{invoice.customer.name}</p>
                    {invoice.customer.email && <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>}
                    {invoice.customer.phone && <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>}
                    {invoice.customer.address && <p className="text-sm text-muted-foreground">{invoice.customer.address}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Totals */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3 max-w-md ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{invoice.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (18% GST)</span>
                    <span className="font-medium">₹{invoice.tax_amount?.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{invoice.total_amount?.toLocaleString()}</span>
                  </div>
                  {invoice.paid_amount > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Paid</span>
                        <span>- ₹{invoice.paid_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-base font-semibold">
                        <span>Balance Due</span>
                        <span className="text-amber-600">₹{invoice.balance?.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {invoice.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  )
}
