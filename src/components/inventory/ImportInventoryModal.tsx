"use client";

import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    SkipForward,
    X,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface ParsedRow {
    name: string;
    stockKeepingUnit?: string;
    unitCost: number;
    sellPrice: number;
    stockOnHand: number;
    reorderLevel: number;
    _valid: boolean;
    _error?: string;
}

interface ImportResult {
    created: { id: string; name: string }[];
    skipped: { row: number; name: string; reason: string }[];
    errors: { row: number; name: string; error: string }[];
}

interface ImportInventoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportComplete: () => void;
}

// ============================================================================
// Column mapping — mirrors server-side logic for client preview
// ============================================================================

const COLUMN_MAP: Record<string, string[]> = {
    name: ["name", "item", "item_name", "part", "part_name", "description"],
    stockKeepingUnit: ["sku", "stock_keeping_unit", "part_number", "part_no", "item_code", "code"],
    unitCost: ["unit_cost", "cost", "purchase_price", "buy_price", "cost_price"],
    sellPrice: ["sell_price", "price", "selling_price", "mrp", "retail_price", "sale_price"],
    stockOnHand: ["stock", "quantity", "qty", "stock_on_hand", "on_hand", "opening_stock"],
    reorderLevel: ["reorder_level", "reorder", "min_stock", "minimum_stock", "reorder_point"],
};

function resolveColumn(header: string): string | null {
    const normalized = header.toLowerCase().trim().replace(/[\s-]+/g, "_");
    for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
        if (aliases.includes(normalized)) return field;
    }
    return null;
}

type Step = "upload" | "preview" | "result";

// ============================================================================
// Component
// ============================================================================

