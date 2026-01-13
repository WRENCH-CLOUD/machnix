"use client";

import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { GripVertical } from "lucide-react";

interface ResizableSidebarWrapperProps {
  children: ReactNode;
  sidebarContent: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidthPercent?: number;
}

export function ResizableSidebarWrapper({
  children,
  sidebarContent,
  defaultWidth = 256,
  minWidth = 200,
  maxWidthPercent = 50,
}: ResizableSidebarWrapperProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  
  // Calculate max width based on container width
  const getMaxWidth = useCallback(() => {
    if (!containerRef.current) return 600;
    return (containerRef.current.offsetWidth * maxWidthPercent) / 100;
  }, [maxWidthPercent]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isCollapsed) return;
    e.preventDefault();
    setIsResizing(true);
  }, [isCollapsed]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    const maxWidth = getMaxWidth();
    
    setSidebarWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
  }, [isResizing, getMaxWidth, minWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Collapsed sidebar width (icon only mode)
  const collapsedWidth = 52;
  const currentWidth = isCollapsed ? collapsedWidth : sidebarWidth;

  return (
    <div 
      ref={containerRef}
      className="flex h-screen w-full overflow-hidden"
    >
      {/* Sidebar Container */}
      <div
        style={{ width: currentWidth }}
        className={cn(
          "relative flex-shrink-0 h-full",
          "transition-[width] duration-300 ease-out",
          isResizing && "transition-none"
        )}
      >
        {sidebarContent}
      </div>

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "relative w-1 flex-shrink-0 cursor-col-resize",
            "group/resize",
            "transition-colors duration-200",
            isResizing 
              ? "bg-primary/20" 
              : "bg-transparent hover:bg-primary/10"
          )}
        >
          {/* Visual indicator line */}
          <div 
            className={cn(
              "absolute inset-y-0 left-1/2 -translate-x-1/2 w-px",
              "bg-border/50",
              "transition-colors duration-200",
              isResizing && "bg-primary/50",
              "group-hover/resize:bg-primary/30"
            )}
          />
          
          {/* Grip handle */}
          <div 
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-4 h-8 flex items-center justify-center",
              "rounded-full",
              "bg-muted/80 hover:bg-muted",
              "border border-border/50",
              "shadow-sm hover:shadow-md",
              "transition-all duration-200 ease-out",
              "opacity-0 group-hover/resize:opacity-100",
              isResizing && "opacity-100 bg-primary/10"
            )}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden h-full min-w-0">
        {children}
      </div>
    </div>
  );
}
