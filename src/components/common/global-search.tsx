"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, ClipboardList, Users, Car, Loader2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  type: "job" | "customer" | "vehicle"
  title: string
  subtitle: string
  href: string
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
      setQuery("")
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const searchResults: SearchResult[] = []
        
        // Search customers
        const customersRes = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`)
        if (customersRes.ok) {
          const customers = await customersRes.json()
          customers.slice(0, 3).forEach((c: any) => {
            searchResults.push({
              id: c.id,
              type: "customer",
              title: c.name,
              subtitle: c.phone || c.email || "No contact info",
              href: `/customers`
            })
          })
        }

        // Search jobs by job number (client-side filter since we have /api/jobs)
        const jobsRes = await fetch('/api/jobs')
        if (jobsRes.ok) {
          const jobs = await jobsRes.json()
          const q = query.toLowerCase()
          
          const matchingJobs = jobs.filter((j: any) => {
            const jobNum = (j.jobNumber || "").toLowerCase()
            const customerName = (j.customer?.name || "").toLowerCase()
            return jobNum.includes(q) || customerName.includes(q)
          }).slice(0, 3)
          
          matchingJobs.forEach((j: any) => {
            searchResults.push({
              id: j.id,
              type: "job",
              title: `Job ${j.jobNumber}`,
              subtitle: `${j.customer?.name || 'Unknown'} - ${j.status}`,
              href: `/jobs-board?jobId=${j.id}`
            })
          })
        }

        // Search vehicles
        const vehiclesRes = await fetch('/api/vehicles')
        if (vehiclesRes.ok) {
          const vehicles = await vehiclesRes.json()
          const q = query.toLowerCase()
          
          const matchingVehicles = vehicles.filter((v: any) =>
            v.licensePlate?.toLowerCase().includes(q) ||
            v.make?.toLowerCase().includes(q) ||
            v.model?.toLowerCase().includes(q)
          ).slice(0, 3)
          
          matchingVehicles.forEach((v: any) => {
            searchResults.push({
              id: v.id,
              type: "vehicle",
              title: v.licensePlate || "Unknown Vehicle",
              subtitle: `${v.make || ''} ${v.model || ''}`.trim() || 'No details',
              href: `/vehicles`
            })
          })
        }

        setResults(searchResults)
        setSelectedIndex(0)
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      router.push(results[selectedIndex].href)
      onOpenChange(false)
    } else if (e.key === "Escape") {
      onOpenChange(false)
    }
  }, [results, selectedIndex, router, onOpenChange])

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "job": return ClipboardList
      case "customer": return Users
      case "vehicle": return Car
    }
  }

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "job": return "Job"
      case "customer": return "Customer"
      case "vehicle": return "Vehicle"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search for jobs, customers, and vehicles across the platform.
        </DialogDescription>
        <div className="flex items-center border-b px-3">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search jobs, customers, vehicles..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        {query.trim() && (
          <ScrollArea className="max-h-80">
            {results.length > 0 ? (
              <div className="p-2">
                {results.map((result, index) => {
                  const Icon = getIcon(result.type)
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => {
                        router.push(result.href)
                        onOpenChange(false)
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                        index === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{result.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                          {getTypeLabel(result.type)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : !loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No results found for "{query}"
              </div>
            ) : null}
          </ScrollArea>
        )}

        {!query.trim() && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Start typing to search...
          </div>
        )}

        <div className="hidden sm:flex items-center justify-between px-3 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px]">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex gap-2">
            <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px]">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex gap-2">
            <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px]">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
