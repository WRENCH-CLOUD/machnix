"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  X,
  Edit2,
  Save,
  Plus,
  Trash2,
  FileText,
  Download,
  Send,
  Check,
  Calendar,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { InvoiceService } from "@/lib/supabase/services"
import type { InvoiceWithRelations } from "@/lib/supabase/services/invoice.service"
import type { Database } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

type InvoiceItem = Database['tenant']['Tables']['invoice_items']['Row']

interface InvoiceViewProps {
  invoiceId: string
  onClose: () => void
  readonly?: boolean
}

export function InvoiceView({ invoiceId, onClose, readonly = false }: InvoiceViewProps) {
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<InvoiceItem>>({})

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  const loadInvoice = async () => {
    try {
      setLoading(true)
      const data = await InvoiceService.getInvoiceById(invoiceId)
      setInvoice(data)
      setItems(data.invoice_items || [])
    } catch (error) {
      console.error('Error loading invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditItem = (item: InvoiceItem) => {
    setEditingItemId(item.id)
    setEditValues({
      item_name: item.item_name,
      item_number: item.item_number || undefined,
      description: item.description || undefined,
      qty: item.qty,
      unit_price: item.unit_price,
      labor_cost: item.labor_cost || 0,
    })
  }

  const saveItem = async (itemId: string) => {
    try {
      await InvoiceService.updateInvoiceItem(itemId, editValues)
      await loadInvoice()
      setEditingItemId(null)
      setEditValues({})
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      await InvoiceService.deleteInvoiceItem(itemId)
      await loadInvoice()
    } catch (error) {
      console.error('Error deleting item:', error)
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

            {/* Line Items */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Line Items</CardTitle>
                {!readonly && (
                  <Button size="sm" variant="outline" className="gap-1">
                    <Plus className="w-3 h-3" />
                    Add Item
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground px-2">
                    <div className="col-span-4">Item</div>
                    <div className="col-span-2">Part No.</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2">Labor</div>
                    <div className="col-span-1 text-right">Total</div>
                  </div>

                  {/* Items */}
                  {items.map((item) => {
                    const isEditing = editingItemId === item.id
                    const itemTotal = (item.qty * item.unit_price) + (item.labor_cost || 0)

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "grid grid-cols-12 gap-3 items-center p-2 rounded-lg",
                          isEditing ? "bg-primary/5 border border-primary/20" : "border border-transparent hover:bg-secondary/50"
                        )}
                      >
                        <div className="col-span-4">
                          {isEditing && !readonly ? (
                            <Input
                              value={editValues.item_name || ''}
                              onChange={(e) => setEditValues({ ...editValues, item_name: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            <div>
                              <div className="font-medium text-sm">{item.item_name}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground">{item.description}</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          {isEditing && !readonly ? (
                            <Input
                              value={editValues.item_number || ''}
                              onChange={(e) => setEditValues({ ...editValues, item_number: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground">{item.item_number || '-'}</div>
                          )}
                        </div>
                        <div className="col-span-1">
                          {isEditing && !readonly ? (
                            <Input
                              type="number"
                              value={editValues.qty || 0}
                              onChange={(e) => setEditValues({ ...editValues, qty: Number(e.target.value) })}
                              className="h-8"
                            />
                          ) : (
                            <div className="text-sm">{item.qty}</div>
                          )}
                        </div>
                        <div className="col-span-2">
                          {isEditing && !readonly ? (
                            <Input
                              type="number"
                              value={editValues.unit_price || 0}
                              onChange={(e) => setEditValues({ ...editValues, unit_price: Number(e.target.value) })}
                              className="h-8"
                            />
                          ) : (
                            <div className="text-sm">₹{item.unit_price.toLocaleString()}</div>
                          )}
                        </div>
                        <div className="col-span-2">
                          {isEditing && !readonly ? (
                            <Input
                              type="number"
                              value={editValues.labor_cost || 0}
                              onChange={(e) => setEditValues({ ...editValues, labor_cost: Number(e.target.value) })}
                              className="h-8"
                            />
                          ) : (
                            <div className="text-sm">₹{(item.labor_cost || 0).toLocaleString()}</div>
                          )}
                        </div>
                        <div className="col-span-1 flex items-center justify-end gap-1">
                          <div className="text-sm font-medium">₹{itemTotal.toLocaleString()}</div>
                          {!readonly && (
                            <>
                              {isEditing ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => saveItem(item.id)}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => startEditItem(item)}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => deleteItem(item.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No items in this invoice
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
