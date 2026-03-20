"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GridPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function GridPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [6, 12, 24, 48],
  onPageChange,
  onPageSizeChange,
}: GridPaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  if (totalItems === 0) return null

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger size="sm" className="w-20 h-9 px-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {startItem} - {endItem} of {totalItems}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Go to previous page"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {totalPages <= 5 ? (
            Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ))
          ) : (
            <>
              {[1, currentPage > 3 ? null : 2, currentPage > 3 ? currentPage - 1 : 3]
                .filter((p): p is number => p !== null && p >= 1)
                .filter((p, i, arr) => arr.indexOf(p) === i)
                .map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
              {currentPage > 3 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-muted-foreground px-1">...</span>
                  <Button variant="default" size="icon" className="h-8 w-8">
                    {currentPage}
                  </Button>
                </>
              )}
              {currentPage >= 3 && currentPage <= totalPages - 2 && (
                <span className="text-muted-foreground px-1">...</span>
              )}
              {[currentPage < totalPages - 2 ? null : totalPages - 2, currentPage < totalPages - 2 ? totalPages - 1 : totalPages - 1, totalPages]
                .filter((p): p is number => p !== null && p > 0)
                .filter((p, i, arr) => arr.indexOf(p) === i)
                .filter((p) => p > currentPage || currentPage >= totalPages - 2)
                .map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
            </>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Go to next page"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
