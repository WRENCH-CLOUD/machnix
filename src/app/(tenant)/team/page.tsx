"use client";

import { useState, useCallback, useMemo } from "react";
import {
    Plus, Search, MoreVertical, Pencil, Trash2, ToggleLeft, ToggleRight,
    Wrench, Zap, Clock, TrendingUp, AlertTriangle, Coffee, PackageOpen,
    Star, ChevronDown, X, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

type WorkStatus = "idle" | "working" | "waiting_for_part" | "on_leave";

interface Mechanic {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    isActive: boolean;
    efficiencyScore: number;
    currentWorkStatus: WorkStatus;
    createdAt: string;
}

interface MechanicFormData {
    name: string;
    phone: string;
    email: string;
}

const STATUS_CONFIG: Record<WorkStatus, {
    label: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
    icon: React.ElementType;
    pulse?: boolean;
}> = {
    idle: {
        label: "Idle",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        dot: "bg-emerald-400",
        icon: CheckCircle2,
    },
    working: {
        label: "Working",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        dot: "bg-amber-400",
        icon: Wrench,
        pulse: true,
    },
    waiting_for_part: {
        label: "Waiting for Part",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        dot: "bg-blue-400",
        icon: PackageOpen,
    },
    on_leave: {
        label: "On Leave",
        color: "text-slate-400",
        bg: "bg-slate-500/10",
        border: "border-slate-500/30",
        dot: "bg-slate-500",
        icon: Coffee,
    },
};

function EfficiencyBar({ score }: { score: number }) {
    const pct = Math.round(score * 100);
    const color =
        score >= 1.2 ? "bg-emerald-500" :
            score >= 0.9 ? "bg-amber-500" :
                "bg-red-500";
    return (
        <div className="flex items-center gap-2">
            <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden flex-1">
                <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all ${color}`}
                    style={{ width: `${Math.min(pct, 150) / 1.5}%` }}
                />
            </div>
            <span className={`text-xs font-mono tabular-nums shrink-0 ${score >= 1.0 ? "text-emerald-400" : "text-red-400"}`}>
                {pct}%
            </span>
        </div>
    );
}

function MechanicCard({ mechanic, onEdit, onDelete, onToggleActive, onStatusChange }: {
    mechanic: Mechanic;
    onEdit: (m: Mechanic) => void;
    onDelete: (m: Mechanic) => void;
    onToggleActive: (m: Mechanic) => void;
    onStatusChange: (id: string, status: WorkStatus) => void;
}) {
    const cfg = STATUS_CONFIG[mechanic.currentWorkStatus] ?? STATUS_CONFIG.idle;
    const StatusIcon = cfg.icon;

    return (
        <Card className={`relative overflow-hidden transition-all border ${cfg.border} hover:shadow-md hover:shadow-black/20`}>
            {/* Top Accent Bar */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg.dot}`} />

            <CardContent className="pt-4 pb-4 px-4">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${cfg.bg} ${cfg.color} border ${cfg.border} shrink-0`}>
                            {mechanic.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="font-semibold text-sm leading-tight">{mechanic.name}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{mechanic.phone || mechanic.email || "—"}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {!mechanic.isActive && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inactive</Badge>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-sm">
                                <DropdownMenuItem onClick={() => onEdit(mechanic)}>
                                    <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onToggleActive(mechanic)}>
                                    {mechanic.isActive ? (
                                        <><ToggleLeft className="h-3.5 w-3.5 mr-2" /> Deactivate</>
                                    ) : (
                                        <><ToggleRight className="h-3.5 w-3.5 mr-2" /> Activate</>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(mechanic)}>
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Status Badge + Quick-Change */}
                <div className="flex items-center gap-2 mb-3">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                    </div>

                    {/* Quick Status Change */}
                    <Select
                        value={mechanic.currentWorkStatus}
                        onValueChange={(v) => onStatusChange(mechanic.id, v as WorkStatus)}
                    >
                        <SelectTrigger className="h-6 w-6 border-0 p-0 [&>svg]:hidden bg-transparent hover:bg-muted rounded-full">
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                <SelectItem key={key} value={key} className="text-xs">
                                    <span className={val.color}>{val.label}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Efficiency Score */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Efficiency Score
                        </span>
                        <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-2.5 h-2.5 ${i < Math.round(mechanic.efficiencyScore * 5 / 1.5) ? "text-amber-400 fill-amber-400" : "text-muted"}`}
                                />
                            ))}
                        </div>
                    </div>
                    <EfficiencyBar score={mechanic.efficiencyScore} />
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Summary Strip
// ============================================================================
function CommandSummary({ mechanics }: { mechanics: Mechanic[] }) {
    const working = mechanics.filter(m => m.currentWorkStatus === "working").length;
    const idle = mechanics.filter(m => m.currentWorkStatus === "idle").length;
    const waiting = mechanics.filter(m => m.currentWorkStatus === "waiting_for_part").length;
    const onLeave = mechanics.filter(m => m.currentWorkStatus === "on_leave").length;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
                { label: "Working", count: working, color: "text-amber-400", bg: "bg-amber-500/10", icon: Wrench },
                { label: "Idle – Available", count: idle, color: "text-emerald-400", bg: "bg-emerald-500/10", icon: Zap },
                { label: "Waiting for Part", count: waiting, color: "text-blue-400", bg: "bg-blue-500/10", icon: PackageOpen },
                { label: "On Leave", count: onLeave, color: "text-slate-400", bg: "bg-slate-500/10", icon: Coffee },
            ].map(({ label, count, color, bg, icon: Icon }) => (
                <div key={label} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${bg} border border-white/5`}>
                    <Icon className={`w-5 h-5 ${color} shrink-0`} />
                    <div>
                        <div className={`text-xl font-bold tabular-nums ${color}`}>{count}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// Main Page
// ============================================================================
export default function TeamPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<WorkStatus | "all">("all");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null);
    const [formData, setFormData] = useState<MechanicFormData>({ name: "", phone: "", email: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: mechanics = [], isLoading } = useQuery<Mechanic[]>({
        queryKey: ["mechanics"],
        queryFn: async () => {
            const res = await fetch("/api/mechanics");
            if (!res.ok) throw new Error("Failed to fetch mechanics");
            return res.json();
        },
        refetchInterval: 30_000, // Auto-refresh every 30s for live feel
    });

    const statusChangeMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: WorkStatus }) => {
            const res = await fetch(`/api/mechanics/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentWorkStatus: status }),
            });
            if (!res.ok) throw new Error("Failed to update status");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mechanics"] });
            toast.success("Status updated");
        },
        onError: () => toast.error("Failed to update status"),
    });

    const filteredMechanics = useMemo(() => {
        return mechanics.filter(m => {
            const matchSearch = !searchQuery.trim() ||
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.phone?.includes(searchQuery) ||
                m.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = filterStatus === "all" || m.currentWorkStatus === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [mechanics, searchQuery, filterStatus]);

    const handleOpenAddDialog = useCallback(() => {
        setFormData({ name: "", phone: "", email: "" });
        setEditingMechanic(null);
        setIsAddDialogOpen(true);
    }, []);

    const handleOpenEditDialog = useCallback((mechanic: Mechanic) => {
        setFormData({ name: mechanic.name, phone: mechanic.phone || "", email: mechanic.email || "" });
        setEditingMechanic(mechanic);
        setIsAddDialogOpen(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setIsAddDialogOpen(false);
        setEditingMechanic(null);
        setFormData({ name: "", phone: "", email: "" });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) { toast.error("Name is required"); return; }
        setIsSubmitting(true);
        try {
            const url = editingMechanic ? `/api/mechanics/${editingMechanic.id}` : "/api/mechanics";
            const method = editingMechanic ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save mechanic");
            }
            toast.success(editingMechanic ? "Mechanic updated" : "Mechanic added");
            queryClient.invalidateQueries({ queryKey: ["mechanics"] });
            handleCloseDialog();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (mechanic: Mechanic) => {
        try {
            const res = await fetch(`/api/mechanics/${mechanic.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !mechanic.isActive }),
            });
            if (!res.ok) throw new Error("Failed to update");
            toast.success(mechanic.isActive ? "Mechanic deactivated" : "Mechanic activated");
            queryClient.invalidateQueries({ queryKey: ["mechanics"] });
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (mechanic: Mechanic) => {
        if (!confirm(`Delete mechanic "${mechanic.name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/mechanics/${mechanic.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Mechanic deleted");
            queryClient.invalidateQueries({ queryKey: ["mechanics"] });
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-primary" />
                        Mechanics Command Center
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Live view of your team — status, efficiency, and assignments at a glance.
                    </p>
                </div>
                <Button onClick={handleOpenAddDialog} className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" /> Add Mechanic
                </Button>
            </div>

            {/* ── Summary Strip ── */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
            ) : (
                <CommandSummary mechanics={mechanics} />
            )}

            {/* ── Filters ── */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search mechanic..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {(["all", "idle", "working", "waiting_for_part", "on_leave"] as const).map((s) => {
                        const label = s === "all" ? "All" : STATUS_CONFIG[s]?.label;
                        const isActive = filterStatus === s;
                        return (
                            <Button
                                key={s}
                                variant={isActive ? "default" : "outline"}
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => setFilterStatus(s)}
                            >
                                {label}
                                {isActive && s !== "all" && (
                                    <X className="w-3 h-3 ml-1.5" onClick={(e) => { e.stopPropagation(); setFilterStatus("all"); }} />
                                )}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* ── Cards Grid ── */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
                </div>
            ) : filteredMechanics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <Wrench className="w-10 h-10 opacity-20" />
                    <p className="text-sm">{searchQuery || filterStatus !== "all" ? "No mechanics match your filter." : "No mechanics yet. Add your first one!"}</p>
                    {!searchQuery && filterStatus === "all" && (
                        <Button variant="outline" size="sm" onClick={handleOpenAddDialog}>
                            <Plus className="w-4 h-4 mr-2" /> Add Mechanic
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredMechanics.map((m) => (
                        <MechanicCard
                            key={m.id}
                            mechanic={m}
                            onEdit={handleOpenEditDialog}
                            onDelete={handleDelete}
                            onToggleActive={handleToggleActive}
                            onStatusChange={(id, status) => statusChangeMutation.mutate({ id, status })}
                        />
                    ))}
                </div>
            )}

            {/* ── Add / Edit Dialog ── */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMechanic ? "Edit Mechanic" : "Add Mechanic"}</DialogTitle>
                        <DialogDescription>
                            {editingMechanic ? "Update mechanic details" : "Add a new mechanic to your team"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Ravi Kumar" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="+91 9876543210" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="mechanic@garage.com" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving…" : editingMechanic ? "Update" : "Add Mechanic"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
