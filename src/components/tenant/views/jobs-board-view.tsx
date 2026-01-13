"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LayoutGrid, List, Filter, Car, User, Clock, ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type UIJob } from "@/modules/job/application/job-transforms-service";
import { statusConfig, type JobStatus } from "@/modules/job/domain/job.entity";
import { useIsMobile } from "@/hooks/use-mobile";

interface JobBoardProps {
  jobs: UIJob[];
  loading?: boolean;
  isMechanicMode?: boolean;
  onJobClick: (job: UIJob) => void;
  onStatusChange: (jobId: string, status: JobStatus) => void | Promise<void>;
  onMechanicChange?: (jobId: string, mechanicId: string) => void | Promise<void>;
}

const COLUMNS: { id: JobStatus; label: string }[] = [
  { id: "received", label: "Received" },
  { id: "working", label: "Working" },
  { id: "ready", label: "Ready for Payment" },
  { id: "completed", label: "Completed" },
];

const statusOrder: JobStatus[] = COLUMNS.map((column) => column.id);

function DroppableColumn({
  status,
  children,
  onContextMenu,
  isMobile,
}: {
  status: JobStatus;
  children: React.ReactNode;
  onContextMenu?: (e: React.MouseEvent) => void;
  isMobile?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${status}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "shrink-0 flex flex-col bg-secondary/30 rounded-xl border border-border h-full transition-all snap-start",
        isMobile ? "w-[calc(100vw-3rem)] min-w-70" : "w-72 lg:w-80",
        isOver && "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
      )}
      onContextMenu={onContextMenu}
    >
      {children}
    </div>
  );
}

function JobCardBody({ job, status, isMobile }: { job: UIJob; status: JobStatus; isMobile?: boolean }) {
  const config = statusConfig[status] || statusConfig.received;

  return (
    <div className={cn("space-y-2", isMobile ? "p-3" : "p-4 space-y-3")}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-primary">{job.jobNumber}</span>
        <Badge className={`${config.bgColor} ${config.color} border-0 text-[10px] px-1.5 py-0`}>
          {config.label}
        </Badge>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-sm truncate">
          <User className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="truncate">{job.customer.name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Car className="w-3 h-3 shrink-0" />
          <span className="truncate">{job.vehicle.make} {job.vehicle.model} • {job.vehicle.regNo}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(job.updatedAt).toLocaleDateString()}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-6 w-6 transition-opacity", isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function SortableJobCard({
  job,
  onClick,
}: {
  job: UIJob;
  onClick: () => void;
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
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
    opacity: isDragging ? 0.5 : 1,
  };

  const status = (job.status || "received") as JobStatus;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="group relative bg-card hover:shadow-md transition-all cursor-pointer border-border/50"
        onClick={onClick}
      >
        <JobCardBody job={job} status={status} />
      </Card>
    </div>
  );
}

