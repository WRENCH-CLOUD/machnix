"use client"

import { LayoutGrid, Table2 } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type ViewMode = "grid" | "table"

interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  className?: string
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <ToggleGroup
      className={className}
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as ViewMode)
      }}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid className="w-4 h-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table view">
        <Table2 className="w-4 h-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
