"use client"

import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import ProfileDropdown from "@/components/ui/profileDropdown"
import { useAuth } from "@/providers/auth-provider"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

interface TopHeaderProps {
  tenantName: string
  onCreateJob: () => void
}

export function TopHeader({ tenantName, onCreateJob }: TopHeaderProps) {
  const { user, signOut, userRole } = useAuth()

  const profileData = {
    name: user?.email?.split('@')[0] || "User",
    email: user?.email || "user@example.com",
    avatar: user?.user_metadata?.avatar_url,
    role: userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('_', ' ') : 'User',
    tenantName: tenantName,
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex bg-primary/10 text-primary border-primary/20 font-semibold px-3 py-1">
            {tenantName}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex justify-center sm:justify-start">
         <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10 bg-secondary border-border" />
        </div>
      </div>

      {/* Right Section - Actions, User */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {/* Create Job Button */}
        <Button onClick={onCreateJob} className="gap-2" size="sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Job</span>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Dropdown */}
        <ProfileDropdown data={profileData} onSignOut={signOut} />
      </div>
    </header>
  )
}
