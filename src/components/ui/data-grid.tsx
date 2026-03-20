"use client"

import { useState } from "react"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onRowClick?: (row: TData) => void
    pageSize?: number
    stretch?: boolean
    emptyMessage?: string
}

import { cn } from "@/lib/utils"

export function DataTable<TData, TValue>({
    columns,
    data,
    onRowClick,
    pageSize = 10,
    stretch = false,
    emptyMessage = "No results found.",
}: DataTableProps<TData, TValue>) {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize,
    })
    const [sorting, setSorting] = useState<SortingState>([])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            pagination,
            sorting,
        },
    })

    const totalRows = table.getFilteredRowModel().rows.length
    const currentPage = table.getState().pagination.pageIndex + 1
    const totalPages = table.getPageCount() || 1

    return (
        <div className={cn("space-y-0", stretch ? "flex flex-col h-full min-h-0" : "")}>
            <div className={cn("rounded-lg border border-border bg-card overflow-x-auto relative", stretch ? "flex-1 min-h-0 overflow-y-auto" : "")}>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={(header.column.columnDef.meta as Record<string, string>)?.headerClassName}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={() => onRowClick && onRowClick(row.original)}
                                    className={cn(
                                        "group/row transition-colors duration-100",
                                        onRowClick && "cursor-pointer"
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={(cell.column.columnDef.meta as Record<string, string>)?.cellClassName}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                                        <span className="text-sm">{emptyMessage}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className={cn(
                    "flex items-center justify-between px-1 py-3",
                    stretch && "mt-auto shrink-0"
                )}>
                    <div className="text-xs text-muted-foreground">
                        {totalRows} row{totalRows !== 1 ? "s" : ""} total
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeftIcon className="size-4" />
                            <span className="sr-only">Previous page</span>
                        </Button>
                        <span className="text-xs font-medium text-muted-foreground tabular-nums min-w-16 text-center">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRightIcon className="size-4" />
                            <span className="sr-only">Next page</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export type { ColumnDef }
