"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  Car,
  FileText,
  CreditCard,
  ClipboardCheck,
  Camera,
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Download,
  ExternalLink,
  Check,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { type JobStatus, type Mechanic, statusConfig, type DVIItem, type Part } from "@/lib/mock-data"
import type { UIJob } from "@/lib/job-transforms"
import { enrichJobWithDummyData } from "@/lib/dvi-dummy-data"
import { InvoiceService } from "@/lib/supabase/services"
import type { InvoiceWithRelations } from "@/lib/supabase/services/invoice.service"
// Note: mechanics import removed - mechanic assignment features temporarily disabled
import { cn } from "@/lib/utils"

interface JobDetailsProps {
  job: UIJob
  onClose: () => void
  isMechanicMode: boolean
  onStatusChange?: (jobId: string, newStatus: JobStatus) => void
  onMechanicChange?: (jobId: string, mechanicId: string) => void
}

const dviStatusConfig = {
  good: { label: "Good", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/20" },
  attention: { label: "Attention", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/20" },
  urgent: { label: "Urgent", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/20" },
  pending: { label: "Pending", icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
}

export function JobDetails({ job, onClose, isMechanicMode, onStatusChange, onMechanicChange }: JobDetailsProps) {
  const [activeTab, setActiveTab] = useState(isMechanicMode ? "dvi" : "overview")
  
  // Enrich job with dummy data if needed
  const enrichedJob = enrichJobWithDummyData(job)
  
  const [dviItems, setDviItems] = useState<DVIItem[]>(enrichedJob.dviItems || [])
  const [parts, setParts] = useState<Part[]>(enrichedJob.parts || [])
  const [newNote, setNewNote] = useState("")
  const [currentStatus, setCurrentStatus] = useState<JobStatus>(job.status)
  const [currentMechanic, setCurrentMechanic] = useState(job.mechanic)
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  
  // Update DVI items when job changes
  useEffect(() => {
    const enrichedJob = enrichJobWithDummyData(job)
    setDviItems(enrichedJob.dviItems || [])
    setParts(enrichedJob.parts || [])
  }, [job.id])

  // Fetch invoice when status is ready or completed
  useEffect(() => {
    const fetchInvoice = async () => {
      if (job.status === 'ready' || job.status === 'completed') {
        setLoadingInvoice(true)
        try {
          const invoiceData = await InvoiceService.getInvoiceByJobId(job.id)
          setInvoice(invoiceData)
        } catch (error) {
          console.error('Error fetching invoice:', error)
        } finally {
          setLoadingInvoice(false)
        }
      }
    }
    
    fetchInvoice()
  }, [job.id, job.status])

  const statusInfo = statusConfig[currentStatus]
  const statusOptions: JobStatus[] = ["received", "working", "ready", "completed"]

  const handleStatusChange = (newStatus: JobStatus) => {
    setCurrentStatus(newStatus)
    if (onStatusChange) {
      onStatusChange(job.id, newStatus)
    }
  }

  const handleMechanicChange = (mechanicId: string) => {
    // Mechanic lookup will be handled by parent component
    if (onMechanicChange) {
      onMechanicChange(job.id, mechanicId)
    }
  }

  const updateDviStatus = (itemId: string, status: DVIItem["status"]) => {
    setDviItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, status } : item)))
  }

  const addPart = () => {
    const newPart: Part = {
      id: `p${Date.now()}`,
      name: "",
      partNumber: "",
      quantity: 1,
      unitPrice: 0,
      laborCost: 0,
    }
    setParts((prev) => [...prev, newPart])
  }

  const removePart = (partId: string) => {
    setParts((prev) => prev.filter((p) => p.id !== partId))
  }

  const updatePart = (partId: string, field: keyof Part, value: string | number) => {
    setParts((prev) => prev.map((part) => (part.id === partId ? { ...part, [field]: value } : part)))
  }

  const partsSubtotal = parts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0)
  const laborSubtotal = parts.reduce((sum, p) => sum + p.laborCost, 0)
  const subtotal = partsSubtotal + laborSubtotal
  const tax = subtotal * 0.18
  const total = subtotal + tax

  const groupedDviItems = dviItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, DVIItem[]>,
  )

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
        className={cn(
          "w-full bg-card rounded-xl border border-border shadow-2xl overflow-hidden my-4",
          isMechanicMode ? "max-w-lg" : "max-w-5xl",
        )}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border bg-secondary/30">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-foreground">{job.jobNumber}</h2>
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
                      const config = statusConfig[status]
                      return (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={cn(
                            "cursor-pointer",
                            currentStatus === status && "bg-accent"
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full mr-2", config.bgColor)} />
                          {config.label}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge className={cn("text-xs", statusInfo.bgColor, statusInfo.color, "border-0")}>
                  {statusInfo.label}
                </Badge>
              )}
              {job.dviPending && (
                <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs gap-1">
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
            {!isMechanicMode && onMechanicChange && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">
                  {currentMechanic ? `Assigned to: ${currentMechanic.name}` : 'No mechanic assigned'}
                </p>
                {/* Mechanic selection temporarily disabled - use admin panel to assign */}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="border-b border-border px-6">
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
              <TabsTrigger
                value="dvi"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 h-12"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                DVI
              </TabsTrigger>
              {!isMechanicMode && (
                <>
                  <TabsTrigger
                    value="parts"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 h-12"
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Parts & Estimate
                  </TabsTrigger>
                  <TabsTrigger
                    value="invoice"
                    disabled={job.status !== 'ready' && job.status !== 'completed'}
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Invoice
                    {job.status !== 'ready' && job.status !== 'completed' && (
                      <span className="ml-2 text-xs text-muted-foreground">(Available when Ready for Payment)</span>
                    )}
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {/* Overview Tab */}
          {!isMechanicMode && (
            <TabsContent value="overview" className="m-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-6 grid grid-cols-3 gap-6">
                  {/* Customer Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Customer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-medium text-foreground">{job.customer.name}</p>
                      </div>
                      <a
                        href={`tel:${job.customer.phone}`}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        {job.customer.phone}
                      </a>
                      <a
                        href={`mailto:${job.customer.email}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="w-4 h-4" />
                        {job.customer.email}
                      </a>
                      {job.customer.address && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mt-0.5" />
                          {job.customer.address}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Vehicle Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        Vehicle
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Make</span>
                        <span className="font-medium">{job.vehicle.make}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model</span>
                        <span className="font-medium">{job.vehicle.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year</span>
                        <span className="font-medium">{job.vehicle.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reg No</span>
                        <span className="font-mono font-medium">{job.vehicle.regNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Color</span>
                        <span className="font-medium">{job.vehicle.color}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mechanic Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Assigned Mechanic
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {job.mechanic ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={job.mechanic.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {job.mechanic.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{job.mechanic.name}</p>
                            <p className="text-sm text-muted-foreground">{job.mechanic.specialty}</p>
                            <a href={`tel:${job.mechanic.phone}`} className="text-sm text-primary hover:underline">
                              {job.mechanic.phone}
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No mechanic assigned</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Complaints */}
                  <Card className="col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Customer Complaint</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground">{job.complaints}</p>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Job Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span className="text-sm">{new Date(enrichedJob.created_at || enrichedJob.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parts</span>
                        <span className="font-medium">₹{(enrichedJob.partsTotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Labor</span>
                        <span className="font-medium">₹{(enrichedJob.laborTotal || 0).toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{((enrichedJob.partsTotal || 0) + (enrichedJob.laborTotal || 0) + (enrichedJob.tax || 0)).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Timeline */}
                  <Card className="col-span-3">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Activity Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {enrichedJob.activities && enrichedJob.activities.length > 0 ? (
                          enrichedJob.activities.map((activity: any, index: number) => (
                            <div key={activity.id} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                {index < enrichedJob.activities.length - 1 && <div className="w-px h-full bg-border" />}
                              </div>
                              <div className="flex-1 pb-4">
                                <p className="text-sm text-foreground">{activity.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(activity.timestamp).toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">{activity.user}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No activity recorded yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {/* DVI Tab */}
          <TabsContent value="dvi" className="m-0">
            <ScrollArea className={cn("h-[calc(100vh-280px)]", isMechanicMode && "h-[calc(100vh-200px)]")}>
              <div className="p-6 space-y-6">
                {/* DVI Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Digital Vehicle Inspection</h3>
                    <p className="text-sm text-muted-foreground">{enrichedJob.dviTemplate || "Full Vehicle Inspection"}</p>
                  </div>
                  <div className="flex gap-2">
                    {Object.entries(dviStatusConfig).map(([key, config]) => {
                      const count = dviItems.filter((i) => i.status === key).length
                      if (count === 0) return null
                      return (
                        <Badge key={key} className={cn(config.bg, config.color, "border-0 gap-1")}>
                          <config.icon className="w-3 h-3" />
                          {count}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                {/* DVI Categories */}
                {Object.entries(groupedDviItems).map(([category, items]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {items.map((item) => {
                        const statusConf = dviStatusConfig[item.status]
                        const StatusIcon = statusConf.icon

                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "flex items-start gap-4 p-4 rounded-lg border transition-all",
                              isMechanicMode ? "flex-col" : "flex-row items-center",
                              item.status === "urgent" && "border-red-500/30 bg-red-500/5",
                              item.status === "attention" && "border-amber-500/30 bg-amber-500/5",
                              item.status === "good" && "border-emerald-500/30 bg-emerald-500/5",
                              item.status === "pending" && "border-border",
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <StatusIcon className={cn("w-5 h-5", statusConf.color)} />
                                <span className="font-medium text-foreground">{item.name}</span>
                              </div>
                              {item.note && <p className="text-sm text-muted-foreground mt-1 ml-7">{item.note}</p>}
                            </div>

                            <div className={cn("flex gap-2", isMechanicMode && "w-full")}>
                              {isMechanicMode ? (
                                <div className="grid grid-cols-4 gap-2 w-full">
                                  {(["good", "attention", "urgent", "pending"] as const).map((status) => {
                                    const conf = dviStatusConfig[status]
                                    const Icon = conf.icon
                                    return (
                                      <Button
                                        key={status}
                                        size="lg"
                                        variant={item.status === status ? "default" : "outline"}
                                        className={cn(
                                          "h-14 flex-col gap-1",
                                          item.status === status && conf.bg,
                                          item.status === status && conf.color,
                                        )}
                                        onClick={() => updateDviStatus(item.id, status)}
                                      >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-xs">{conf.label}</span>
                                      </Button>
                                    )
                                  })}
                                </div>
                              ) : (
                                <Select
                                  value={item.status}
                                  onValueChange={(value) => updateDviStatus(item.id, value as DVIItem["status"])}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(["good", "attention", "urgent", "pending"] as const).map((status) => {
                                      const conf = dviStatusConfig[status]
                                      return (
                                        <SelectItem key={status} value={status}>
                                          <div className="flex items-center gap-2">
                                            <conf.icon className={cn("w-4 h-4", conf.color)} />
                                            {conf.label}
                                          </div>
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                              )}

                              <Button
                                variant="outline"
                                size={isMechanicMode ? "lg" : "icon"}
                                className={cn(isMechanicMode && "h-14")}
                              >
                                <MessageSquare className="w-4 h-4" />
                                {isMechanicMode && <span className="ml-2">Note</span>}
                              </Button>
                              <Button
                                variant="outline"
                                size={isMechanicMode ? "lg" : "icon"}
                                className={cn(isMechanicMode && "h-14")}
                              >
                                <Camera className="w-4 h-4" />
                                {isMechanicMode && <span className="ml-2">Photo</span>}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                ))}

                {dviItems.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No inspection items yet</p>
                    <p className="text-sm">Start the DVI to add inspection items</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* DVI Footer Actions - Mechanic Mode */}
            {isMechanicMode && (
              <div className="p-4 border-t border-border bg-secondary/30">
                <div className="flex gap-3">
                  <Select defaultValue="working">
                    <SelectTrigger className="flex-1 h-12">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {(["working", "ready"] as const).map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusConfig[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="h-12 px-6">
                    <Check className="w-4 h-4 mr-2" />
                    Save DVI
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Parts & Estimate Tab */}
          {!isMechanicMode && (
            <TabsContent value="parts" className="m-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-6 space-y-6">
                  {/* Parts Table */}
                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-semibold">Parts & Labor</CardTitle>
                      <Button size="sm" onClick={addPart} className="gap-1">
                        <Plus className="w-4 h-4" />
                        Add Item
                      </Button>
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
                          <div className="col-span-1"></div>
                        </div>

                        {/* Parts List */}
                        {parts.map((part) => (
                          <div key={part.id} className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-4">
                              <Input
                                placeholder="Part name"
                                value={part.name}
                                onChange={(e) => updatePart(part.id, "name", e.target.value)}
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                placeholder="Part #"
                                value={part.partNumber}
                                onChange={(e) => updatePart(part.id, "partNumber", e.target.value)}
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                min="1"
                                value={part.quantity}
                                onChange={(e) => updatePart(part.id, "quantity", Number.parseInt(e.target.value))}
                              />
                            </div>
                            <div className="col-span-2">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  className="pl-7"
                                  value={part.unitPrice}
                                  onChange={(e) => updatePart(part.id, "unitPrice", Number.parseFloat(e.target.value))}
                                />
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  className="pl-7"
                                  value={part.laborCost}
                                  onChange={(e) => updatePart(part.id, "laborCost", Number.parseFloat(e.target.value))}
                                />
                              </div>
                            </div>
                            <div className="col-span-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => removePart(part.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {parts.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">No parts added yet</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Totals */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Parts Subtotal</span>
                          <span>₹{partsSubtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Labor Subtotal</span>
                          <span>₹{laborSubtotal.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">GST (18%)</span>
                          <span>₹{tax.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span>₹{total.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 flex-1 bg-transparent">
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                    <Button className="gap-2 flex-1 bg-green-600 hover:bg-green-700">
                      <Send className="w-4 h-4" />
                      Send Estimate via WhatsApp
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {/* Invoice Tab */}
          {!isMechanicMode && (
            <TabsContent value="invoice" className="m-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-6 space-y-6">
                  {loadingInvoice ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground">Loading invoice...</p>
                      </div>
                    </div>
                  ) : !invoice ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center space-y-2">
                        <CreditCard className="w-12 h-12 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          Invoice will be generated when job status is "Ready for Payment"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Invoice Preview */}
                      <Card className="bg-white text-black">
                        <CardContent className="p-8">
                          {/* Invoice Header */}
                          <div className="flex justify-between items-start mb-8">
                            <div>
                              <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                              <p className="text-gray-600">{invoice.invoice_number || job.jobNumber}</p>
                              <p className="text-sm text-gray-500">
                                Date: {new Date(invoice.invoice_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <h3 className="font-bold text-gray-900">Garage A</h3>
                              <p className="text-sm text-gray-600">123 Auto Street, Bangalore</p>
                              <p className="text-sm text-gray-600">GSTIN: 29XXXXX1234X1Z5</p>
                            </div>
                          </div>

                          {/* Bill To */}
                          <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">BILL TO</h4>
                              <p className="font-semibold text-gray-900">{job.customer.name}</p>
                              <p className="text-sm text-gray-600">{job.customer.phone}</p>
                              <p className="text-sm text-gray-600">{job.customer.email}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 mb-2">VEHICLE</h4>
                              <p className="font-semibold text-gray-900">
                                {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                              </p>
                              <p className="text-sm text-gray-600 font-mono">{job.vehicle.regNo}</p>
                            </div>
                          </div>

                          {/* Line Items */}
                          <table className="w-full mb-8">
                            <thead>
                              <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-2 text-sm font-semibold text-gray-500">Description</th>
                                <th className="text-right py-2 text-sm font-semibold text-gray-500">Qty</th>
                                <th className="text-right py-2 text-sm font-semibold text-gray-500">Rate</th>
                                <th className="text-right py-2 text-sm font-semibold text-gray-500">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parts.map((part) => (
                                <tr key={part.id} className="border-b border-gray-100">
                                  <td className="py-3">
                                    <p className="font-medium text-gray-900">{part.name}</p>
                                    <p className="text-xs text-gray-500">{part.partNumber}</p>
                                  </td>
                                  <td className="text-right py-3 text-gray-600">{part.quantity}</td>
                                  <td className="text-right py-3 text-gray-600">₹{part.unitPrice.toLocaleString()}</td>
                                  <td className="text-right py-3 font-medium text-gray-900">
                                    ₹{(part.unitPrice * part.quantity).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                              {laborSubtotal > 0 && (
                                <tr className="border-b border-gray-100">
                                  <td className="py-3">
                                    <p className="font-medium text-gray-900">Labor Charges</p>
                                  </td>
                                  <td className="text-right py-3 text-gray-600">-</td>
                                  <td className="text-right py-3 text-gray-600">-</td>
                                  <td className="text-right py-3 font-medium text-gray-900">
                                    ₹{laborSubtotal.toLocaleString()}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>

                          {/* Totals */}
                          <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                              <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{Number(invoice.subtotal || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>GST (18%)</span>
                                <span>₹{Number(invoice.tax_amount || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t-2 border-gray-200">
                                <span>Total</span>
                                <span>₹{Number(invoice.total_amount || 0).toLocaleString()}</span>
                              </div>
                              {invoice.paid_amount > 0 && (
                                <>
                                  <div className="flex justify-between text-emerald-600">
                                    <span>Paid</span>
                                    <span>₹{Number(invoice.paid_amount).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-lg font-bold text-amber-600 pt-2 border-t border-gray-200">
                                    <span>Balance Due</span>
                                    <span>₹{Number(invoice.balance || 0).toLocaleString()}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                        </CardContent>
                      </Card>

                      {/* Payment Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="gap-2 bg-transparent">
                          <Download className="w-4 h-4" />
                          Generate PDF
                        </Button>
                        {/* <Button variant="outline" className="gap-2 bg-transparent">
                          <ExternalLink className="w-4 h-4" />
                          Share Payment Link
                          <Badge variant="secondary" className="ml-1 text-xs">
                            Razorpay
                          </Badge>
                        </Button> */} 
                        <Button 
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            if (onStatusChange) {
                              handleStatusChange("completed")
                            }
                          }}
                        >
                          <Check className="w-4 h-4" />
                          Mark Paid (Cash)
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
