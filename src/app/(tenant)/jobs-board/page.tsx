"use client"

import "reflect-metadata"
import { useState, useEffect } from "react"
import { JobBoardView } from "@/components/tenant/views/jobs-board-view"
import { JobDetailsContainer } from "@/components/tenant/jobs/job-details-container"
import { CreateJobWizard } from "@/components/tenant/jobs/create-job-wizard"
import { useAuth } from "@/providers/auth-provider"
import { transformDatabaseJobToUI, type UIJob } from "@/modules/job/application/job-transforms-service"
import { statusConfig, type JobStatus } from '@/modules/job/domain/job.entity'
import { api } from "@/lib/supabase/client"
import { UnpaidWarningDialog } from "@/components/tenant/dialogs/unpaid-warning-dialog"

export default function JobsPage() {
  const { user, tenantId } = useAuth()
  const [selectedJob, setSelectedJob] = useState<UIJob | null>(null)
  const [jobs, setJobs] = useState<UIJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateJob, setShowCreateJob] = useState(false)

  useEffect(() => {
    const handleOpenCreateJob = () => setShowCreateJob(true);
    window.addEventListener('open-create-job', handleOpenCreateJob);
    
    // Check search params
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setShowCreateJob(true);
      // Clean up search params
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => window.removeEventListener('open-create-job', handleOpenCreateJob);
  }, []);

  // Unpaid warning dialog state
  const [showUnpaidWarning, setShowUnpaidWarning] = useState(false)
  const [pendingCompletion, setPendingCompletion] = useState<{
    jobId: string;
    invoiceId: string;
    balance: number;
    jobNumber: string;
  } | null>(null)

  const validateStatusTransition = (fromStatus: string, toStatus: string): boolean => {
    const validTransitions: Record<string, string[]> = {
      'received': ['received', 'working'],
      'working': ['received', 'working', 'ready'],
      'ready': ['working', 'ready', 'completed'],
      'completed': ['completed'],
    }
    return validTransitions[fromStatus]?.includes(toStatus) ?? false
  }
  useEffect(() => {
    if (user && tenantId) {
      loadJobs()
    }
  }, [user, tenantId])

  const loadJobs = async () => {
    try {
      setLoading(true)
      // Call API routes
      const jobsRes = await api.get('/api/jobs')

      if (!jobsRes.ok) throw new Error('Failed to fetch jobs')
      
      const dbJobs = await jobsRes.json()
      const transformedJobs = await Promise.all(
        dbJobs.map((job: any) => transformDatabaseJobToUI(job))
      )
      setJobs(transformedJobs)
    } catch (err) {
      console.error('Error loading jobs board data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJobClick = async (job: UIJob) => {
    setSelectedJob(job)
  }

  const handleStatusChange = async (jobId: string, newStatus: JobStatus): Promise<void> => {
    try {
      const oldJob = jobs.find(job => job.id === jobId)
      const oldStatus = oldJob?.status
      
      if (!oldStatus) {
        console.error('Job not found:', jobId)
        return
      }

      // 1. Validate status transition
      const isValidTransition = validateStatusTransition(oldStatus, newStatus)
      if (!isValidTransition) {
        alert(`Cannot change status from ${statusConfig[oldStatus as JobStatus]?.label} to ${statusConfig[newStatus]?.label}`)
        return
      }

      if (oldStatus === 'completed') {
        alert('Cannot change status of a completed job')
        return
      }

      // 2. Handle Payment Validation before completing
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        const invRes = await api.get(`/api/invoices/by-job/${jobId}`)
        
        if (invRes.ok) {
          const invoice = await invRes.json()
          if (invoice && invoice.balance && invoice.balance > 0) {
            setPendingCompletion({
              jobId,
              invoiceId: invoice.id,
              balance: invoice.balance,
              jobNumber: oldJob?.jobNumber,
            })
            setShowUnpaidWarning(true)
            return
          }
        } else if (invRes.status === 404) {
          const estRes = await api.get(`/api/estimates/by-job/${jobId}`)
          if (!estRes.ok) {
            alert('Cannot complete job: No estimate found for this job.')
            return
          }

          const estimate = await estRes.json()
          if (!estimate || !estimate.id) {
            alert('Cannot complete job: Invalid estimate data.')
            return
          }

          const genRes = await api.post(`/api/invoices/generate`, { estimateId: estimate.id })
          if (!genRes.ok) {
            alert('Failed to generate invoice from estimate before completing job.')
            return
          }

          const invoice = await genRes.json()
          if (invoice && invoice.balance && invoice.balance > 0) {
            setPendingCompletion({
              jobId,
              invoiceId: invoice.id,
              balance: invoice.balance,
              jobNumber: oldJob?.jobNumber,
            })
            setShowUnpaidWarning(true)
            return
          }
        }
      }

      // 3. Update Status
      let response = await api.post(`/api/jobs/${jobId}/update-status`, { status: newStatus })
      
      if (!response.ok) {
        response = await api.patch(`/api/jobs/${jobId}`, { status: newStatus })
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

  const handleMechanicChange = async (jobId: string, mechanicId: string) => {
    try {
      const response = await api.post(`/api/jobs/${jobId}/assign-mechanic`, { mechanicId })
      if (!response.ok) {
        throw new Error('Failed to assign mechanic')
      }
      await loadJobs()
    } catch (err) {
      console.error('Error updating mechanic:', err)
      alert('Failed to assign mechanic')
    }
  }

  if (loading) {
    return null
  }

  return (
    <>
      <JobBoardView
        jobs={jobs}
        onJobClick={handleJobClick}
        onStatusChange={handleStatusChange}
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

      {showCreateJob && (
        <CreateJobWizard
          isOpen={showCreateJob}
          onClose={() => setShowCreateJob(false)}
          onSuccess={async () => {
            setShowCreateJob(false)
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
