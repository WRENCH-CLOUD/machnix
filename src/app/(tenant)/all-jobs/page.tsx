"use client"

import { useState, useEffect } from "react"
import { AllJobsView } from "@/components/tenant/views/all-jobs-view"
import { JobDetailsContainer } from "@/components/tenant/jobs/job-details-container"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
import { transformDatabaseJobToUI, type UIJob } from "@/modules/job/application/job-transforms-service"
import { type JobStatus } from "@/lib/mock-data"
import { api } from "@/lib/supabase/client"

export default function AllJobsPage() {
  const { user, tenantId } = useAuth()
  const [selectedJob, setSelectedJob] = useState<UIJob | null>(null)
  const [jobs, setJobs] = useState<UIJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && tenantId) {
      loadJobs()
    }
  }, [user, tenantId])

  const loadJobs = async () => {
    try {
      setLoading(true)
      // Call API route - business logic is in the use case
      const response = await api.get('/api/jobs')
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
      const response = await api.post(`/api/jobs/${jobId}/update-status`, { status: newStatus })
      
      if (!response.ok) {
        throw new Error('Failed to update job status')
      }
      
      await loadJobs()
      
      // Update selected job if it's the one being changed
      if (selectedJob?.id === jobId) {
        const updatedJobs = jobs.find(j => j.id === jobId)
        if (updatedJobs) {
          setSelectedJob({ ...updatedJobs, status: newStatus })
        }
      }
    } catch (err) {
      console.error('Error updating job status:', err)
      throw err
    }
  }

  if (loading) {
    return null; // Layout handles auth loading, page handles data loading
  }

  return (
    <>
      <AllJobsView
        jobs={jobs}
        onJobClick={handleJobClick}
      />

      {selectedJob && (
        <JobDetailsContainer
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          onJobUpdate={async () => {
            await loadJobs()
          }}
        />
      )}
    </>
  )
}
