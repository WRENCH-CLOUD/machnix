"use client"

import { motion } from "framer-motion"
import { Phone, Clock, AlertTriangle, User, ChevronRight, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type JobStatus, statusConfig, mechanics } from "@/lib/mock-data"
import type { UIJob } from "@/lib/job-transforms"
import { cn } from "@/lib/utils"

interface JobCardProps {
  job: UIJob
  onClick: () => void
  isMechanicMode?: boolean
  onStatusChange?: (jobId: string, newStatus: JobStatus) => void
  onMechanicChange?: (jobId: string, mechanicId: string) => void
  isDragging?: boolean
}

export function JobCard({ job, onClick, isMechanicMode, onStatusChange, onMechanicChange, isDragging }: JobCardProps) {
  const statusInfo = statusConfig[job.status]
  const statusOptions: JobStatus[] = ["received", "working", "ready", "completed"]

  const handleStatusChange = (newStatus: JobStatus) => {
    if (onStatusChange && newStatus !== job.status) {
      onStatusChange(job.id, newStatus)
    }
  }

  const handleMechanicChange = (mechanicId: string) => {
    if (onMechanicChange) {
      onMechanicChange(job.id, mechanicId)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: isDragging ? 1 : 1.01 }}
      whileTap={{ scale: isDragging ? 1 : 0.99 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          "cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
          "bg-card border-border",
          isMechanicMode && "p-1",
          isDragging && "opacity-50 rotate-2 scale-105 shadow-2xl"
        )}
      >
        <CardContent className={cn("p-4", isMechanicMode && "p-5")}>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            {/* <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{job.jobNumber}</span>
              {job.dviPending && (
                <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  DVI
                </Badge>
              )}
            </div> */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Badge 
                  className={cn(
                    "text-xs cursor-pointer gap-1 transition-all hover:opacity-80", 
                    statusInfo.bgColor, 
                    statusInfo.color, 
                    "border-0"
                  )}
                >
                  {statusInfo.label}
                  <ChevronDown className="w-3 h-3" />
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {statusOptions.map((status) => {
                  const option = statusConfig[status as JobStatus]
                  return (
                    <DropdownMenuItem
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusChange(status as JobStatus)
                      }}
                      className={cn(
                        "cursor-pointer",
                        job.status === status && "bg-accent"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full mr-2", option.bgColor)} />
                      {option.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Vehicle Info */}
          <div className="mb-3">
            <h3 className={cn("font-semibold text-foreground", isMechanicMode ? "text-lg" : "text-base")}>
              {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
            </h3>
            <p className={cn("text-muted-foreground font-mono", isMechanicMode ? "text-base" : "text-sm")}>
              {job.vehicle.regNo}
            </p>
          </div>

          {/* Customer Info */}
          <div className={cn("flex items-center gap-2 mb-3", isMechanicMode ? "text-base" : "text-sm")}>
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{job.customer.name}</span>
            {!isMechanicMode && job.customer.phone && (
              <a
                href={`tel:${job.customer.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-primary hover:underline ml-auto"
              >
                <Phone className="w-3 h-3" />
                <span className="text-xs">{job.customer.phone}</span>
              </a>
            )}
          </div>

          {/* Complaint Preview */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{job.complaints}</p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            {job.mechanic ? (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={job.mechanic.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {job.mechanic.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{job.mechanic.name}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">Unassigned</span>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{new Date(job.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
