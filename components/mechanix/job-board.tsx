"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { LayoutGrid, List, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { JobCard } from "./job-card"
import { type JobCard as JobCardType, type JobStatus, statusConfig } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface JobBoardProps {
  jobs: JobCardType[]
  onJobClick: (job: JobCardType) => void
  isMechanicMode: boolean
}

const statusOrder: JobStatus[] = ["received", "assigned", "working", "ready", "completed"]

export function JobBoard({ jobs, onJobClick, isMechanicMode }: JobBoardProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")

  const groupedJobs = statusOrder.reduce(
    (acc, status) => {
      acc[status] = jobs.filter((job) => job.status === status)
      return acc
    },
    {} as Record<JobStatus, JobCardType[]>,
  )

  if (viewMode === "list") {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Job Board</h1>
            <p className="text-muted-foreground">Manage all active service jobs</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className="rounded-none"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onClick={() => onJobClick(job)} isMechanicMode={isMechanicMode} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Board</h1>
          <p className="text-muted-foreground">
            {jobs.length} active jobs across {jobs.filter((j) => j.status !== "completed").length} in progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="rounded-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto px-6 pb-6">
        <div className="flex gap-4 h-full min-w-max">
          {statusOrder.map((status) => {
            const statusInfo = statusConfig[status]
            const columnJobs = groupedJobs[status]

            return (
              <div
                key={status}
                className="w-80 flex-shrink-0 flex flex-col bg-secondary/30 rounded-xl border border-border"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", statusInfo.bgColor)} />
                      <h3 className="font-semibold text-foreground">{statusInfo.label}</h3>
                    </div>
                    <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {columnJobs.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-3">
                    <AnimatePresence>
                      {columnJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onClick={() => onJobClick(job)}
                          isMechanicMode={isMechanicMode}
                        />
                      ))}
                    </AnimatePresence>
                    {columnJobs.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">No jobs in this status</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
