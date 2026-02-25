"use client";

import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/modules/inventory/domain/inventory.entity";
import { AdvancedTaskPanel } from "@/components/tenant/jobs/advance-task-model";

// ============================================================================
// Props Interface (backward-compatible)
// ============================================================================

interface JobTasksProps {
  jobId: string;
  disabled?: boolean;
  className?: string;
  /** Search inventory items (from delta-sync snapshot) */
  searchInventory?: (query: string, limit?: number) => InventoryItem[];
}

// ============================================================================
// JobTasks — now delegates to AdvancedTaskPanel
// ============================================================================

export function JobTasks({
  jobId,
  disabled = false,
  className,
  searchInventory,
}: JobTasksProps) {
  return (
    <AdvancedTaskPanel
      jobId={jobId}
      disabled={disabled}
      className={cn(className)}
      searchInventory={searchInventory}
    />
  );
}
