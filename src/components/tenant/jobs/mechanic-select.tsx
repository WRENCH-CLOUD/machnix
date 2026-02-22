"use client";

import { useState, useEffect } from "react";
import { HardHat, Loader2, UserPlus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Mechanic {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
}

interface MechanicSelectProps {
    value?: string;
    onChange: (mechanicId: string) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    showUnassigned?: boolean;
}

export function MechanicSelect({
    value,
    onChange,
    disabled = false,
    className,
    placeholder = "Assign mechanic",
    showUnassigned = true,
}: MechanicSelectProps) {
    const [mechanics, setMechanics] = useState<Mechanic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMechanics();
    }, []);

    const loadMechanics = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/mechanics?activeOnly=true");
            if (response.ok) {
                const data = await response.json();
                setMechanics(data);
            }
        } catch (error) {
            console.error("Error loading mechanics:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectedMechanic = mechanics.find((m) => m.id === value);

    if (loading) {
        return (
            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
            </div>
        );
    }

    if (mechanics.length === 0) {
        return (
            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
                <UserPlus className="h-4 w-4" />
                <span>No mechanics available</span>
            </div>
        );
    }

    return (
        <Select
            value={value || ""}
            onValueChange={onChange}
            disabled={disabled}
        >
            <SelectTrigger className={cn("w-full", className)}>
                <SelectValue placeholder={placeholder}>
                    {selectedMechanic ? (
                        <span className="flex items-center gap-2">
                            <HardHat className="h-4 w-4" />
                            {selectedMechanic.name}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <HardHat className="h-4 w-4" />
                            {placeholder}
                        </span>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {showUnassigned && (
                    <SelectItem value="__unassigned__">
                        <span className="text-muted-foreground">Unassigned</span>
                    </SelectItem>
                )}
                {mechanics.map((mechanic) => (
                    <SelectItem key={mechanic.id} value={mechanic.id}>
                        <div className="flex items-center gap-2">
                            <HardHat className="h-4 w-4" />
                            <span>{mechanic.name}</span>
                            {mechanic.phone && (
                                <span className="text-xs text-muted-foreground">({mechanic.phone})</span>
                            )}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
