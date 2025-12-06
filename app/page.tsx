"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { AppSidebar, TopHeader } from "@/components/common"
import { JobBoard, CreateJobWizard, JobDetails, AllJobsView } from "@/components/features/jobs"
import { CustomersView } from "@/components/features/customers"
import { VehiclesView } from "@/components/features/vehicles"
import { ReportsView } from "@/components/features/reports"
import { LoginPage } from "@/components/features/auth"
import { AdminDashboard } from "@/components/features/admin"
import { MechanicDashboard } from "@/components/features/mechanic"
import { useAuth } from "@/providers"
import { JobService, InvoiceService } from "@/lib/supabase/services"
import type { JobcardWithRelations } from "@/lib/supabase/services/job.service"
import { type JobStatus } from "@/lib/mock-data"
import { Skeleton } from "@/components/ui/skeleton"
import Loader from "@/components/ui/loading"
import { transformDatabaseJobToUI, type UIJob } from "@/lib/job-transforms"

function AppContent() {
  const { user, session, tenantId, userRole, loading: authLoading } = useAuth()
  const [activeView, setActiveView] = useState("dashboard")
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [selectedJob, setSelectedJob] = useState<UIJob | null>(null)
  const [jobs, setJobs] = useState<UIJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch jobs when tenant is set
  useEffect(() => {
    if (tenantId && session) {
      loadJobs()
      
      // Subscribe to real-time job changes
      let subscription: { unsubscribe: () => void } | null = null
      
      try {
        subscription = JobService.subscribeToJobs((payload) => {
          ////console.log('[Jobs] Real-time update:', payload)
          loadJobs() // Reload jobs on any change
        })
      } catch (err) {
        console.warn('[Jobs] Failed to subscribe to job updates:', err)
      }

      return () => {
        subscription?.unsubscribe()
      }
    }
  }, [tenantId, session])

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Ensure tenant context is set before fetching
      if (!tenantId) {
        console.warn('[loadJobs] No tenant ID available, skipping job load')
        setJobs([])
        return
      }
      
      const data = await JobService.getJobs()
      // Transform database jobs to UI format (now async)
      const transformedJobs = await Promise.all(data.map(transformDatabaseJobToUI))
      setJobs(transformedJobs)
    } catch (err: unknown) {
      // Better error logging
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load jobs'
      
      console.error('[loadJobs] Error:', errorMessage, err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader 
          title="Initializing..."
          subtitle="Setting up your workspace"
          size="lg"
        />
      </div>
    )
  }

  // Show login page if not authenticated
  if (!session || !user) {
    return <LoginPage />
  }

  // Show loading if user role is still being determined
  if (!userRole && !authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader 
          title="Loading profile..."
          subtitle="Getting your account ready"
          size="lg"
        />
      </div>
    )
  }

  // Role-based routing
  if (userRole === "platform_admin") {
    return <AdminDashboard />
  }

  if (userRole === "mechanic") {
    return <MechanicDashboard />
  }

  if (userRole === "no_access") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-8">
          <h1 className="text-2xl font-bold text-destructive">No Access</h1>
          <p className="text-muted-foreground">
            You do not have access to this system. Please contact an administrator.
          </p>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            className="text-primary hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // Default frontdesk/tenant view handlers
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

  const handleCreateJob = async (data: unknown) => {
    ////console.log("Creating job:", data)
    await loadJobs()
  }

  const handleStatusChange = async (jobId: string, newStatus: JobStatus): Promise<void> => {
    try {
      // Get old status before update
      const oldJob = jobs.find(job => job.id === jobId)
      const oldStatus = oldJob?.status
      
      // Update job status in database
      await JobService.updateStatus(jobId, newStatus, user?.id)
      
      // Auto-generate invoice when status changes to "ready" (Ready for Payment)
      if (newStatus === 'ready' && oldStatus !== 'ready') {
        // Fire and forget - don't block UI
        InvoiceService.createInvoiceFromJob(jobId)
          .then(() => console.log('Invoice automatically generated for job:', jobId))
          .catch((invoiceError) => console.error('Failed to auto-generate invoice:', invoiceError))
      }
      
      // Update local state
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId
            ? { ...job, status: newStatus, updated_at: new Date().toISOString() }
            : job
        )
      )

      // Update selected job if it's the one being changed
      if (selectedJob?.id === jobId) {
        const updatedJob = await JobService.getJobById(jobId)
        const transformedJob = await transformDatabaseJobToUI(updatedJob)
        setSelectedJob(transformedJob)
      }
    } catch (err) {
      console.error('Error updating status:', err)
      // Reload jobs to sync state on error
      await loadJobs()
      throw err // Re-throw to allow caller to handle
    }
  }

  const handleMechanicChange = async (jobId: string, mechanicId: string) => {
    try {
      await JobService.assignMechanic(jobId, mechanicId, user?.id)
      await loadJobs()

      if (selectedJob?.id === jobId) {
        const updatedJob = await JobService.getJobById(jobId)
        const transformedJob = await transformDatabaseJobToUI(updatedJob)
        setSelectedJob(transformedJob)
      }
    } catch (err) {
      console.error('Error assigning mechanic:', err)
      alert('Failed to assign mechanic')
    }
  }

  // Show error state
  if (error && !loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <button
            onClick={loadJobs}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Frontdesk/Tenant view (default)
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          tenantName="Mechanix Garage"
          onCreateJob={() => setShowCreateJob(true)}
        />
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {activeView === "dashboard" && (
              <JobBoard
                jobs={jobs}
                loading={loading}
                isMechanicMode={false}
                onJobClick={handleJobClick}
                onStatusChange={handleStatusChange}
                onMechanicChange={handleMechanicChange}
              />
            )}
            {activeView === "jobs" && (
              <AllJobsView
                jobs={jobs}
                onJobClick={handleJobClick}
              />
            )}
            {activeView === "customers" && <CustomersView />}
            {activeView === "vehicles" && <VehiclesView />}
            {activeView === "reports" && <ReportsView />}
          </AnimatePresence>
        </main>
      </div>

      {/* Job Details Drawer */}
      {selectedJob && (
        <JobDetails
          job={selectedJob}
          isMechanicMode={false}
          onClose={() => setSelectedJob(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Create Job Wizard */}
      {showCreateJob && (
        <CreateJobWizard
          onClose={() => setShowCreateJob(false)}
          onSubmit={handleCreateJob}
        />
      )}
    </div>
  )
}

export default function MechanixApp() {
  return <AppContent />
}
