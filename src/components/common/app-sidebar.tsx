"use client";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Car,
  Settings,
  Wrench,
  List,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { 
    id: "dashboard", 
    label: "Dashboard", 
    icon: LayoutDashboard,
    description: "Overview & analytics"
  },
  { 
    id: "jobs-board", 
    label: "Job Board", 
    icon: ClipboardList,
    description: "Kanban-style job management"
  },
  { 
    id: "all-jobs", 
    label: "All Jobs", 
    icon: List,
    description: "View all job records"
  },
  { 
    id: "customers", 
    label: "Customers", 
    icon: Users,
    description: "Customer management"
  },
  { 
    id: "vehicles", 
    label: "Vehicles", 
    icon: Car,
    description: "Vehicle inventory"
  },
];

const bottomNavItems = [
  { 
    id: "garage-settings", 
    label: "Settings", 
    icon: Settings,
    description: "Garage configuration"
  },
];

function CollapseButton() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "h-7 w-7 p-0 rounded-full",
              "bg-sidebar-accent/50 hover:bg-sidebar-accent",
              "border border-sidebar-border/50",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground",
              "transition-all duration-200 ease-out",
              "shadow-sm hover:shadow-md",
              "group/collapse"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover/collapse:translate-x-0.5" />
            ) : (
              <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-hover/collapse:-translate-x-0.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function NavItem({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: typeof navItems[0]; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <TooltipProvider>
        <Tooltip delayDuration={isCollapsed ? 0 : 700}>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              isActive={isActive}
              onClick={onClick}
              className={cn(
                "relative group/nav-item",
                "transition-all duration-200 ease-out",
                "hover:translate-x-0.5",
                isActive && [
                  "bg-gradient-to-r from-sidebar-primary/20 to-sidebar-primary/10",
                  "border-l-2 border-sidebar-primary",
                  "shadow-sm",
                ]
              )}
            >
              {/* Active indicator glow */}
              {isActive && (
                <div className="absolute inset-0 bg-sidebar-primary/5 rounded-md blur-sm" />
              )}
              
              <Icon className={cn(
                "h-4 w-4 transition-all duration-200",
                isActive 
                  ? "text-sidebar-primary" 
                  : "text-sidebar-foreground/70 group-hover/nav-item:text-sidebar-foreground"
              )} />
              
              <span className={cn(
                "transition-colors duration-200",
                isActive 
                  ? "font-semibold text-sidebar-foreground" 
                  : "text-sidebar-foreground/80 group-hover/nav-item:text-sidebar-foreground"
              )}>
                {item.label}
              </span>
            </SidebarMenuButton>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent 
              side="right" 
              sideOffset={12}
              className="flex flex-col gap-0.5"
            >
              <span className="font-medium">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar 
      collapsible="icon"
      className={cn(
        "border-r border-sidebar-border/50",
        "bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95",
        "[&_[data-sidebar=sidebar]]:bg-transparent"
      )}
    >
      {/* Header with Logo */}
      <SidebarHeader className="relative">
        <div className={cn(
          "flex items-center gap-3 h-14 px-3",
          "transition-all duration-300 ease-out"
        )}>
          {/* Logo Icon */}
          <div className={cn(
            "flex items-center justify-center",
            "w-10 h-10 rounded-xl",
            "bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80",
            "text-sidebar-primary-foreground",
            "shadow-lg shadow-sidebar-primary/25",
            "transition-all duration-300",
            "group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8",
            "group-data-[collapsible=icon]:rounded-lg"
          )}>
            <Wrench className={cn(
              "transition-all duration-300",
              isCollapsed ? "h-4 w-4" : "h-5 w-5"
            )} />
          </div>
          
          {/* Brand Text */}
          <div className={cn(
            "flex flex-col min-w-0",
            "transition-all duration-300 ease-out",
            "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0"
          )}>
            <span className="font-bold text-base text-sidebar-foreground truncate">
              Wrench Cloud
            </span>
            <span className="text-xs text-sidebar-foreground/60 truncate flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Smart Garage
            </span>
          </div>
        </div>

        {/* Collapse button positioned at header edge */}
        <div className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2",
          "transition-all duration-300",
          "group-data-[collapsible=icon]:right-1/2 group-data-[collapsible=icon]:translate-x-1/2"
        )}>
          <CollapseButton />
        </div>
      </SidebarHeader>

      {/* Decorative divider */}
      <div className="px-4 py-2">
        <div className={cn(
          "h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent",
          "transition-all duration-300"
        )} />
      </div>

      {/* Navigation Content */}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={activeView === item.id}
                  onClick={() => onViewChange(item.id)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Settings */}
      <SidebarFooter className="px-2 pb-4">
        {/* Decorative divider */}
        <div className="px-2 pb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
        </div>
        
        <SidebarMenu>
          {bottomNavItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeView === item.id}
              onClick={() => onViewChange(item.id)}
            />
          ))}
        </SidebarMenu>

        {/* Version info - only visible when expanded */}
        <div className={cn(
          "mt-4 px-3 text-xs text-sidebar-foreground/40",
          "transition-all duration-300",
          "group-data-[collapsible=icon]:hidden"
        )}>
          v1.0.0 Beta
        </div>
      </SidebarFooter>

      {/* Rail for dragging */}
      <SidebarRail />
    </Sidebar>
  );
}
