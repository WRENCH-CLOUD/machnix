"use client";

import { Car, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type JobStatus } from "@/lib/mock-data";//  TODO: change this to real JobStatus
import { cn } from "@/lib/utils";

// this is a mock data
export const statusConfig: Record<
  JobStatus,
  { label: string; color: string; bgColor: string }
> = {
  received: {
    label: "Received",
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
  },
  assigned: {
    label: "Assigned",
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
  },
  working: {
    label: "Working",
    color: "text-amber-500",
    bgColor: "bg-amber-500/20",
  },
  ready: {
    label: "Ready",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/20",
  },
  completed: {
    label: "Completed",
    color: "text-gray-500",
    bgColor: "bg-gray-500/20",
  },
};

// Minimal interface for what the card needs
export interface MechanicJobCardProps {
  job: {
    id: string;
    jobNumber: string;
    status: string; // simplified from JobStatus to string to be flexible
    complaints: string;
    dviPending?: boolean;
    vehicle: {
      make: string;
      model: string;
      regNo: string;
    };
  };
  onClick: () => void;
  isCompleted?: boolean;
}

export function MechanicJobCard({ job, onClick, isCompleted }: MechanicJobCardProps) {
  const info = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.received
  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={onClick}>
      <Card
        className={cn(
          "overflow-hidden cursor-pointer transition-all active:bg-secondary/80",
          isCompleted && "opacity-60"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                info.bgColor
              )}
            >
              <Car className={cn("w-7 h-7", info.color)} />
            </div>
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
              <p className="text-sm font-mono text-muted-foreground mb-2">
                {job.vehicle.regNo}
              </p>
              <div className="flex items-center justify-between">
                <Badge
                  className={cn(
                    "text-xs font-medium",
                    info.bgColor,
                    info.color,
                    "border-0"
                  )}
                >
                  {info.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {job.jobNumber}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-4" />
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {job.complaints}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
