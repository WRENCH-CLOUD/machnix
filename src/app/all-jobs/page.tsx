"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/common/app-sidebar"
import { TopHeader } from "@/components/common/top-header"
import { AllJobsView } from "@/components/features/jobs/all-jobs-view"
import { JobDetails } from "@/components/features/jobs/job-details"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
import { JobService } from "@/lib/supabase/services/job.service"
import { transformDatabaseJobToUI, type UIJob } from "@/lib/job-transforms"
import { type JobStatus } from "@/lib/mock-data"

export default function AllJobsPage() {
  const { user, loading: authLoading, tenantId } = useAuth()
  const router = useRouter()
  const [selectedJob, setSelectedJob] = useState<UIJob | null>(null)
  const [jobs, setJobs] = useState<UIJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
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
      const dbJobs = await JobService.getJobs()
      const transformedJobs = await Promise.all(
        dbJobs.map((job) => transformDatabaseJobToUI(job))
      )
      setJobs(transformedJobs)
    } catch (err) {
      console.error('Error loading jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJobClick = async (job: UIJob) => {
    try {
      const fullJob = await JobService.getJobById(job.id)
      const transformedJob = await transformDatabaseJobToUI(fullJob)
      setSelectedJob(transformedJob)
    } catch (err) {
      console.error('Error loading job details:', err)
      setSelectedJob(job)
    }
  }

  const handleStatusChange = async (jobId: string, newStatus: JobStatus): Promise<void> => {
    try {
      await JobService.updateJob(jobId, { status: newStatus })
      await loadJobs()
      
      // Update selected job if it's the one being changed
      if (selectedJob?.id === jobId) {
        const updatedJob = await JobService.getJobById(jobId)
        const transformedJob = await transformDatabaseJobToUI(updatedJob)
        setSelectedJob(transformedJob)
      }
    } catch (err) {
      console.error('Error updating job status:', err)
      throw err
    }
  }

  if (authLoading || loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activeView="all-jobs" onViewChange={(view) => router.push(`/${view}`)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          tenantName="Mechanix Garage"
          onCreateJob={() => router.push("/jobs")}
        />
        <main className="flex-1 overflow-auto p-6">
          <AllJobsView
            jobs={jobs}
            onJobClick={handleJobClick}
          />
        </main>
      </div>

      {selectedJob && (
        <JobDetails
          job={selectedJob}
          isMechanicMode={false}
          onClose={() => setSelectedJob(null)}
          onStatusChange={handleStatusChange}
          onJobUpdate={async () => {
            // Refresh the job list
            await loadJobs()
            // Refresh the selected job details
            const updatedJob = await JobService.getJobById(selectedJob.id)
            const transformedJob = await transformDatabaseJobToUI(updatedJob)
            setSelectedJob(transformedJob)
          }}
        />
      )}
    </div>
  )
}
