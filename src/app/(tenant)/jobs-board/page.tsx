"use client"

import "reflect-metadata"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { JobBoardView } from "@/components/tenant/views/jobs-board-view"
import { JobDetailsContainer } from "@/components/tenant/jobs/job-details-container"
import { CreateJobWizard } from "@/components/tenant/jobs/create-job-wizard"
import { useAuth } from "@/providers/auth-provider"
import { transformDatabaseJobToUI, type UIJob } from "@/modules/job/application/job-transforms-service"
import { statusConfig, type JobStatus } from '@/modules/job/domain/job.entity'
import { api } from "@/lib/supabase/client"
import { UnpaidWarningDialog } from "@/components/tenant/dialogs/unpaid-warning-dialog"
import { queryKeys, useTenantSettings, transformTenantSettingsForJobDetails } from "@/hooks"
import { toast } from "sonner"

export default function JobsPage() {
  const { user, tenantId } = useAuth()
  const [selectedJob, setSelectedJob] = useState<UIJob | null>(null)
  const [showCreateJob, setShowCreateJob] = useState(false)
  const queryClient = useQueryClient()

  // Use centralized query key for cache consistency with all-jobs page
  const jobsQueryKey = useMemo(() => queryKeys.jobs.list(tenantId || ""), [tenantId])

  // Fetch tenant settings once at the page level
  const { data: tenantSettings } = useTenantSettings()

  // Transform tenant settings to match the format expected by JobDetailsContainer
  const tenantDetails = useMemo(() =>
    transformTenantSettingsForJobDetails(tenantSettings),
    [tenantSettings]
  )

  useEffect(() => {
    const handleOpenCreateJob = () => setShowCreateJob(true);
    window.addEventListener('open-create-job', handleOpenCreateJob);

    // Check search params for 'create' flag
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

  /**
   * Check if an invoice has an unpaid balance and set up pending completion if so
   */
  const checkInvoicePaymentRequired = (
    invoice: { id: string; status: string; totalAmount?: number; total_amount?: number } | null,
    jobId: string,
    jobNumber: string
  ): boolean => {
    if (!invoice) return false

    const isUnpaid = invoice.status !== 'paid'
    const total = invoice.totalAmount || invoice.total_amount || 0

    if (isUnpaid && total > 0) {
      setPendingCompletion({ jobId, invoiceId: invoice.id, balance: total, jobNumber })
      setShowUnpaidWarning(true)
      return true
    }
    return false
  }

  const jobsQuery = useQuery({
    queryKey: jobsQueryKey,
    enabled: Boolean(user && tenantId),
    queryFn: async () => {
      const jobsRes = await api.get('/api/jobs', { cache: 'no-store' })
      if (!jobsRes.ok) throw new Error('Failed to fetch jobs')

      const dbJobs = await jobsRes.json()
      return Promise.all(dbJobs.map((job: any) => transformDatabaseJobToUI(job)))
    },
  })

  const jobs = jobsQuery.data ?? []

  // Keep the selected job in sync so status changes reflect in details panel too
  useEffect(() => {
    if (!selectedJob) return
    const fresh = jobs.find((j) => j.id === selectedJob.id)
    if (fresh) setSelectedJob(fresh)
  }, [jobs, selectedJob?.id])

  // Handle deep-linking to a specific job via jobId query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    if (jobId && jobs.length > 0) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setSelectedJob(job);
        // Optional: clear the param so it doesn't pop up again if they refresh
        // window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [jobs]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: JobStatus }) => {
      const response = await api.post(`/api/jobs/${jobId}/update-status`, { status })

      if (response.status === 402) {
        const data = await response.json()
        const err: any = new Error('PAYMENT_REQUIRED')
        err.paymentRequired = true
        err.data = data
        throw err
      }

      if (!response.ok) {
        throw new Error('Failed to update job status')
      }

      return await response.json()
    },
    onMutate: async ({ jobId, status }) => {
      await queryClient.cancelQueries({ queryKey: jobsQueryKey })
      const previousJobs = queryClient.getQueryData<UIJob[]>(jobsQueryKey)
      const updatedAt = new Date().toISOString()

      queryClient.setQueryData<UIJob[]>(jobsQueryKey, (oldJobs = []) =>
        oldJobs.map((job) =>
          job.id === jobId
            ? {
              ...job,
              status,
              updatedAt,
              updated_at: updatedAt,
            }
            : job
        )
      )

      return { previousJobs }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousJobs) {
        queryClient.setQueryData(jobsQueryKey, ctx.previousJobs)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: jobsQueryKey })
    },
  })

  const handleJobClick = async (job: UIJob) => {
    setSelectedJob(job)
  }

  const handleStatusChange = async (jobId: string, newStatus: JobStatus): Promise<void> => {
    const oldJob = jobs.find(job => job.id === jobId)
    const oldStatus = oldJob?.status
    const oldJobNumber = oldJob?.jobNumber

    try {
      if (!oldStatus) {
        console.error('Job not found:', jobId)
        return
      }

      // 1. Validate status transition
      const isValidTransition = validateStatusTransition(oldStatus, newStatus)
      if (!isValidTransition) {
        toast.error(`Cannot change status from ${statusConfig[oldStatus as JobStatus]?.label} to ${statusConfig[newStatus]?.label}`)
        return
      }

      if (oldStatus === 'completed') {
        toast.error('Cannot change status of a completed job')
        return
      }

      // 2. Handle Payment Validation before completing
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        const invRes = await api.get(`/api/invoices/by-job/${jobId}`)

        if (invRes.ok) {
          const invoice = await invRes.json()
          if (checkInvoicePaymentRequired(invoice, jobId, oldJobNumber || '')) return
        } else if (invRes.status === 404) {
          // No invoice exists - try to generate from estimate
          const estRes = await api.get(`/api/estimates/by-job/${jobId}`)
          if (!estRes.ok) {
            toast.error('Cannot complete job: No estimate found for this job.')
            return
          }

          const estimate = await estRes.json()
          if (!estimate?.id) {
            toast.error('Cannot complete job: Invalid estimate data.')
            return
          }

          const genRes = await api.post(`/api/invoices/generate`, { estimateId: estimate.id })
          if (!genRes.ok) {
            toast.error('Failed to generate invoice from estimate before completing job.')
            return
          }

          const invoice = await genRes.json()
          if (checkInvoicePaymentRequired(invoice, jobId, oldJobNumber || '')) return
        }
      }

      // 3. Update Status (optimistic via TanStack Query)
      await updateStatusMutation.mutateAsync({ jobId, status: newStatus })
    } catch (err: unknown) {
      const error = err as { paymentRequired?: boolean; data?: { paymentRequired?: boolean; invoiceId?: string; balance?: number; jobNumber?: string } }
      if (error?.paymentRequired && error?.data?.paymentRequired) {
        setPendingCompletion({
          jobId,
          invoiceId: error.data.invoiceId || '',
          balance: error.data.balance || 0,
          jobNumber: error.data.jobNumber || oldJobNumber || '',
        })
        setShowUnpaidWarning(true)
        return
      }

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
      await updateStatusMutation.mutateAsync({
        jobId: pendingCompletion.jobId,
        status: 'completed',
      })

      setShowUnpaidWarning(false)
      setPendingCompletion(null)
    } catch (err) {
      console.error('Error marking paid and completing:', err)
      throw err
    }
  }

  const handleMechanicChange = async (jobId: string, mechanicId: string) => {// FIXME: this is a rough implementation to get the mechanic change working, need to refactor 
    try {
      const response = await api.post(`/api/jobs/${jobId}/assign-mechanic`, { mechanicId })
      if (!response.ok) {
        throw new Error('Failed to assign mechanic')
      }
      await queryClient.invalidateQueries({ queryKey: jobsQueryKey })
    } catch (err) {
      console.error('Error updating mechanic:', err)
      toast.error('Failed to assign mechanic')
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await api.delete(`/api/jobs/${jobId}`)
      if (!res.ok) throw new Error('Failed to delete job')
      await queryClient.invalidateQueries({ queryKey: jobsQueryKey })
    } catch (err) {
      console.error('Error deleting job:', err)
      alert('Failed to delete job')
    }
  }

  return (
    <>
      <JobBoardView
        jobs={jobs}
        loading={jobsQuery.isLoading}
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
            await queryClient.invalidateQueries({ queryKey: jobsQueryKey })
          }}
          tenantDetails={tenantDetails}
          onViewJob={async (jobId) => {
            const found = jobs.find(j => j.id === jobId);
            if (found) {
              setSelectedJob(found);
            } else {
              try {
                const res = await api.get(`/api/jobs/${jobId}`);
                if (res.ok) {
                  const dbJob = await res.json();
                  const uiJob = await transformDatabaseJobToUI(dbJob);
                  setSelectedJob(uiJob);
                }
              } catch (err) {
                console.error("Error navigating to job:", err);
              }
            }
          }}
        />
      )}

      {showCreateJob && (
        <CreateJobWizard
          isOpen={showCreateJob}
          onClose={() => setShowCreateJob(false)}
          onSuccess={async () => {
            setShowCreateJob(false)
            await queryClient.invalidateQueries({ queryKey: jobsQueryKey })
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
