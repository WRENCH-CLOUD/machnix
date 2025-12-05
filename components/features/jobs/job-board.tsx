"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { LayoutGrid, List, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { JobCard } from "./job-card"
import { type JobCard as JobCardType, type JobStatus, statusConfig } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface JobBoardProps {
  jobs: JobCardType[]
  onJobClick: (job: JobCardType) => void
  isMechanicMode: boolean
  onStatusChange?: (jobId: string, newStatus: JobStatus) => void
  onMechanicChange?: (jobId: string, mechanicId: string) => void
  loading?: boolean
}

const statusOrder: JobStatus[] = ["received", "working", "ready", "completed"]

export function JobBoard({ jobs, onJobClick, isMechanicMode, onStatusChange, onMechanicChange, loading = false }: JobBoardProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [hiddenStatuses, setHiddenStatuses] = useState<JobStatus[]>([])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; status: JobStatus } | null>(null)

  const groupedJobs = statusOrder.reduce(
    (acc, status) => {
      acc[status] = jobs.filter((job) => job.status === status)
      return acc
    },
    {} as Record<JobStatus, JobCardType[]>,
  )

  const visibleStatuses = statusOrder.filter((status) => !hiddenStatuses.includes(status))

  const handleContextMenu = (e: React.MouseEvent, status: JobStatus) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, status })
  }

  const hideStatus = (status: JobStatus) => {
    setHiddenStatuses((prev) => [...prev, status])
    setContextMenu(null)
  }

  const unhideAll = () => {
    setHiddenStatuses([])
    setContextMenu(null)
  }

  // Close context menu on click outside
  const handleClickOutside = () => {
    if (contextMenu) setContextMenu(null)
  }

  if (viewMode === "list") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
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

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={() => onJobClick(job)}
                    isMechanicMode={isMechanicMode}
                    onStatusChange={onStatusChange}
                    onMechanicChange={onMechanicChange}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" onClick={handleClickOutside}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Board</h1>
          <p className="text-muted-foreground text-sm">
            {jobs.length} active jobs • {jobs.filter((j) => j.status !== "completed").length} in progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hiddenStatuses.length > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={unhideAll}>
              Unhide All ({hiddenStatuses.length})
            </Button>
          )}
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
      <div className="flex-1 overflow-hidden px-6 py-4">
        <div className="flex gap-3 h-full w-full overflow-x-auto">
          {visibleStatuses.map((status) => {
            const statusInfo = statusConfig[status]
            const columnJobs = groupedJobs[status]

            return (
              <div
                key={status}
                className="w-80 shrink-0 flex flex-col bg-secondary/30 rounded-xl border border-border h-full"
                onContextMenu={(e) => handleContextMenu(e, status)}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-border shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", statusInfo.bgColor)} />
                      <h3 className="font-semibold text-foreground text-sm">{statusInfo.label}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {columnJobs.length}
                    </span>
                  </div>
                </div>

                {/* Column Content with Scroll */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <AnimatePresence>
                        {columnJobs.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            onClick={() => onJobClick(job)}
                            isMechanicMode={isMechanicMode}
                            onStatusChange={onStatusChange}
                            onMechanicChange={onMechanicChange}
                          />
                        ))}
                      </AnimatePresence>
                      {columnJobs.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-xs">No jobs in this status</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-card border border-border rounded-lg shadow-lg py-1 z-50 min-w-40"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
            onClick={() => hideStatus(contextMenu.status)}
          >
            <span className="text-muted-foreground">Hide</span>
            <span className="font-medium">{statusConfig[contextMenu.status].label}</span>
          </button>
          {hiddenStatuses.length > 0 && (
            <>
              <div className="h-px bg-border my-1" />
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors text-primary"
                onClick={unhideAll}
              >
                Unhide All ({hiddenStatuses.length})
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
