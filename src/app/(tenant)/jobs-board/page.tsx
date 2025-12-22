"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/common/app-sidebar"
import { TopHeader } from "@/components/common/top-header"
import { JobBoard } from "legacy/Legacy-ui(needed-to-migrate)/jobs/job-board"
import { JobDetails } from "legacy/Legacy-ui(needed-to-migrate)/jobs/job-details"
import { CreateJobWizard } from "legacy/Legacy-ui(needed-to-migrate)/jobs/create-job-wizard"
// TODO: add JobBoard and JobDetails and CreateJobWizard from new components when ready
import { JobDetailsContainer } from "@/components/tenant/jobs/job-details-container"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
import { transformDatabaseJobToUI, type UIJob } from "@/modules/job/application/job-transforms-service"
import { type JobStatus } from "@/lib/mock-data"

export default function JobsPage() {
  const { user, loading: authLoading, tenantId } = useAuth()
  const router = useRouter()
  const [selectedJob, setSelectedJob] = useState<UIJob | null>(null)
  const [jobs, setJobs] = useState<UIJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateJob, setShowCreateJob] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && tenantId) {
      loadJobs()
    }
  }, [user, tenantId])

  const loadJobs = async () => {
    try {
      setLoading(true)
      // Call API route - business logic is in the use case
      const response = await fetch('/api/jobs')
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      const dbJobs = await response.json()
      const transformedJobs = await Promise.all(
        dbJobs.map((job: any) => transformDatabaseJobToUI(job))
      )
      setJobs(transformedJobs)
    } catch (err) {
      console.error('Error loading jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJobClick = async (job: UIJob) => {
    setSelectedJob(job)
  }

  const handleStatusChange = async (jobId: string, newStatus: JobStatus): Promise<void> => {
    try {
      // Call API route - business logic is in the use case
      let response = await fetch(`/api/jobs/${jobId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!response.ok) {
        // Fallback to PATCH if the specific route doesn't exist
        response = await fetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error("Failed to update job status");
        }
      }
      
      await loadJobs()
    } catch (err) {
      console.error('Error updating job status:', err)
      throw err
    }
  }

  const handleMechanicChange = async (jobId: string, mechanicId: string) => {
    try {
      // Note: This would need a dedicated API endpoint for mechanic assignment
      // For now, keeping simplified
      await loadJobs()
    } catch (err) {
      console.error('Error updating mechanic:', err)
    }
  }

  if (authLoading || loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activeView="jobs" onViewChange={(view) => router.push(`/${view}`)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          tenantName="Mechanix Garage"
          onCreateJob={() => setShowCreateJob(true)}
        />
        <main className="flex-1 overflow-auto p-6">
          <JobBoard
            jobs={jobs}
            loading={loading}
            isMechanicMode={false}
            onJobClick={handleJobClick}
            onStatusChange={handleStatusChange}
            onMechanicChange={handleMechanicChange}
          />
        </main>
      </div>

      {selectedJob && (
        <JobDetailsContainer
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          onJobUpdate={async () => {
            // Refresh the job list
            await loadJobs()
          }}
          currentUser={user}
        />
      )}

      {showCreateJob && (
        <CreateJobWizard
          onClose={() => setShowCreateJob(false)}
          onSubmit={async () => {
            await loadJobs()
            setShowCreateJob(false)
          }}
        />
      )}
    </div>
  )
}
