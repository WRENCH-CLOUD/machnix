"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Wrench, LogOut, Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/providers/auth-provider";
import { mockJobs } from "@/lib/mock-data";
// TODO: add read mechanic jobs from API or db or table whatever
import { MechanicJobDetailDialog } from "./mechanic-job-detail-dialog";

export function MechanicDashboardView() {
  const { user, signOut } = useAuth();
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"status" | "dvi" | "info">(
    "status"
  );

  // Filter jobs assigned to this mechanic (using mock ID "m1" as fallback if user ID matches nothing)
  // This is a simplified frontend-only filtering for now as requested
  const mechanicJobs = mockJobs.filter(
    (job) =>
      (job.mechanic?.id === user?.id || job.mechanic?.id === "m1") &&
      job.status !== "completed"
  );

  const completedJobs = mockJobs.filter(
    (job) =>
      (job.mechanic?.id === user?.id || job.mechanic?.id === "m1") &&
      job.status === "completed"
  );

  return (
    //FIXME: import the tenantName avtar and all from the interface or something
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
              <p className="text-xs text-muted-foreground">
                {user?.tenantName || "Garage A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mechanic Profile Bar */}
        <div className="flex items-center gap-3 mt-4 p-3 bg-secondary/50 rounded-xl">
          <Avatar className="w-12 h-12 border-2 border-primary">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} />
            <AvatarFallback>{user?.name?.charAt(0) || "M"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              {user?.name || "Mechanic"}
            </p>
            <p className="text-sm text-muted-foreground">Engine Specialist</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {mechanicJobs.length}
            </p>
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
                <p className="text-sm text-muted-foreground">
                  No pending jobs assigned to you
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {mechanicJobs.map((job) => (
                  <MechanicJobCard
                    key={job.id}
                    job={job}
                    onClick={() => setSelectedJob(job)}
                  />
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
                  <MechanicJobCard
                    key={job.id}
                    job={job}
                    onClick={() => setSelectedJob(job)}
                    isCompleted
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <MechanicJobDetailDialog
            job={selectedJob}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={() => {
              setSelectedJob(null);
              setActiveTab("status");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
