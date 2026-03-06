"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Search, Filter, AlertTriangle, MoreHorizontal, Edit, Trash, History, ArrowRightLeft, Package, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-grid";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InventoryItem } from "@/modules/inventory/domain/inventory.entity";
import { ItemFormModal } from "@/components/inventory/ItemFormModal";
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal";
import { TransactionHistory } from "@/components/inventory/TransactionHistory";
import { ImportInventoryModal } from "@/components/inventory/ImportInventoryModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

interface AllocationWithRelations {
  id: string;
  itemId: string;
  itemName: string;
  jobcardId: string;
  jobNumber: string;
  quantityReserved: number;
  quantityConsumed: number;
  status: 'reserved' | 'consumed' | 'released';
  reservedAt: string;
  consumedAt?: string;
  releasedAt?: string;
}

interface TransactionWithItem {
  id: string;
  itemId: string;
  itemName?: string;
  transactionType: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // New state for allocations and transactions
  const [reservedAllocations, setReservedAllocations] = useState<AllocationWithRelations[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionWithItem[]>([]);
  const [allocationsLoading, setAllocationsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<InventoryItem | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/items");
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async () => {
    setAllocationsLoading(true);
    try {
      const res = await fetch("/api/inventory/allocations?with_relations=true&status=reserved&limit=20");
      const data = await res.json();
      if (Array.isArray(data)) {
        setReservedAllocations(data);
      }
    } catch (error) {
      console.error("Failed to fetch allocations", error);
    } finally {
      setAllocationsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const res = await fetch("/api/inventory/transactions?limit=20");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecentTransactions(data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchAllocations();
    fetchTransactions();
  }, []);

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/inventory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchItems();
    } else {
      const error = await res.json();
      toast.error(error.error || "Failed to create item");
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingItem) return;
    const res = await fetch(`/api/inventory/items/${editingItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchItems();
      setEditingItem(null);
    } else {
      const error = await res.json();
      toast.error(error.error || "Failed to update item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const res = await fetch(`/api/inventory/items/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchItems();
    }
  };

  const handleAdjustStock = async (data: any) => {
    if (!adjustingItem) return;
    const res = await fetch(`/api/inventory/items/${adjustingItem.id}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchItems();
      fetchTransactions(); // Refresh transactions after adjustment
      setAdjustingItem(null);
    } else {
      const error = await res.json();
      toast.error(error.error || "Failed to adjust stock");
    }
  };

  // const refreshAll = () => { // Utility function to refresh all data after any operation
  //   fetchItems();
  //   fetchAllocations();
  //   fetchTransactions();
  // }; 

  const getTransactionBadgeVariant = useCallback((type: string) => {
    switch (type) {
      case 'purchase':
      case 'adjustment_in':
      case 'return':
        return 'default';
      case 'sale':
      case 'usage':
      case 'adjustment_out':
        return 'destructive';
      case 'reserve':
        return 'secondary';
      case 'unreserve':
        return 'outline';
      default:
        return 'secondary';
    }
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.stockKeepingUnit?.toLowerCase().includes(search.toLowerCase())
  );

  const inventoryColumns = useMemo<ColumnDef<InventoryItem>[]>(() => [
    { accessorKey: "name", header: "Item", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "stockKeepingUnit", header: "Stock Keeping Unit", cell: ({ row }) => row.original.stockKeepingUnit || "-" },
    {
      accessorKey: "stockOnHand",
      header: "On Hand",
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            {item.stockOnHand <= item.reorderLevel && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            <span className={item.stockOnHand <= item.reorderLevel ? "text-yellow-600 font-medium" : ""}>
              {item.stockOnHand}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: "stockReserved",
      header: "Reserved",
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row }) => {
        const reserved = row.original.stockReserved || 0;
        return reserved > 0 ? (
          <span className="text-orange-600 font-medium">{reserved}</span>
        ) : (
          <span className="text-muted-foreground">0</span>
        );
      }
    },
    {
      id: "available",
      header: "Available",
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row }) => {
        const item = row.original;
        const available = item.stockOnHand - (item.stockReserved || 0);
        return (
          <span className={available <= 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
            {available}
          </span>
        );
      }
    },
    {
      accessorKey: "unitCost",
      header: "Cost",
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row }) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(row.original.unitCost)
    },
    {
      accessorKey: "sellPrice",
      header: "Price",
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row }) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(row.original.sellPrice)
    },
    {
      id: "actions",
      header: "",
      meta: { headerClassName: "w-[50px]", cellClassName: "" },
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setEditingItem(item)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAdjustingItem(item)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Adjust Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewingHistoryItem(item)}>
                <History className="mr-2 h-4 w-4" /> History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDelete(item.id)}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ], [setEditingItem, setAdjustingItem, setViewingHistoryItem]);

  const allocationColumns = useMemo<ColumnDef<AllocationWithRelations>[]>(() => [
    { accessorKey: "itemName", header: "Item", cell: ({ row }) => <span className="font-medium">{row.original.itemName}</span> },
    { accessorKey: "jobNumber", header: "Job", cell: ({ row }) => <Badge variant="outline">{row.original.jobNumber}</Badge> },
    {
      accessorKey: "quantityReserved",
      header: "Qty",
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row }) => <span className="font-medium text-orange-600">{row.original.quantityReserved}</span>
    },
    {
      accessorKey: "reservedAt",
      header: "Reserved",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{formatDate(row.original.reservedAt)}</span>
    }
  ], [formatDate]);

  const transactionColumns = useMemo<ColumnDef<TransactionWithItem>[]>(() => [
    { accessorKey: "itemName", header: "Item", cell: ({ row }) => <span className="font-medium">{row.original.itemName || 'Unknown'}</span> },
    {
      accessorKey: "transactionType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={getTransactionBadgeVariant(row.original.transactionType)}>
          {row.original.transactionType.replace('_', ' ')}
        </Badge>
      )
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
      cell: ({ row }) => {
        const tx = row.original;
        const prefix = ['purchase', 'adjustment_in', 'return', 'unreserve'].includes(tx.transactionType) ? '+' : '-';
        return <span className="font-medium">{prefix}{tx.quantity}</span>;
      }
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{formatDate(row.original.createdAt)}</span>
    }
  ], [formatDate, getTransactionBadgeVariant]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your parts and stock levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <Button className="mr-4" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Reserved Stock and Recent Transactions Grid Moved Up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reserved Stock Card */}
        <Card className="flex flex-col h-[350px]">
          <CardHeader className="pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Reserved Stock
                </CardTitle>
                <CardDescription>Parts currently reserved for jobs</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchAllocations}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <DataTable columns={allocationColumns} data={reservedAllocations} pageSize={5} stretch={true} />
          </CardContent>
        </Card>

        {/* Recent Transactions Card */}
        <Card className="flex flex-col h-[350px]">
          <CardHeader className="pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest inventory operations</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchTransactions}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <DataTable columns={transactionColumns} data={recentTransactions} pageSize={5} stretch={true} />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Filter button placeholder */}
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Inventory Table */}
      <DataTable columns={inventoryColumns} data={filteredItems} />

      <ItemFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        mode="create"
      />

      {editingItem && (
        <ItemFormModal
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onSubmit={handleUpdate}
          initialData={editingItem}
          mode="edit"
        />
      )}

      {adjustingItem && (
        <StockAdjustmentModal
          open={!!adjustingItem}
          onOpenChange={(open) => !open && setAdjustingItem(null)}
          onSubmit={handleAdjustStock}
          itemName={adjustingItem.name}
        />
      )}

      {viewingHistoryItem && (
        <Dialog open={!!viewingHistoryItem} onOpenChange={(open) => !open && setViewingHistoryItem(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Transaction History</DialogTitle>
              <DialogDescription>
                Viewing transaction history for {viewingHistoryItem.name}
              </DialogDescription>
            </DialogHeader>
            <TransactionHistory itemId={viewingHistoryItem.id} />
          </DialogContent>
        </Dialog>
      )}

      <ImportInventoryModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportComplete={fetchItems}
      />
    </div>
  );
}
