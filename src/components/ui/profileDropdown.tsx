"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Settings, CreditCard, FileText, LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Avatar from "boring-avatars";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface Profile {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    tenantName?: string;
    subscription?: string;
    model?: string;
}

interface MenuItem {
    label: string;
    value?: string;
    href: string;
    icon: React.ReactNode;
    external?: boolean;
}

const SAMPLE_PROFILE_DATA: Profile = {
    name: "User",
    email: "user@example.com",
    role: "Tenant Admin",
    tenantName: "Mechanix Garage",
};

interface ProfileDropdownProps {
    data?: Profile;
    onSignOut?: () => void;
    className?: string;
}

export default function ProfileDropdown({
    data = SAMPLE_PROFILE_DATA,
    onSignOut,
    className,
}: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [imageError, setImageError] = React.useState(false);
    
    const menuItems: MenuItem[] = [
        {
            label: "Profile",
            href: "/settings/profile",
            icon: <User className="w-4 h-4" />,
        },
        {
            label: "Settings",
            href: "/settings",
            icon: <Settings className="w-4 h-4" />,
        },
    ];

    return (
        <div className={cn("relative", className)}>
            <DropdownMenu onOpenChange={setIsOpen}>
                <div className="group relative">
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-4 p-1.5 pr-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 hover:shadow-sm transition-all duration-200 focus:outline-none"
                        >
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20">
                                {!imageError && data.avatar ? (
                                    <Image
                                        src={data.avatar}
                                        alt={data.name}
                                        fill
                                        className="object-cover"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <Avatar
                                        size={36}
                                        name={data.email || data.name}
                                        variant="beam"
                                        colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
                                    />
                                )}
                            </div>
                            <div className="text-left hidden sm:block">
                                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                                    {data.name}
                                </div>
                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 tracking-tight leading-tight uppercase">
                                    {data.role}
                                </div>
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent 
                        align="end" 
                        sideOffset={8}
                        className="w-64 p-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-xl"
                    >
                        <div className="px-3 py-2.5 mb-2">
                            <div className="text-sm font-semibold">{data.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{data.email}</div>
                            {data.tenantName && (
                                <div className="mt-2 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="text-[10px] font-medium text-primary/80 uppercase tracking-wider">
                                        {data.tenantName}
                                    </span>
                                </div>
                            )}
                        </div>
                        <DropdownMenuSeparator className="mx-2 mb-2 bg-zinc-200/60 dark:bg-zinc-800/60" />
                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <DropdownMenuItem key={item.label} asChild>
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 rounded-xl transition-all duration-200 cursor-pointer group"
                                    >
                                        <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                            {item.icon}
                                        </div>
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </div>
                        <DropdownMenuSeparator className="mx-2 my-2 bg-zinc-200/60 dark:bg-zinc-800/60" />
                        <DropdownMenuItem 
                            onClick={onSignOut}
                            className="flex items-center gap-3 px-3 py-2 text-red-500 focus:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl cursor-pointer group"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Sign out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </div>
            </DropdownMenu>
        </div>
    );
}
