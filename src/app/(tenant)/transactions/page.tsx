"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CreditCard, Search, Car, User, Briefcase } from "lucide-react";
import Link from "next/link";

export default function TransactionsPage() {
    const { data: transactions, isLoading, error } = useTransactions();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [modeFilter, setModeFilter] = useState<string>("all");

    // Filter transactions
    const filteredTransactions = (transactions || []).filter((tx) => {
        // Search filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            !searchQuery ||
            tx.id.toLowerCase().includes(searchLower) ||
            tx.customer?.name?.toLowerCase().includes(searchLower) ||
            tx.vehicle?.regNo?.toLowerCase().includes(searchLower) ||
            tx.jobcard?.jobNumber?.toLowerCase().includes(searchLower) ||
            tx.invoice?.invoiceNumber?.toLowerCase().includes(searchLower);

        // Status filter
        const matchesStatus = statusFilter === "all" || tx.status === statusFilter;

        // Mode filter
        const matchesMode = modeFilter === "all" || tx.mode === modeFilter;

        return matchesSearch && matchesStatus && matchesMode;
    });

    // Get unique modes for filter
    const modes = [...new Set((transactions || []).map((tx) => tx.mode))];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Completed</Badge>;
            case "pending":
            case "initiated":
                return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>;
            case "failed":
                return <Badge className="bg-red-500/20 text-red-400 border-0">Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (error) {
        return (
            <div className="p-6">
                <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-6 text-center">
                        <p className="text-red-400">Failed to load transactions</p>
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
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CreditCard className="w-6 h-6" />
                        Transactions
                    </h1>
                    <p className="text-muted-foreground">
                        View all payment transactions
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by ID, customer, vehicle, job..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="initiated">Initiated</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={modeFilter} onValueChange={setModeFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Payment Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Modes</SelectItem>
                                {modes.map((mode) => (
                                    <SelectItem key={mode} value={mode}>
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? "s" : ""}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No transactions found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Job</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-mono text-xs">
                                                {tx.id.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDate(tx.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {tx.customer ? (
                                                    <Link
                                                        href={`/customers?id=${tx.customer.id}`}
                                                        className="flex items-center gap-1 text-primary hover:underline"
                                                    >
                                                        <User className="w-3 h-3" />
                                                        {tx.customer.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {tx.vehicle ? (
                                                    <Link
                                                        href={`/vehicles?id=${tx.vehicle.id}`}
                                                        className="flex items-center gap-1 text-primary hover:underline"
                                                    >
                                                        <Car className="w-3 h-3" />
                                                        {tx.vehicle.regNo}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {tx.jobcard ? (
                                                    <Link
                                                        href={`/jobs-board?job=${tx.jobcard.id}`}
                                                        className="flex items-center gap-1 text-primary hover:underline"
                                                    >
                                                        <Briefcase className="w-3 h-3" />
                                                        {tx.jobcard.jobNumber}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatAmount(tx.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {tx.mode}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
