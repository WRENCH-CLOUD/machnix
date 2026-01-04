"use client"

import { useState, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import ProfileDropdown from "@/components/ui/profileDropdown"
import { useAuth } from "@/providers/auth-provider"
import { GlobalSearch } from "@/components/common/global-search"

interface TopHeaderProps {
  tenantName: string
  onCreateJob: () => void
}

export function TopHeader({ tenantName, onCreateJob }: TopHeaderProps) {
  const { user, signOut, userRole } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const profileData = {
    name: user?.email?.split('@')[0] || "User",
    email: user?.email || "user@example.com",
    avatar: user?.user_metadata?.avatar_url,
    role: userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('_', ' ') : 'User',
    tenantName: tenantName,
  }

  return (
    <>
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
        {/* Left Section - Tenant & Search */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold px-3 py-1">
              {tenantName}
            </Badge>
          </div>

          {/* Search trigger button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="relative w-80 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-secondary border border-border rounded-md hover:bg-secondary/80 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search jobs, customers, vehicles...</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right Section - Actions, User */}
        <div className="flex items-center gap-4">
          {/* Create Job Button */}
          <Button onClick={onCreateJob} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Job
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile Dropdown */}
          <ProfileDropdown data={profileData} onSignOut={signOut} />
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
