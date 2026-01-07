"use client"

import { useState, useEffect } from "react"
import {
  Phone,
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDistanceToNow } from "date-fns"

interface CallbackRequest {
  id: string
  name: string
  phone: string
  email: string | null
  business_name: string | null
  message: string | null
  status: "pending" | "contacted" | "closed"
  notes: string | null
  created_at: string
  contacted_at: string | null
}

export default function AdminCallbacksPage() {
  const [callbacks, setCallbacks] = useState<CallbackRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCallback, setSelectedCallback] = useState<CallbackRequest | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    loadCallbacks()
  }, [statusFilter])

  const loadCallbacks = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      }

      const response = await fetch(`/api/admin/callbacks?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch callbacks")
      }

      const data = await response.json()
      setCallbacks(data.callbacks)
    } catch (err) {
      console.error("Failed to load callbacks:", err)
      setError("Failed to load callback requests")
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (callback: CallbackRequest) => {
    setSelectedCallback(callback)
    setNotes(callback.notes || "")
    setShowDetailsDialog(true)
  }

  const handleUpdateStatus = async (status: string) => {
    if (!selectedCallback) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/callbacks/${selectedCallback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      })

      if (!response.ok) {
        throw new Error("Failed to update callback")
      }

      const data = await response.json()
      setCallbacks((prev) =>
        prev.map((c) => (c.id === selectedCallback.id ? data.callback : c))
      )
      setSelectedCallback(data.callback)
    } catch (err) {
      console.error("Failed to update callback:", err)
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedCallback) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/callbacks/${selectedCallback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        throw new Error("Failed to save notes")
      }

      const data = await response.json()
      setCallbacks((prev) =>
        prev.map((c) => (c.id === selectedCallback.id ? data.callback : c))
      )
      setSelectedCallback(data.callback)
    } catch (err) {
      console.error("Failed to save notes:", err)
    } finally {
      setUpdating(false)
    }
  }

  const filteredCallbacks = callbacks.filter((callback) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      callback.name.toLowerCase().includes(searchLower) ||
      callback.phone.includes(searchLower) ||
      callback.email?.toLowerCase().includes(searchLower) ||
      callback.business_name?.toLowerCase().includes(searchLower)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "contacted":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Contacted</Badge>
      case "closed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const pendingCount = callbacks.filter((c) => c.status === "pending").length

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-card border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contacted</p>
              <p className="text-2xl font-bold">
                {callbacks.filter((c) => c.status === "contacted").length}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Closed</p>
              <p className="text-2xl font-bold">
                {callbacks.filter((c) => c.status === "closed").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadCallbacks} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-12 text-destructive">
            {error}
          </div>
        ) : filteredCallbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Phone className="w-12 h-12 mb-4 opacity-50" />
            <p>No callback requests found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCallbacks.map((callback) => (
                <TableRow key={callback.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{callback.name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {callback.phone}
                      </div>
                      {callback.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {callback.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {callback.business_name ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {callback.business_name}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(callback.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(callback.created_at), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(callback)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Callback Request Details</DialogTitle>
            <DialogDescription>
              Review and manage this callback request
            </DialogDescription>
          </DialogHeader>

          {selectedCallback && (
            <div className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {selectedCallback.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{selectedCallback.name}</p>
                    {selectedCallback.business_name && (
                      <p className="text-sm text-muted-foreground">
                        {selectedCallback.business_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedCallback.phone}`} className="text-primary hover:underline">
                      {selectedCallback.phone}
                    </a>
                  </div>
                  {selectedCallback.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${selectedCallback.email}`} className="text-primary hover:underline">
                        {selectedCallback.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              {selectedCallback.message && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </div>
                  <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                    {selectedCallback.message}
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedCallback.status === "pending" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus("pending")}
                    disabled={updating}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCallback.status === "contacted" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus("contacted")}
                    disabled={updating}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Contacted
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCallback.status === "closed" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus("closed")}
                    disabled={updating}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Closed
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this callback..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={handleSaveNotes} disabled={updating}>
              {updating ? "Saving..." : "Save Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

