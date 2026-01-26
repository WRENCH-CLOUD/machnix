"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Search, MoreVertical, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Mechanic {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    isActive: boolean;
    createdAt: string;
}

interface MechanicFormData {
    name: string;
    phone: string;
    email: string;
}

const initialFormData: MechanicFormData = {
    name: "",
    phone: "",
    email: "",
};

export default function MechanicsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null);
    const [formData, setFormData] = useState<MechanicFormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch mechanics
    const { data: mechanics = [], isLoading, error } = useQuery<Mechanic[]>({
        queryKey: ["mechanics"],
        queryFn: async () => {
            const response = await fetch("/api/mechanics");
            if (!response.ok) throw new Error("Failed to fetch mechanics");
            return response.json();
        },
    });

    // Filter mechanics by search query
    const filteredMechanics = useMemo(() => {
        if (!searchQuery.trim()) return mechanics;
        const query = searchQuery.toLowerCase();
        return mechanics.filter(
            (m) =>
                m.name.toLowerCase().includes(query) ||
                m.phone?.toLowerCase().includes(query) ||
                m.email?.toLowerCase().includes(query)
        );
    }, [mechanics, searchQuery]);

    const handleOpenAddDialog = useCallback(() => {
        setFormData(initialFormData);
        setEditingMechanic(null);
        setIsAddDialogOpen(true);
    }, []);

    const handleOpenEditDialog = useCallback((mechanic: Mechanic) => {
        setFormData({
            name: mechanic.name,
            phone: mechanic.phone || "",
            email: mechanic.email || "",
        });
        setEditingMechanic(mechanic);
        setIsAddDialogOpen(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setIsAddDialogOpen(false);
        setEditingMechanic(null);
        setFormData(initialFormData);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const url = editingMechanic
                ? `/api/mechanics/${editingMechanic.id}`
                : "/api/mechanics";
            const method = editingMechanic ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save mechanic");
            }

            toast.success(editingMechanic ? "Mechanic updated" : "Mechanic added");
            queryClient.invalidateQueries({ queryKey: ["mechanics"] });
            handleCloseDialog();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (mechanic: Mechanic) => {
        try {
            const response = await fetch(`/api/mechanics/${mechanic.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !mechanic.isActive }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update mechanic");
            }

            toast.success(mechanic.isActive ? "Mechanic deactivated" : "Mechanic activated");
            queryClient.invalidateQueries({ queryKey: ["mechanics"] });
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (mechanic: Mechanic) => {
        if (!confirm(`Delete mechanic "${mechanic.name}"? This cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/mechanics/${mechanic.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete mechanic");
            }

            toast.success("Mechanic deleted");
            queryClient.invalidateQueries({ queryKey: ["mechanics"] });
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive">Error loading mechanics: {error.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mechanics</h1>
                    <p className="text-muted-foreground">
                        Manage your garage technicians and mechanics
                    </p>
                </div>
                <Button onClick={handleOpenAddDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Mechanic
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Mechanics</CardTitle>
                    <CardDescription>
                        {mechanics.length} mechanic{mechanics.length !== 1 ? "s" : ""} total
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filteredMechanics.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {searchQuery ? "No mechanics match your search" : "No mechanics yet. Add your first mechanic!"}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMechanics.map((mechanic) => (
                                    <TableRow key={mechanic.id}>
                                        <TableCell className="font-medium">{mechanic.name}</TableCell>
                                        <TableCell>{mechanic.phone || "-"}</TableCell>
                                        <TableCell>{mechanic.email || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant={mechanic.isActive ? "default" : "secondary"}>
                                                {mechanic.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(mechanic)}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleActive(mechanic)}>
                                                        {mechanic.isActive ? (
                                                            <>
                                                                <ToggleLeft className="h-4 w-4 mr-2" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ToggleRight className="h-4 w-4 mr-2" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(mechanic)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingMechanic ? "Edit Mechanic" : "Add Mechanic"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingMechanic
                                ? "Update mechanic details"
                                : "Add a new mechanic to your garage"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="Enter mechanic name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                                    }
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    placeholder="Enter email address"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseDialog}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : editingMechanic ? "Update" : "Add"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
