"use client"

import { useState, useEffect } from "react"
import { AllJobsView } from "@/components/tenant/views/all-jobs-view"
import { JobDetailsContainer } from "@/components/tenant/jobs/job-details-container"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
import { transformDatabaseJobToUI, type UIJob } from "@/modules/job/application/job-transforms-service"
import { type JobStatus } from "@/modules/job/domain/job.entity"
import { api } from "@/lib/supabase/client"
import { UnpaidWarningDialog } from "@/components/tenant/dialogs/unpaid-warning-dialog"

export default function AllJobsPage() {
  const { user, tenantId } = useAuth()
  const [selectedJob, setSelectedJob] = useState<UIJob | null>(null)
  const [jobs, setJobs] = useState<UIJob[]>([])
  const [loading, setLoading] = useState(true)

  // Unpaid warning dialog state
  const [showUnpaidWarning, setShowUnpaidWarning] = useState(false)
  const [pendingCompletion, setPendingCompletion] = useState<{
    jobId: string;
    invoiceId: string;
    balance: number;
    jobNumber: string;
  } | null>(null)

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
      
      // Handle payment required response (402)
      if (response.status === 402) {
        const data = await response.json()
        if (data.paymentRequired) {
          const job = jobs.find(j => j.id === jobId)
          setPendingCompletion({
            jobId,
            invoiceId: data.invoiceId,
            balance: data.balance,
            jobNumber: data.jobNumber || job?.jobNumber,
          })
          setShowUnpaidWarning(true)
          return
        }
      }

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

  const handleMarkPaidAndComplete = async (paymentMethod: string, referenceId?: string) => {
    if (!pendingCompletion) return

    try {
      // 1. Record Payment
      const payRes = await api.post(`/api/invoices/${pendingCompletion.invoiceId}/pay`, {
        amount: pendingCompletion.balance,
        method: paymentMethod,
        referenceId
      })

      if (!payRes.ok) {
        throw new Error('Failed to record payment')
      }

      // 2. Update Job Status to completed
      const statusRes = await api.post(`/api/jobs/${pendingCompletion.jobId}/update-status`, { 
        status: 'completed' 
      })

      if (!statusRes.ok) {
        throw new Error('Failed to complete job')
      }

      await loadJobs()
      setShowUnpaidWarning(false)
      setPendingCompletion(null)
    } catch (err) {
      console.error('Error marking paid and completing:', err)
      throw err
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await api.delete(`/api/jobs/${jobId}`)
      if (!res.ok) throw new Error('Failed to delete job')
      await loadJobs()
    } catch (err) {
      console.error('Error deleting job:', err)
      alert('Failed to delete job')
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
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteJob}
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

      {showUnpaidWarning && pendingCompletion && (
        <UnpaidWarningDialog
          isOpen={showUnpaidWarning}
          onClose={() => {
            setShowUnpaidWarning(false)
            setPendingCompletion(null)
          }}
          jobNumber={pendingCompletion.jobNumber}
          outstandingBalance={pendingCompletion.balance}
          invoiceId={pendingCompletion.invoiceId}
          onCancel={() => {
            setShowUnpaidWarning(false)
            setPendingCompletion(null)
          }}
          onMarkPaidAndComplete={handleMarkPaidAndComplete}
        />
      )}
    </>
  )
}
