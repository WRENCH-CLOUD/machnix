"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter, AlertTriangle, MoreHorizontal, Edit, Trash, History, ArrowRightLeft, Package, Clock } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
        alert(error.error || "Failed to create item");
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
         alert(error.error || "Failed to update item");
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
         alert(error.error || "Failed to adjust stock");
    }
  };

  const refreshAll = () => {
    fetchItems();
    fetchAllocations();
    fetchTransactions();
  };

  const getTransactionBadgeVariant = (type: string) => {
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
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.stockKeepingUnit?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your parts and stock levels.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
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

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Stock Keeping Unit</TableHead>
              <TableHead className="text-right">On Hand</TableHead>
              <TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const available = item.stockOnHand - (item.stockReserved || 0);
                return (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.stockKeepingUnit || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.stockOnHand <= item.reorderLevel && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span
                        className={
                          item.stockOnHand <= item.reorderLevel
                            ? "text-yellow-600 font-medium"
                            : ""
                        }
                      >
                        {item.stockOnHand}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {(item.stockReserved || 0) > 0 ? (
                      <span className="text-orange-600 font-medium">{item.stockReserved}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={available <= 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                      {available}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(item.unitCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(item.sellPrice)}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reserved Stock and Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reserved Stock Card */}
        <Card>
          <CardHeader className="pb-3">
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
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Reserved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocationsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-20">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : reservedAllocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-20 text-muted-foreground">
                        No reserved stock
                      </TableCell>
                    </TableRow>
                  ) : (
                    reservedAllocations.map((allocation) => (
                      <TableRow key={allocation.id}>
                        <TableCell className="font-medium">{allocation.itemName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{allocation.jobNumber}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-orange-600">
                          {allocation.quantityReserved}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(allocation.reservedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions Card */}
        <Card>
          <CardHeader className="pb-3">
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
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-20">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-20 text-muted-foreground">
                        No recent activity
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.itemName || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={getTransactionBadgeVariant(tx.transactionType)}>
                            {tx.transactionType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {['purchase', 'adjustment_in', 'return', 'unreserve'].includes(tx.transactionType) ? '+' : '-'}
                          {tx.quantity}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