export function JobBoardView({
  jobs,
  loading,
  onJobClick,
  onStatusChange,
}: JobBoardProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [hiddenStatuses, setHiddenStatuses] = useState<JobStatus[]>([]);
  const [uiJobs, setUiJobs] = useState<UIJob[]>(jobs);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    status: JobStatus;
  } | null>(null);
  const [activeJob, setActiveJob] = useState<UIJob | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setUiJobs(jobs);
  }, [jobs]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 10 : 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const groupedJobs = statusOrder.reduce(
    (acc, status) => {
      if (status === "completed") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        acc[status] = uiJobs.filter((job) => {
          if (job.status !== status) return false;

          const updatedDate = new Date(job.updatedAt);
          updatedDate.setHours(0, 0, 0, 0);

          return updatedDate.getTime() === today.getTime();
        });
      } else {
        acc[status] = uiJobs.filter((job) => job.status === status);
      }
      return acc;
    },
    {} as Record<JobStatus, UIJob[]>
  );

  const visibleStatuses = statusOrder.filter(
    (status) => !hiddenStatuses.includes(status)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const job = uiJobs.find((j) => j.id === active.id);
    if (job) {
      setActiveJob(job);
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {};

  const validateStatusTransition = (
    fromStatus: string,
    toStatus: string
  ): boolean => {
    const validTransitions: Record<string, string[]> = {
      received: ["received", "working"],
      working: ["received", "working", "ready"],
      ready: ["working", "ready", "completed"],
      completed: ["completed"],
    };

    return validTransitions[fromStatus]?.includes(toStatus) ?? false;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedJob = activeJob;
    setActiveJob(null);

    if (!over || !draggedJob) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let targetStatus: JobStatus | undefined;

    if (overId.startsWith("droppable-")) {
      targetStatus = statusOrder.find(
        (status) => overId === `droppable-${status}`
      );
    } else {
      const overJob = uiJobs.find((j) => j.id === overId);
      if (overJob) {
        targetStatus = overJob.status as JobStatus;
      }
    }

    if (targetStatus && draggedJob.status !== targetStatus) {
      const isValidTransition = validateStatusTransition(
        draggedJob.status,
        targetStatus
      );

      if (!isValidTransition) {
        return;
      }

      // Update UI immediately to keep drag/drop smooth.
      const updatedAt = new Date().toISOString();
      const previousUiJobs = uiJobs;
      setUiJobs((prev) =>
        prev.map((job) =>
          job.id === activeId
            ? {
                ...job,
                status: targetStatus as string,
                updatedAt,
                updated_at: updatedAt,
              }
            : job
        )
      );

      if (onStatusChange) {
        try {
          await onStatusChange(activeId, targetStatus);
        } catch (error) {
          console.error("Failed to update job status:", error);
          setUiJobs(previousUiJobs);
        }
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, status: JobStatus) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, status });
  };

  const hideStatus = (status: JobStatus) => {
    setHiddenStatuses((prev) => [...prev, status]);
    setContextMenu(null);
  };

  const unhideAll = () => {
    setHiddenStatuses([]);
    setContextMenu(null);
  };

  const handleClickOutside = () => {
    if (contextMenu) setContextMenu(null);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center">Loading...</div>;
  }

  if (viewMode === "list") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Job Board</h1>
            <p className="text-muted-foreground">
              Manage all active service jobs
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

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="group relative bg-card hover:shadow-md transition-all cursor-pointer border-border/50"
                onClick={() => onJobClick(job)}
              >
                <JobCardBody
                  job={job}
                  status={(job.status || "received") as JobStatus}
                />
              </Card>
            ))}
            {jobs.length === 0 && (
              <div className="h-24 flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg text-xs text-muted-foreground">
                No jobs
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" onClick={handleClickOutside}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-border shrink-0 gap-2">
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-foreground">Job Board</h1>
          <p className="text-muted-foreground text-xs md:text-sm truncate">
            {jobs.length} active jobs •{" "}
            {jobs.filter((j) => j.status !== "completed").length} in progress
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hiddenStatuses.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={unhideAll}
            >
              <span className="hidden sm:inline">Unhide All</span> ({hiddenStatuses.length})
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1 md:gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="rounded-none px-2 md:px-3"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none px-2 md:px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3 md:px-6 py-3 md:py-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className={cn(
            "flex gap-2 md:gap-3 h-full w-full overflow-x-auto pb-2",
            isMobile && "snap-x snap-mandatory scroll-smooth"
          )}>
            {visibleStatuses.map((status) => {
              const statusInfo = statusConfig[status];
              const columnJobs = groupedJobs[status];

              return (
                <DroppableColumn
                  key={status}
                  status={status}
                  isMobile={isMobile}
                  onContextMenu={(e) => handleContextMenu(e, status)}
                >
                  <div className="p-3 border-b border-border shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full",
                            statusInfo.bgColor
                          )}
                        />
                        <h3 className="font-semibold text-foreground text-sm">
                          {statusInfo.label}
                        </h3>
                      </div>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {columnJobs.length}
                      </span>
                    </div>
                  </div>

                  <SortableContext
                    items={columnJobs.map((job) => job.id)}
                    strategy={verticalListSortingStrategy}
                    id={`droppable-${status}`}
                  >
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {columnJobs.map((job) => (
                        <SortableJobCard
                          key={job.id}
                          job={job}
                          onClick={() => onJobClick(job)}
                        />
                      ))}
                      {columnJobs.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                          No jobs in this status
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeJob ? (
              <Card className="group relative bg-card border-border/50">
                <JobCardBody
                  job={activeJob}
                  status={(activeJob.status || "received") as JobStatus}
                />
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

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
            <span className="font-medium">
              {statusConfig[contextMenu.status].label}
            </span>
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
  );
}
