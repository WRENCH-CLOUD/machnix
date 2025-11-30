"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Phone, Mail, MapPin, Car, MoreHorizontal, User, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { mockJobs } from "@/lib/mock-data"

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address?: string
  totalJobs: number
  totalSpent: number
  lastVisit: Date
  vehicles: string[]
}

// Generate customer data from jobs
const generateCustomers = (): Customer[] => {
  const customerMap = new Map<string, Customer>()

  mockJobs.forEach((job) => {
    const existing = customerMap.get(job.customer.id)
    const jobTotal = job.partsTotal + job.laborTotal + job.tax

    if (existing) {
      existing.totalJobs += 1
      existing.totalSpent += jobTotal
      if (job.createdAt > existing.lastVisit) {
        existing.lastVisit = job.createdAt
      }
      if (!existing.vehicles.includes(`${job.vehicle.make} ${job.vehicle.model}`)) {
        existing.vehicles.push(`${job.vehicle.make} ${job.vehicle.model}`)
      }
    } else {
      customerMap.set(job.customer.id, {
        ...job.customer,
        totalJobs: 1,
        totalSpent: jobTotal,
        lastVisit: job.createdAt,
        vehicles: [`${job.vehicle.make} ${job.vehicle.model}`],
      })
    }
  })

  // Add some additional mock customers
  const additionalCustomers: Customer[] = [
    {
      id: "c10",
      name: "Arun Mehta",
      phone: "+91 99001 12233",
      email: "arun.m@email.com",
      address: "15, Park Street, Delhi",
      totalJobs: 8,
      totalSpent: 45600,
      lastVisit: new Date("2024-01-10"),
      vehicles: ["BMW 3 Series", "Honda Activa"],
    },
    {
      id: "c11",
      name: "Sneha Kapoor",
      phone: "+91 88776 55443",
      email: "sneha.k@email.com",
      address: "78, Lake View, Mumbai",
      totalJobs: 3,
      totalSpent: 12800,
      lastVisit: new Date("2024-01-08"),
      vehicles: ["Mercedes C-Class"],
    },
  ]

  additionalCustomers.forEach((c) => customerMap.set(c.id, c))

  return Array.from(customerMap.values())
}

export function CustomersView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const customers = useMemo(() => generateCustomers(), [])

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [customers, searchQuery])

  const stats = useMemo(
    () => ({
      total: customers.length,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      avgSpend: Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length),
    }),
    [customers],
  )

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-auto">
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
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Enter customer name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+91 99999 99999" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input placeholder="customer@email.com" type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="Enter full address" />
              </div>
              <Button className="w-full" onClick={() => setShowAddDialog(false)}>
                Create Customer
              </Button>
            </div>
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
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString("en-IN")}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
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
              <div className="text-2xl font-bold">₹{stats.avgSpend.toLocaleString("en-IN")}</div>
              <div className="text-sm text-muted-foreground">Avg. Spend/Customer</div>
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

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, index) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
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
                        {customer.phone}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Customer</DropdownMenuItem>
                      <DropdownMenuItem>Create Job</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{customer.email}</span>
                </div>
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {customer.vehicles.map((vehicle, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {vehicle}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{customer.totalJobs}</div>
                    <div className="text-xs text-muted-foreground">Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-emerald-500">
                      ₹{customer.totalSpent.toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Spent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {customer.lastVisit.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">Last Visit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
