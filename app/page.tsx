"use client"

import { useState } from "react"
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
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { mockJobs, type JobCard } from "@/lib/mock-data"

function AppContent() {
  const { isAuthenticated, user } = useAuth()
  const [activeView, setActiveView] = useState("dashboard")
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null)

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }

  if (user?.role === "mechanic") {
    return <MechanicDashboard />
  }

  // Show admin dashboard for admin users
  if (user?.role === "admin") {
    return <AdminDashboard />
  }

  const handleJobClick = (job: JobCard) => {
    setSelectedJob(job)
  }

  const handleCreateJob = (data: unknown) => {
    console.log("Creating job:", data)
  }

  // Frontdesk view (default)
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader tenantName={user?.tenantName || "Garage A"} onCreateJob={() => setShowCreateJob(true)} />

        <main className="flex-1 overflow-hidden">
          {activeView === "dashboard" && (
            <JobBoard jobs={mockJobs} onJobClick={handleJobClick} isMechanicMode={false} />
          )}

          {activeView === "jobs" && <AllJobsView jobs={mockJobs} onJobClick={handleJobClick} />}

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
        {selectedJob && <JobDetails job={selectedJob} onClose={() => setSelectedJob(null)} isMechanicMode={false} />}
      </AnimatePresence>
    </div>
  )
}

export default function MechanixApp() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
