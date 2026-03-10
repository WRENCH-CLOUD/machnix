"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-grid";
import { ColumnDef } from "@tanstack/react-table";
import { InventoryTransaction } from "@/modules/inventory/domain/inventory.entity";
import { Badge } from "@/components/ui/badge";

interface TransactionHistoryProps {
  itemId?: string;
}

export function TransactionHistory({ itemId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) return;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/inventory/transactions?itemId=${itemId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [itemId]);

  if (!itemId) {
    return null;
  }

  return (
    <div className="mt-2">
      <div>
        {loading ? (
          <div className="text-center py-4">Loading history...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No transactions found.</div>
        ) : (
          <div className="w-full">
            {(() => {
              const columns: ColumnDef<InventoryTransaction>[] = [
                {
                  accessorKey: "date",
                  header: "Date",
                  cell: ({ row }) => <span>{format(new Date(row.original.createdAt), "MMM d, yyyy HH:mm")}</span>
                },
                {
                  accessorKey: "transactionType",
                  header: "Type",
                  cell: ({ row }) => (
                    <Badge variant="outline" className="capitalize">
                      {row.original.transactionType.replace("_", " ")}
                    </Badge>
                  )
                },
                {
                  accessorKey: "quantity",
                  header: "Quantity",
                  cell: ({ row }) => {
                    const tx = row.original;
                    const isMinus = tx.transactionType.includes("out") || tx.transactionType === "sale" || tx.transactionType === "usage";
                    return (
                      <span className={isMinus ? "text-red-500" : "text-green-600"}>
                        {isMinus ? "-" : "+"}
                        {tx.quantity}
                      </span>
                    );
                  }
                },
                {
                  accessorKey: "reference",
                  header: "Reference",
                  cell: ({ row }) => row.original.referenceType ? (
                    <span className="capitalize text-sm text-muted-foreground">
                      {row.original.referenceType}
                    </span>
                  ) : (
                    "-"
                  )
                }
              ];

              return <DataTable data={transactions} columns={columns} />;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
