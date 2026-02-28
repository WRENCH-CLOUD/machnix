"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Phone, Mail, MapPin, Car, MoreHorizontal, User, Briefcase, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { CustomerDetailDialog } from "./customer-detail-dialog"
import { CustomerEditDialog } from "./customer-edit-dialog"
import { CustomerDeleteDialog } from "./customer-delete-dialog"

export interface CustomerWithStats {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  totalJobs: number
  lastVisit: Date | null
  vehicleCount: number
  vehicles: Array<{ make: string | null; model: string | null }>
}

export interface CustomerFormData {
  name: string
  phone: string
  email: string
  address: string
}

interface CustomersViewProps {
  customers: CustomerWithStats[]
  loading: boolean
  error: string | null
  onAddCustomer: (data: CustomerFormData) => Promise<void>
  onEditCustomer: (id: string, data: CustomerFormData & { notes: string }) => Promise<void>
  onDeleteCustomer: (id: string) => Promise<void>
  onRefresh: () => void
  onCreateJob?: (customer: CustomerWithStats) => void
}

export function CustomersView({
  customers,
  loading,
  error,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onRefresh,
  onCreateJob,
}: CustomersViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addFormData, setAddFormData] = useState<CustomerFormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
  })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Dialog states
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [customers, searchQuery])

  const stats = useMemo(
    () => ({
      total: customers.length,
      totalJobs: customers.reduce((sum, c) => sum + c.totalJobs, 0),
      avgJobs:
        customers.length > 0
          ? Math.round(customers.reduce((sum, c) => sum + c.totalJobs, 0) / customers.length)
          : 0,
    }),
    [customers],
  )

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!addFormData.name.trim()) {
      setAddError("Customer name is required")
      return
    }

    try {
      setAddLoading(true)
      setAddError(null)
      await onAddCustomer(addFormData)
      setShowAddDialog(false)
      setAddFormData({ name: "", phone: "", email: "", address: "" })
    } catch (err) {
      console.error("Error adding customer:", err)
      setAddError(err instanceof Error ? err.message : "Failed to add customer")
    } finally {
      setAddLoading(false)
    }
  }

  const handleViewDetails = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer)
    setShowDetailDialog(true)
  }

  const handleEdit = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer)
    setShowEditDialog(true)
    setShowDetailDialog(false)
  }

  const handleDelete = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer)
    setShowDeleteDialog(true)
    setShowDetailDialog(false)
  }

  const handleSaveEdit = async (id: string, data: CustomerFormData & { notes: string }) => {
    await onEditCustomer(id, data)
    onRefresh()
  }

  const handleConfirmDelete = async (id: string) => {
    await onDeleteCustomer(id)
    onRefresh()
  }

  const handleCreateJob = (customer: CustomerWithStats) => {
    setShowDetailDialog(false)
    onCreateJob?.(customer)
  }

  return (
    <div className="h-[calc(100svh-4rem)] flex flex-col space-y-6 overflow-hidden p-4 md:p-6 lg:p-8">
      <div className="flex-shrink-0 space-y-4 mt-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">Manage your customer database</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>Enter customer details to create a new record.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCustomer}>
                <div className="space-y-4 py-4">
                  {addError && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                      {addError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="add-name">Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="add-name"
                      placeholder="Enter customer name"
                      value={addFormData.name}
                      onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-phone">Phone Number</Label>
                      <Input
                        id="add-phone"
                        placeholder="+91 99999 99999"
                        value={addFormData.phone}
                        onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-email">Email</Label>
                      <Input
                        id="add-email"
                        placeholder="customer@email.com"
                        type="email"
                        value={addFormData.email}
                        onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-address">Address</Label>
                    <Input
                      id="add-address"
                      placeholder="Enter full address"
                      value={addFormData.address}
                      onChange={(e) => setAddFormData({ ...addFormData, address: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} disabled={addLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addLoading}>
                    {addLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Customer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalJobs}</div>
                <div className="text-sm text-muted-foreground">Total Jobs</div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Car className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.avgJobs}</div>
                <div className="text-sm text-muted-foreground">Avg. Jobs/Customer</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button onClick={onRefresh} className="mt-4">
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "No customers found matching your search"
                : "No customers yet. Add your first customer to get started."}
            </p>
          </div>
        )}

        {/* Customer Grid */}
        {!loading && !error && filteredCustomers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(customer)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {customer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{customer.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone || "No phone"}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(customer); }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}>
                            Edit Customer
                          </DropdownMenuItem>
                          {onCreateJob && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCreateJob(customer); }}>
                              Create Job
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(customer); }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {customer.vehicles.length > 0 ? (
                        customer.vehicles.map((vehicle, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {vehicle.make && vehicle.model
                              ? `${vehicle.make} ${vehicle.model}`
                              : "Unknown Vehicle"}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No vehicles registered</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{customer.totalJobs}</div>
                        <div className="text-xs text-muted-foreground">Jobs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{customer.vehicleCount}</div>
                        <div className="text-xs text-muted-foreground">Vehicles</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {customer.lastVisit
                            ? customer.lastVisit.toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })
                            : "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">Last Visit</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <CustomerDetailDialog
          customer={selectedCustomer}
          isOpen={showDetailDialog}
          onClose={() => setShowDetailDialog(false)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreateJob={onCreateJob ? handleCreateJob : undefined}
        />

        {/* Edit Dialog */}
        <CustomerEditDialog
          customer={selectedCustomer}
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSave={handleSaveEdit}
        />

        {/* Delete Dialog */}
        <CustomerDeleteDialog
          customer={selectedCustomer}
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  )
}
