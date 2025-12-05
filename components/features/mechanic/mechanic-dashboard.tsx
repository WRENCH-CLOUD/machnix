"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wrench,
  Car,
  User,
  Phone,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Circle,
  LogOut,
  Bell,
  ClipboardCheck,
  Camera,
  MessageSquare,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/providers"
import { type JobCard, statusConfig, mockJobs, type DVIItem, type JobStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const dviStatusConfig = {
  good: {
    label: "Good",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/20",
    activeBg: "bg-emerald-500",
  },
  attention: {
    label: "Attention",
    icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-500/20",
    activeBg: "bg-amber-500",
  },
  urgent: { label: "Urgent", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/20", activeBg: "bg-red-500" },
  pending: { label: "Pending", icon: Circle, color: "text-muted-foreground", bg: "bg-muted", activeBg: "bg-slate-500" },
}

const statusFlow: JobStatus[] = ["received", "assigned", "working", "ready", "completed"]

export function MechanicDashboard() {
  const { user, signOut } = useAuth()
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null)
  const [activeTab, setActiveTab] = useState<"status" | "dvi" | "info">("status")

  // Filter jobs assigned to this mechanic (using Ravi Kumar's ID for demo)
  const mechanicJobs = mockJobs.filter((job) => job.mechanic?.id === "m1" && job.status !== "completed")

  const completedJobs = mockJobs.filter((job) => job.mechanic?.id === "m1" && job.status === "completed")

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Mechanix</h1>
              <p className="text-xs text-muted-foreground">{user?.tenantName || "Garage A"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mechanic Profile Bar */}
        <div className="flex items-center gap-3 mt-4 p-3 bg-secondary/50 rounded-xl">
          <Avatar className="w-12 h-12 border-2 border-primary">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{user?.name}</p>
            <p className="text-sm text-muted-foreground">Engine Specialist</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{mechanicJobs.length}</p>
            <p className="text-xs text-muted-foreground">Active Jobs</p>
          </div>
        </div>
      </header>

      {/* Job List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Active Jobs Section */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Your Active Jobs
            </h2>

            {mechanicJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium text-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending jobs assigned to you</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {mechanicJobs.map((job) => (
                  <MechanicJobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
                ))}
              </div>
            )}
          </div>

          {/* Completed Jobs Section */}
          {completedJobs.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Recently Completed
              </h2>
              <div className="space-y-3">
                {completedJobs.slice(0, 3).map((job) => (
                  <MechanicJobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} isCompleted />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <MechanicJobDetail
            job={selectedJob}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={() => {
              setSelectedJob(null)
              setActiveTab("status")
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Job Card Component for Mechanic View
function MechanicJobCard({
  job,
  onClick,
  isCompleted = false,
}: {
  job: JobCard
  onClick: () => void
  isCompleted?: boolean
}) {
  const statusInfo = statusConfig[job.status]

  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={onClick}>
      <Card
        className={cn(
          "overflow-hidden cursor-pointer transition-all active:bg-secondary/80",
          isCompleted && "opacity-60",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Vehicle Icon */}
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0", statusInfo.bgColor)}>
              <Car className={cn("w-7 h-7", statusInfo.color)} />
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-foreground">
                  {job.vehicle.make} {job.vehicle.model}
                </span>
                {job.dviPending && (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0"
                  >
                    DVI
                  </Badge>
                )}
              </div>

              <p className="text-sm font-mono text-muted-foreground mb-2">{job.vehicle.regNo}</p>

              <div className="flex items-center justify-between">
                <Badge className={cn("text-xs font-medium", statusInfo.bgColor, statusInfo.color, "border-0")}>
                  {statusInfo.label}
                </Badge>

                <span className="text-xs text-muted-foreground">{job.jobNumber}</span>
              </div>
            </div>

            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-4" />
          </div>

          {/* Complaint Preview */}
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground line-clamp-2">{job.complaints}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Job Detail Modal for Mechanic
function MechanicJobDetail({
  job,
  activeTab,
  onTabChange,
  onClose,
}: {
  job: JobCard
  activeTab: "status" | "dvi" | "info"
  onTabChange: (tab: "status" | "dvi" | "info") => void
  onClose: () => void
}) {
  const [currentStatus, setCurrentStatus] = useState<JobStatus>(job.status)
  const [dviItems, setDviItems] = useState<DVIItem[]>(job.dviItems)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [itemNote, setItemNote] = useState("")

  const statusInfo = statusConfig[currentStatus]

  const currentStatusIndex = statusFlow.indexOf(currentStatus)
  const canMoveForward = currentStatusIndex < statusFlow.length - 1 && currentStatusIndex >= 1
  const canMoveBackward = currentStatusIndex > 1

  const handleStatusChange = (direction: "forward" | "backward") => {
    const newIndex = direction === "forward" ? currentStatusIndex + 1 : currentStatusIndex - 1
    if (newIndex >= 0 && newIndex < statusFlow.length) {
      setCurrentStatus(statusFlow[newIndex])
    }
  }

  const updateDviStatus = (itemId: string, status: DVIItem["status"]) => {
    setDviItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, status } : item)))
  }

  const addNoteToItem = (itemId: string) => {
    if (!itemNote.trim()) return
    setDviItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, note: itemNote } : item)))
    setItemNote("")
    setExpandedItem(null)
  }

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
      className="fixed inset-0 z-50 bg-background"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="h-full flex flex-col"
      >
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 safe-area-inset-top">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={onClose}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-foreground">{job.jobNumber}</h1>
              <p className="text-sm text-muted-foreground">
                {job.vehicle.make} {job.vehicle.model} • {job.vehicle.regNo}
              </p>
            </div>
            <Badge className={cn("text-xs px-3 py-1", statusInfo.bgColor, statusInfo.color, "border-0")}>
              {statusInfo.label}
            </Badge>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-card border-b border-border px-4">
          <div className="flex gap-1">
            {[
              { id: "status" as const, label: "Status", icon: Clock },
              { id: "dvi" as const, label: "Inspection", icon: ClipboardCheck },
              { id: "info" as const, label: "Details", icon: Car },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all",
                  "border-b-2",
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground",
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {/* Status Tab */}
          {activeTab === "status" && (
            <div className="p-4 space-y-6">
              {/* Current Status Display */}
              <Card className="overflow-hidden">
                <div className={cn("p-6 text-center", statusInfo.bgColor)}>
                  <Clock className={cn("w-12 h-12 mx-auto mb-3", statusInfo.color)} />
                  <h2 className={cn("text-2xl font-bold", statusInfo.color)}>{statusInfo.label}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Current job status</p>
                </div>
              </Card>

              {/* Status Flow */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Update Status
                </h3>

                <div className="space-y-3">
                  {statusFlow.map((status, index) => {
                    const info = statusConfig[status]
                    const isCurrentOrPast = index <= currentStatusIndex
                    const isCurrent = status === currentStatus

                    return (
                      <div
                        key={status}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                          isCurrent
                            ? "border-primary bg-primary/10"
                            : isCurrentOrPast
                              ? "border-border bg-secondary/30"
                              : "border-border/50 opacity-50",
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isCurrent ? "bg-primary text-primary-foreground" : info.bgColor,
                          )}
                        >
                          {isCurrentOrPast ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className={cn("font-semibold", isCurrent ? "text-primary" : "text-foreground")}>
                            {info.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Step {index + 1} of {statusFlow.length}
                          </p>
                        </div>
                        {isCurrent && <Badge className="bg-primary text-primary-foreground">Current</Badge>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-3 pt-4">
                {canMoveForward && (
                  <Button
                    className="w-full h-14 text-lg font-semibold gap-2"
                    onClick={() => handleStatusChange("forward")}
                  >
                    <ChevronRight className="w-5 h-5" />
                    Move to {statusConfig[statusFlow[currentStatusIndex + 1]].label}
                  </Button>
                )}

                {canMoveBackward && (
                  <Button
                    variant="outline"
                    className="w-full h-12 bg-transparent"
                    onClick={() => handleStatusChange("backward")}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to {statusConfig[statusFlow[currentStatusIndex - 1]].label}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* DVI Tab */}
          {activeTab === "dvi" && (
            <div className="p-4 space-y-4">
              {/* DVI Summary */}
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(dviStatusConfig).map(([key, config]) => {
                  const count = dviItems.filter((i) => i.status === key).length
                  return (
                    <Card key={key} className={cn("p-3 text-center", config.bg)}>
                      <config.icon className={cn("w-5 h-5 mx-auto mb-1", config.color)} />
                      <p className={cn("text-lg font-bold", config.color)}>{count}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{config.label}</p>
                    </Card>
                  )
                })}
              </div>

              {/* DVI Items by Category */}
              {Object.entries(groupedDviItems).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {category}
                  </h3>

                  <div className="space-y-3">
                    {items.map((item) => {
                      const statusConf = dviStatusConfig[item.status]
                      const StatusIcon = statusConf.icon
                      const isExpanded = expandedItem === item.id

                      return (
                        <Card key={item.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            {/* Item Header */}
                            <div className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <StatusIcon className={cn("w-6 h-6", statusConf.color)} />
                                <span className="font-medium text-foreground flex-1">{item.name}</span>
                              </div>

                              {item.note && (
                                <p className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded-lg mb-3">
                                  {item.note}
                                </p>
                              )}

                              {/* Status Buttons - Large Touch Targets */}
                              <div className="grid grid-cols-4 gap-2">
                                {(["good", "attention", "urgent", "pending"] as const).map((status) => {
                                  const conf = dviStatusConfig[status]
                                  const Icon = conf.icon
                                  const isActive = item.status === status

                                  return (
                                    <button
                                      key={status}
                                      onClick={() => updateDviStatus(item.id, status)}
                                      className={cn(
                                        "h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all",
                                        "border-2 active:scale-95",
                                        isActive
                                          ? `${conf.activeBg} border-transparent text-white`
                                          : `${conf.bg} border-transparent ${conf.color}`,
                                      )}
                                    >
                                      <Icon className="w-5 h-5" />
                                      <span className="text-[10px] font-semibold uppercase">{conf.label}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex border-t border-border">
                              <button
                                onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Add Note
                              </button>
                              <div className="w-px bg-border" />
                              <button className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors">
                                <Camera className="w-4 h-4" />
                                Add Photo
                              </button>
                            </div>

                            {/* Expanded Note Input */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-border overflow-hidden"
                                >
                                  <div className="p-4 space-y-3">
                                    <Textarea
                                      placeholder="Enter inspection note..."
                                      value={itemNote}
                                      onChange={(e) => setItemNote(e.target.value)}
                                      className="min-h-[80px] text-base"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        onClick={() => {
                                          setExpandedItem(null)
                                          setItemNote("")
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button className="flex-1" onClick={() => addNoteToItem(item.id)}>
                                        Save Note
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}

              {dviItems.length === 0 && (
                <Card className="p-8 text-center">
                  <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground">No Inspection Items</p>
                  <p className="text-sm text-muted-foreground">No DVI items have been added to this job yet</p>
                </Card>
              )}
            </div>
          )}

          {/* Info Tab - Read Only */}
          {activeTab === "info" && (
            <div className="p-4 space-y-4">
              {/* Vehicle Info Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Vehicle Details</h3>
                      <p className="text-sm text-muted-foreground">Read-only information</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Make</span>
                      <span className="font-medium text-foreground">{job.vehicle.make}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-medium text-foreground">{job.vehicle.model}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Year</span>
                      <span className="font-medium text-foreground">{job.vehicle.year}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Reg No</span>
                      <span className="font-mono font-medium text-foreground">{job.vehicle.regNo}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Color</span>
                      <span className="font-medium text-foreground">{job.vehicle.color}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info Card - Read Only */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Customer</h3>
                      <p className="text-sm text-muted-foreground">Contact for reference only</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium text-foreground">{job.customer.name}</span>
                    </div>
                    <div className="flex justify-between py-2 items-center">
                      <span className="text-muted-foreground">Phone</span>
                      <a
                        href={`tel:${job.customer.phone}`}
                        className="flex items-center gap-2 text-primary font-medium"
                      >
                        <Phone className="w-4 h-4" />
                        {job.customer.phone}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Complaint Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Customer Complaint</h3>
                      <p className="text-sm text-muted-foreground">Issue to resolve</p>
                    </div>
                  </div>

                  <p className="text-foreground bg-secondary/50 p-4 rounded-xl">{job.complaints}</p>
                </CardContent>
              </Card>

              {/* Job Timeline */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-4">Activity Timeline</h3>

                  <div className="space-y-4">
                    {job.activities
                      .slice(-5)
                      .reverse()
                      .map((activity, index) => (
                        <div key={activity.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                            {index < Math.min(job.activities.length, 5) - 1 && (
                              <div className="w-px h-full bg-border flex-1 my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm text-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(activity.timestamp).toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </motion.div>
  )
}
