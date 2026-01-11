"use client";

import { useState, useEffect } from "react"
import { Search, Plus, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import ProfileDropdown from "@/components/ui/profileDropdown"
import { useAuth } from "@/providers/auth-provider"
import { GlobalSearch } from "@/components/common/global-search"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

interface TopHeaderProps {
  tenantName: string;
  onCreateJob: () => void;
}

export function TopHeader({ tenantName, onCreateJob }: TopHeaderProps) {
  const { user, signOut, userRole } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const isMobile = useIsMobile()

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
    name: user?.email?.split("@")[0] || "User",
    email: user?.email || "user@example.com",
    avatar: user?.user_metadata?.avatar_url,
    role: userRole
      ? userRole.charAt(0).toUpperCase() + userRole.slice(1).replace("_", " ")
      : "User",
    tenantName: tenantName,
  };

  return (
    <>
      <header className="h-14 md:h-16 bg-card border-b border-border flex items-center justify-between px-3 md:px-4 lg:px-6 gap-2">
        {/* Left Section - Sidebar Trigger, Tenant & Search */}
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6 flex-shrink min-w-0">
          {/* Mobile Sidebar Trigger */}
          <SidebarTrigger className="md:hidden flex-shrink-0" />
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm max-w-[120px] md:max-w-none">
              <span className="truncate">{tenantName}</span>
            </Badge>
          </div>

          {/* Search trigger button - icon only on mobile */}
          <button
            onClick={() => setSearchOpen(true)}
            className="relative flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 text-sm text-muted-foreground bg-secondary border border-border rounded-md hover:bg-secondary/80 transition-colors flex-shrink-0 md:flex-shrink md:w-auto md:min-w-[200px] lg:min-w-[280px]"
          >
            <Search className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <span className="hidden sm:block flex-1 text-left">Search</span>
            <kbd className="hidden lg:inline-flex h-5 items-center justify-center gap-1 font-mono text-[11px] text-muted-foreground">
              <span>⌘K</span>
            </kbd>
          </button>
        </div>

        {/* Right Section - Actions, User */}
        <div className="flex items-center gap-2 md:gap-3 lg:gap-4 flex-shrink-0">
          {/* Create Job Button - icon only on mobile */}
          <Button 
            onClick={onCreateJob} 
            size={isMobile ? "sm" : "default"}
            className="gap-1 md:gap-2 px-2 md:px-4"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Job</span>
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
