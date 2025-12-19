"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence } from "framer-motion"
import { LayoutGrid, List, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { JobCard } from "./job-card"
import { type JobStatus, statusConfig } from "@/lib/mock-data"
import type { UIJob } from "@/modules/job-management/application/job-transforms.service"
import { cn } from "@/lib/utils"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface JobBoardProps {
  jobs: UIJob[]
  onJobClick: (job: UIJob) => void
  isMechanicMode: boolean
  onStatusChange?: (jobId: string, newStatus: JobStatus) => void
  onMechanicChange?: (jobId: string, mechanicId: string) => void
  loading?: boolean
}

const statusOrder: JobStatus[] = ["received", "working", "ready", "completed"]

// Droppable Column Component
function DroppableColumn({
  status,
  children,
  onContextMenu,
}: {
  status: JobStatus
  children: React.ReactNode
  onContextMenu: (e: React.MouseEvent) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${status}`,
  })

  const statusInfo = statusConfig[status]

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-80 shrink-0 flex flex-col bg-secondary/30 rounded-xl border border-border h-full transition-all",
        isOver && "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
      )}
      onContextMenu={onContextMenu}
    >
      {children}
    </div>
  )
}

// Sortable Job Card Wrapper
function SortableJobCard({ 
  job, 
  onJobClick, 
  isMechanicMode, 
  onStatusChange, 
  onMechanicChange 
}: { 
  job: UIJob
  onJobClick: (job: UIJob) => void
  isMechanicMode: boolean
  onStatusChange?: (jobId: string, newStatus: JobStatus) => void
  onMechanicChange?: (jobId: string, mechanicId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: job.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard
        job={job}
        onClick={() => onJobClick(job)}
        isMechanicMode={isMechanicMode}
        onStatusChange={onStatusChange}
        onMechanicChange={onMechanicChange}
        isDragging={isDragging}
      />
    </div>
  )
}

export function JobBoard({ jobs, onJobClick, isMechanicMode, onStatusChange, onMechanicChange, loading = false }: JobBoardProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [hiddenStatuses, setHiddenStatuses] = useState<JobStatus[]>([])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; status: JobStatus } | null>(null)
  const [activeJob, setActiveJob] = useState<UIJob | null>(null)
  const [optimisticJobs, setOptimisticJobs] = useState<UIJob[]>(jobs)
  const [isUpdating, setIsUpdating] = useState(false)
  const prevJobsRef = useRef<UIJob[]>(jobs)

  // Sync optimistic state with actual jobs when they change
  useEffect(() => {
    // Only update if jobs actually changed (prevent infinite loops)
    if (!isUpdating && jobs !== prevJobsRef.current) {
      prevJobsRef.current = jobs
      setOptimisticJobs(jobs)
    }
  }, [jobs, isUpdating])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced for better responsiveness
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const groupedJobs = statusOrder.reduce(
    (acc, status) => {
      if (status === 'completed') {
        // For completed status, only show jobs completed today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        acc[status] = optimisticJobs.filter((job) => {
          if (job.status !== status) return false
          
          const updatedDate = new Date(job.updatedAt)
          updatedDate.setHours(0, 0, 0, 0)
          
          return updatedDate.getTime() === today.getTime()
        })
      } else {
        acc[status] = optimisticJobs.filter((job) => job.status === status)
      }
      return acc
    },
    {} as Record<JobStatus, UIJob[]>,
  )

  const visibleStatuses = statusOrder.filter((status) => !hiddenStatuses.includes(status))

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const job = optimisticJobs.find((j) => j.id === active.id)
    if (job) {
      setActiveJob(job)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    // No-op - all updates happen in handleDragEnd for consistency
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    const draggedJob = activeJob
    setActiveJob(null)

    if (!over || !draggedJob) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dropped on a status column or on another job
    let targetStatus: JobStatus | undefined
    
    // First check if dropped directly on a column
    if (overId.startsWith('droppable-')) {
      targetStatus = statusOrder.find((status) => overId === `droppable-${status}`)
    } else {
      // If dropped on another job, find that job's status
      const overJob = optimisticJobs.find((j) => j.id === overId)
      if (overJob) {
        targetStatus = overJob.status as JobStatus
      }
    }

    if (targetStatus && draggedJob.status !== targetStatus) {
      // Lifecycle Guardrail: Validate transition before optimistic update
      const isValidTransition = validateStatusTransition(draggedJob.status, targetStatus)
      
      if (!isValidTransition) {
        // Don't allow invalid transitions - show brief feedback
        console.warn(`Invalid status transition: ${draggedJob.status} -> ${targetStatus}`)
        return
      }

      // Optimistic update - update UI immediately
      setIsUpdating(true)
      setOptimisticJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === activeId
            ? { ...job, status: targetStatus, updated_at: new Date().toISOString() }
            : job
        )
      )

      // Actual update (will check payment for completion in handleStatusChange)
      if (onStatusChange) {
        try {
          await onStatusChange(activeId, targetStatus)
        } catch (error) {
          // Revert optimistic update on error
          console.error('Failed to update job status:', error)
          setOptimisticJobs(jobs)
        } finally {
          // Small delay to ensure smooth transition
          setTimeout(() => setIsUpdating(false), 100)
        }
      }
    }
  }

  // Validate status transitions based on job lifecycle
  const validateStatusTransition = (fromStatus: string, toStatus: string): boolean => {
    // Status progression: received <-> working <-> ready -> completed
    // Allow moving backward except from completed
    const validTransitions: Record<string, string[]> = {
      'received': ['received', 'working'],
      'working': ['received', 'working', 'ready'],
      'ready': ['working', 'ready', 'completed'],
      'completed': ['completed'], // Cannot change from completed
    }

    return validTransitions[fromStatus]?.includes(toStatus) ?? false
  }

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full w-full overflow-x-auto">
            {visibleStatuses.map((status) => {
              const statusInfo = statusConfig[status]
              const columnJobs = groupedJobs[status]

              return (
                <DroppableColumn
                  key={status}
                  status={status}
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
                  <SortableContext
                    items={columnJobs.map((job) => job.id)}
                    strategy={verticalListSortingStrategy}
                    id={`droppable-${status}`}
                  >
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
                              <SortableJobCard
                                key={job.id}
                                job={job}
                                onJobClick={onJobClick}
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
                  </SortableContext>
                </DroppableColumn>
              )
            })}
          </div>
          
          <DragOverlay>
            {activeJob ? (
              <JobCard
                job={activeJob}
                onClick={() => {}}
                isMechanicMode={isMechanicMode}
                isDragging={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
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
