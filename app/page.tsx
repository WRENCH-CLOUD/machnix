"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { AppSidebar } from "@/components/mechanix/app-sidebar"
import { TopHeader } from "@/components/mechanix/top-header"
import { JobBoard } from "@/components/mechanix/job-board"
import { CreateJobWizard } from "@/components/mechanix/create-job-wizard"
import { JobDetails } from "@/components/mechanix/job-details"
import { AllJobsView } from "@/components/mechanix/all-jobs-view"
import { CustomersView } from "@/components/mechanix/customers-view"
import { VehiclesView } from "@/components/mechanix/vehicles-view"
import { ReportsView } from "@/components/mechanix/reports-view"
import { LoginPage } from "@/components/mechanix/login-page"
import { AdminDashboard } from "@/components/mechanix/admin-dashboard"
import { MechanicDashboard } from "@/components/mechanix/mechanic-dashboard"
import { useAuth } from "@/lib/auth-provider"
import { JobService, MechanicService } from "@/lib/supabase/services"
import type { JobcardWithRelations } from "@/lib/supabase/services/job.service"
import { type JobStatus } from "@/lib/mock-data"
import { Skeleton } from "@/components/ui/skeleton"
import { transformJobToJobCard } from "@/lib/transformers"

function AppContent() {
  const { user, session, tenantId, userRole, loading: authLoading } = useAuth()
  const [activeView, setActiveView] = useState("dashboard")
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobcardWithRelations | null>(null)
  const [jobs, setJobs] = useState<JobcardWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch jobs when tenant is set
  useEffect(() => {
    if (tenantId && session) {
      loadJobs()
      
      // Subscribe to real-time job changes
      const subscription = JobService.subscribeToJobs((payload) => {
        console.log('Job update:', payload)
        loadJobs() // Reload jobs on any change
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [tenantId, session])

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await JobService.getJobs()
      setJobs(data)
    } catch (err) {
      console.error('Error loading jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!session || !user) {
    return <LoginPage />
  }

  // Show loading if user role is still being determined
  if (!userRole && !authLoading) {
    console.log('[PAGE] User role is null, showing loading...')
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    )
  }

  console.log('[PAGE] User role:', userRole)

  // Role-based routing
  if (userRole === "platform_admin") {
    return <AdminDashboard />
  }

  if (userRole === "mechanic") {
    return <MechanicDashboard />
  }

  if (userRole === "tenant") {
    return <AdminDashboard />
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

  // Default frontdesk view
  const handleJobClick = async (job: JobcardWithRelations) => {
    // Fetch full job details
    try {
      const fullJob = await JobService.getJobById(job.id)
      setSelectedJob(fullJob)
    } catch (err) {
      console.error('Error loading job details:', err)
      setSelectedJob(job) // Fallback to the job we have
    }
  }

  const handleCreateJob = async (data: unknown) => {
    console.log("Creating job:", data)
    // TODO: Implement job creation
    await loadJobs()
  }

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    try {
      await JobService.updateStatus(jobId, newStatus, user?.id)
      
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
        setSelectedJob(updatedJob)
      }
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status')
    }
  }

  const handleMechanicChange = async (jobId: string, mechanicId: string) => {
    try {
      await JobService.assignMechanic(jobId, mechanicId, user?.id)
      
      // Update local state
      await loadJobs()

      // Update selected job if it's the one being changed
      if (selectedJob?.id === jobId) {
        const updatedJob = await JobService.getJobById(jobId)
        setSelectedJob(updatedJob)
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

  // Frontdesk view (default)
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader tenantName="Mechanix Garage" onCreateJob={() => setShowCreateJob(true)} />

        <main className="flex-1 overflow-hidden">
          {activeView === "dashboard" && (
            <JobBoard
              jobs={jobs.map(transformJobToJobCard)}
              onJobClick={(job) => {
                // Find original job object
                const originalJob = jobs.find(j => j.id === job.id)
                if (originalJob) handleJobClick(originalJob)
              }}
              isMechanicMode={false}
              onStatusChange={handleStatusChange}
              onMechanicChange={handleMechanicChange}
              loading={loading}
            />
          )}

          {activeView === "jobs" && <AllJobsView jobs={jobs as any} onJobClick={handleJobClick as any} />}

          {activeView === "customers" && <CustomersView />}

          {activeView === "vehicles" && <VehiclesView />}

          {activeView === "reports" && <ReportsView />}

          {activeView === "invoices" && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Invoices</h1>
              <p className="text-muted-foreground">Invoice management coming soon...</p>
            </div>
          )}

          {activeView === "settings" && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Settings</h1>
              <p className="text-muted-foreground">System settings coming soon...</p>
            </div>
          )}

          {activeView === "help" && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Help & Support</h1>
              <p className="text-muted-foreground">Documentation and support coming soon...</p>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateJob && <CreateJobWizard onClose={() => setShowCreateJob(false)} onSubmit={handleCreateJob} />}
      </AnimatePresence>

      <AnimatePresence>
        {selectedJob && (
          <JobDetails
            job={transformJobToJobCard(selectedJob)}
            onClose={() => setSelectedJob(null)}
            isMechanicMode={false}
            onStatusChange={handleStatusChange}
            onMechanicChange={handleMechanicChange}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MechanixApp() {
  return <AppContent />
}
