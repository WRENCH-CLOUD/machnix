"use client"

import { useState, useEffect, useMemo } from "react"
import { AllJobsView } from "@/components/tenant/views/all-jobs-view"
import { JobDetailsContainer } from "@/components/tenant/jobs/job-details-container"
import { useAuth } from "@/providers/auth-provider"
import { useJobs, useInvalidateQueries, useTenantSettings } from "@/hooks"
import { transformDatabaseJobToUI, type UIJob } from "@/modules/job/application/job-transforms-service"
import { type JobStatus } from "@/modules/job/domain/job.entity"
import { api } from "@/lib/supabase/client"
import { UnpaidWarningDialog } from "@/components/tenant/dialogs/unpaid-warning-dialog"

export default function AllJobsPage() {
  const { user, tenantId } = useAuth()
  const [selectedJob, setSelectedJob] = useState<UIJob | null>(null)
  const [transformedJobs, setTransformedJobs] = useState<UIJob[]>([])
  const { invalidateJobs } = useInvalidateQueries()

  // Unpaid warning dialog state
  const [showUnpaidWarning, setShowUnpaidWarning] = useState(false)
  const [pendingCompletion, setPendingCompletion] = useState<{
    jobId: string;
    invoiceId: string;
    balance: number;
    jobNumber: string;
  } | null>(null)

  // Use shared jobs query
  const { data: dbJobs, isLoading } = useJobs(tenantId)

  // Fetch tenant settings once at the page level
  const { data: tenantSettings } = useTenantSettings()

  // Transform tenant settings to match the format expected by JobDetailsContainer
  const tenantDetails = useMemo(() => ({
    name: tenantSettings?.legalName || "Garage",
    address: tenantSettings?.address || "",
    gstin: tenantSettings?.gstNumber || "",
  }), [tenantSettings])

  // Transform jobs when data changes
  useEffect(() => {
    const transformJobs = async () => {
      if (!dbJobs) {
        setTransformedJobs([])
        return
      }
      const jobs = await Promise.all(
        dbJobs.map((job: any) => transformDatabaseJobToUI(job))
      )
      setTransformedJobs(jobs)
    }
    transformJobs()
  }, [dbJobs])

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
          const job = transformedJobs.find(j => j.id === jobId)
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
      
      await invalidateJobs()
      
      // Update selected job if it's the one being changed
      if (selectedJob?.id === jobId) {
        const updatedJob = transformedJobs.find(j => j.id === jobId)
        if (updatedJob) {
          setSelectedJob({ ...updatedJob, status: newStatus })
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

      await invalidateJobs()
      setShowUnpaidWarning(false)
      setPendingCompletion(null)
    } catch (err) {
      console.error('Error marking paid and completing:', err)
      throw err
    }
  }

  if (isLoading) {
    return null; // Layout handles auth loading, page handles data loading
  }

  return (
    <>
      <AllJobsView
        jobs={transformedJobs}
        onJobClick={handleJobClick}
      />

      {selectedJob && (
        <JobDetailsContainer
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          onJobUpdate={async () => {
            await invalidateJobs()
          }}
          tenantDetails={tenantDetails}
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
