"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Building2,
  ChevronRight,
  LogOut,
  Settings,
  HardHat,
  BarChart3,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"

interface AdminLayoutProps {
  children: ReactNode
  activeView: string
  onViewChange: (view: string) => void
  title: string
}

const adminNavItems = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "tenants", label: "Tenants", icon: Building2 },
  { id: "mechanics", label: "Mechanics", icon: HardHat, disabled: true, comingSoon: true },
  { id: "settings", label: "Settings", icon: Settings },
]

export function AdminLayout({ children, activeView, onViewChange, title }: AdminLayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Admin Sidebar - Darker theme */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">machnix</span>
                <span className="text-xs text-zinc-500 block">Central Admin</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            const isDisabled = 'disabled' in item && item.disabled
            const isComingSoon = 'comingSoon' in item && item.comingSoon
            
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && onViewChange(item.id)}
                disabled={isDisabled}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isDisabled 
                    ? "text-zinc-600 cursor-not-allowed opacity-50" 
                    : isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800",
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium flex items-center gap-2">
                    {item.label}
                    {isComingSoon && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded">
                        Soon
                      </span>
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-3 border-t border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full justify-center text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ChevronRight className={cn("w-4 h-4 transition-transform", sidebarCollapsed ? "" : "rotate-180")} />
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={(user as any)?.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{(user as any)?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{(user as any)?.name || 'Admin'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