export function ImportInventoryModal({
    open,
    onOpenChange,
    onImportComplete,
}: ImportInventoryModalProps) {
    const [step, setStep] = useState<Step>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [headerMap, setHeaderMap] = useState<Map<string, string>>(new Map());
    const [unmappedHeaders, setUnmappedHeaders] = useState<string[]>([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const reset = useCallback(() => {
        setStep("upload");
        setFile(null);
        setParsedRows([]);
        setHeaderMap(new Map());
        setUnmappedHeaders([]);
        setImporting(false);
        setResult(null);
    }, []);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (!open) reset();
            onOpenChange(open);
        },
        [onOpenChange, reset]
    );

    // ── Parse CSV client-side for preview ──────────────────────────────────

    const parseFile = useCallback((f: File) => {
        setFile(f);

        Papa.parse<Record<string, string>>(f, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim(),
            complete: (results) => {
                const headers = results.meta.fields || [];
                const map = new Map<string, string>();
                const unmapped: string[] = [];

                for (const h of headers) {
                    const field = resolveColumn(h);
                    if (field) map.set(h, field);
                    else unmapped.push(h);
                }

                setHeaderMap(map);
                setUnmappedHeaders(unmapped);

                if (!map.size) {
                    toast.error("Could not match any columns", {
                        description: `Found headers: ${headers.join(", ")}. Expected: name, sku, cost, price, stock, reorder_level`,
                    });
                    return;
                }

                const rows: ParsedRow[] = results.data.map((row) => {
                    const parsed: Partial<ParsedRow> = {};
                    const warnings: string[] = [];

                    for (const [csvHeader, field] of map.entries()) {
                        const rawValue = row[csvHeader];
                        const value = rawValue?.trim();
                        // Skip empty, null-like, and placeholder values
                        if (!value || value.toLowerCase() === 'null' || value === '-' || value.toLowerCase() === 'n/a') {
                            continue;
                        }

                        switch (field) {
                            case "name":
                                parsed.name = value;
                                break;
                            case "stockKeepingUnit":
                                parsed.stockKeepingUnit = value;
                                break;
                            case "unitCost":
                            case "sellPrice": {
                                const num = parseFloat(value.replace(/[₹$,]/g, ""));
                                if (isNaN(num)) {
                                    warnings.push(`${field}: "${value}" is not a number, defaulting to 0`);
                                } else if (num < 0) {
                                    warnings.push(`${field}: negative value clamped to 0`);
                                    (parsed as any)[field] = 0;
                                } else {
                                    (parsed as any)[field] = num;
                                }
                                break;
                            }
                            case "stockOnHand":
                            case "reorderLevel": {
                                const int = parseInt(value.replace(/,/g, ""), 10);
                                if (isNaN(int)) {
                                    warnings.push(`${field}: "${value}" is not a number, defaulting to 0`);
                                } else if (int < 0) {
                                    warnings.push(`${field}: negative value clamped to 0`);
                                    (parsed as any)[field] = 0;
                                } else {
                                    (parsed as any)[field] = int;
                                }
                                break;
                            }
                        }
                    }

                    const name = (parsed.name || "").trim();
                    const valid = !!name && name.toLowerCase() !== 'null';
                    return {
                        name,
                        stockKeepingUnit: parsed.stockKeepingUnit,
                        unitCost: parsed.unitCost ?? 0,
                        sellPrice: parsed.sellPrice ?? 0,
                        stockOnHand: parsed.stockOnHand ?? 0,
                        reorderLevel: parsed.reorderLevel ?? 0,
                        _valid: valid,
                        _error: !valid ? "Name is required" : warnings.length > 0 ? warnings.join("; ") : undefined,
                    };
                });

                setParsedRows(rows);
                setStep("preview");
            },
            error: (err) => {
                toast.error("Failed to parse CSV", { description: err.message });
            },
        });
    }, []);

    // ── File input handlers ────────────────────────────────────────────────

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) parseFile(f);
        },
        [parseFile]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f && f.name.endsWith(".csv")) {
                parseFile(f);
            } else {
                toast.error("Only .csv files are supported");
            }
        },
        [parseFile]
    );

    // ── Upload to server ───────────────────────────────────────────────────

    const handleImport = useCallback(async () => {
        if (!file) return;
        setImporting(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/inventory/items/import", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Import failed", {
                    description: data.hint,
                });
                setImporting(false);
                return;
            }

            setResult(data);
            setStep("result");
            onImportComplete();

            if (data.created.length > 0) {
                toast.success(`${data.created.length} item(s) imported successfully`);
            }
        } catch (error) {
            toast.error("Import failed — network error");
        } finally {
            setImporting(false);
        }
    }, [file, onImportComplete]);

    // ── Render helpers ─────────────────────────────────────────────────────

    const validCount = parsedRows.filter((r) => r._valid).length;
    const invalidCount = parsedRows.filter((r) => !r._valid).length;

    const currencyFmt = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    });

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[750px] max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Import Inventory from CSV
                    </DialogTitle>
                    <DialogDescription>
                        {step === "upload" && "Upload a CSV file to bulk-add inventory items."}
                        {step === "preview" && "Review parsed items before importing."}
                        {step === "result" && "Import complete — see results below."}
                    </DialogDescription>
                </DialogHeader>

                {/* ── Step 1: Upload ────────────────────────────────────── */}
                {step === "upload" && (
                    <div
                        className={`
              flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-10 transition-colors cursor-pointer
              ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            `}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <div className="rounded-full bg-muted p-4">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-medium">
                                Drag & drop your CSV file here
                            </p>
                            <p className="text-sm text-muted-foreground">
                                or click to browse
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Expected columns: <span className="font-mono">name</span>, <span className="font-mono">sku</span>, <span className="font-mono">unit_cost</span>, <span className="font-mono">sell_price</span>, <span className="font-mono">stock</span>, <span className="font-mono">reorder_level</span>
                        </p>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>
                )}

                {/* ── Step 2: Preview ───────────────────────────────────── */}
                {step === "preview" && (
                    <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-hidden">
                        {/* Summary badges */}
                        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                            <Badge variant="secondary">
                                {parsedRows.length} row{parsedRows.length !== 1 ? "s" : ""} parsed
                            </Badge>
                            <Badge variant="default" className="bg-green-600">
                                {validCount} valid
                            </Badge>
                            {invalidCount > 0 && (
                                <Badge variant="destructive">
                                    {invalidCount} invalid
                                </Badge>
                            )}
                            {unmappedHeaders.length > 0 && (
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                    {unmappedHeaders.length} unmapped column{unmappedHeaders.length !== 1 ? "s" : ""}
                                </Badge>
                            )}
                        </div>

                        {unmappedHeaders.length > 0 && (
                            <p className="text-xs text-muted-foreground flex-shrink-0">
                                Ignored columns: {unmappedHeaders.join(", ")}
                            </p>
                        )}

                        {/* Preview table — scrollable container */}
                        <div className="min-h-0 flex-1 rounded-md border overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead className="w-[30px]">#</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Reorder</TableHead>
                                        <TableHead className="w-[30px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedRows.map((row, i) => {
                                        const hasWarning = row._valid && !!row._error;
                                        return (
                                            <TableRow
                                                key={i}
                                                className={
                                                    !row._valid
                                                        ? "bg-red-50 dark:bg-red-950/20"
                                                        : hasWarning
                                                            ? "bg-amber-50/50 dark:bg-amber-950/10"
                                                            : ""
                                                }
                                            >
                                                <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                                                <TableCell className="font-medium max-w-[180px] truncate">
                                                    {row.name || <span className="text-red-500 italic">missing</span>}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{row.stockKeepingUnit || "—"}</TableCell>
                                                <TableCell className="text-right">{currencyFmt.format(row.unitCost)}</TableCell>
                                                <TableCell className="text-right">{currencyFmt.format(row.sellPrice)}</TableCell>
                                                <TableCell className="text-right">{row.stockOnHand}</TableCell>
                                                <TableCell className="text-right">{row.reorderLevel}</TableCell>
                                                <TableCell>
                                                    {!row._valid ? (
                                                        <span title={row._error}><AlertCircle className="h-4 w-4 text-red-500" /></span>
                                                    ) : hasWarning ? (
                                                        <span title={row._error}><AlertCircle className="h-4 w-4 text-amber-500" /></span>
                                                    ) : (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {importing && (
                            <div className="space-y-2 flex-shrink-0">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Importing {validCount} items…
                                </div>
                                <Progress value={50} className="h-1.5" />
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 3: Results ───────────────────────────────────── */}
                {step === "result" && result && (
                    <div className="space-y-4">
                        {/* Summary cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4 text-center">
                                <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                    {result.created.length}
                                </p>
                                <p className="text-xs text-green-600">Created</p>
                            </div>
                            <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
                                <SkipForward className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                    {result.skipped.length}
                                </p>
                                <p className="text-xs text-amber-600">Skipped</p>
                            </div>
                            <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-4 text-center">
                                <X className="h-6 w-6 text-red-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                                    {result.errors.length}
                                </p>
                                <p className="text-xs text-red-600">Errors</p>
                            </div>
                        </div>

                        {/* Skipped details */}
                        {result.skipped.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Skipped (duplicate SKU)</p>
                                <ScrollArea className="max-h-[120px]">
                                    <div className="space-y-1">
                                        {result.skipped.map((s, i) => (
                                            <p key={i} className="text-xs text-muted-foreground">
                                                Row {s.row}: <span className="font-medium">{s.name}</span> — {s.reason}
                                            </p>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        {/* Error details */}
                        {result.errors.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-red-700 dark:text-red-400">Errors</p>
                                <ScrollArea className="max-h-[120px]">
                                    <div className="space-y-1">
                                        {result.errors.map((e, i) => (
                                            <p key={i} className="text-xs text-muted-foreground">
                                                Row {e.row}: <span className="font-medium">{e.name}</span> — {e.error}
                                            </p>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Footer ────────────────────────────────────────────── */}
                <DialogFooter className="flex-shrink-0">
                    {step === "upload" && (
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>
                            Cancel
                        </Button>
                    )}
                    {step === "preview" && (
                        <>
                            <Button variant="outline" onClick={reset} disabled={importing}>
                                Back
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={importing || validCount === 0}
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Importing…
                                    </>
                                ) : (
                                    `Import ${validCount} Item${validCount !== 1 ? "s" : ""}`
                                )}
                            </Button>
                        </>
                    )}
                    {step === "result" && (
                        <Button onClick={() => handleOpenChange(false)}>Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
