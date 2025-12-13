"use client"

import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import ProfileDropdown from "@/components/ui/profileDropdown"
import { useAuth } from "@/providers/auth-provider"

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
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left Section - Tenant & Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold px-3 py-1">
            {tenantName}
          </Badge>
        </div>

        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search jobs, customers, vehicles..." className="pl-10 bg-secondary border-border" />
        </div>
      </div>

      {/* Right Section - Actions, User */}
      <div className="flex items-center gap-4">
        {/* Create Job Button */}
        <Button onClick={onCreateJob} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Job
        </Button>

        {/* Notifications */}
        {/* <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </Button> */}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Dropdown */}
        <ProfileDropdown data={profileData} onSignOut={signOut} />
      </div>
    </header>
  )
}
