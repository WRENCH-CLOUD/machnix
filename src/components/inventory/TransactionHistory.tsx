"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/** Client-safe transaction shape (no raw DB IDs) */
interface SafeTransaction {
  itemId: string;
  transactionType: string;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  createdBy?: string;
  createdAt: string;
}

interface TransactionHistoryProps {
  itemId?: string;
}

export function TransactionHistory({ itemId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<SafeTransaction[]>([]);
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, index) => (
                <TableRow key={`${tx.itemId}-${tx.createdAt}-${index}`}>
                  <TableCell>{format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {tx.transactionType.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={tx.transactionType.includes("out") || tx.transactionType === "sale" || tx.transactionType === "usage" ? "text-red-500" : "text-green-600"}>
                      {tx.transactionType.includes("out") || tx.transactionType === "sale" || tx.transactionType === "usage" ? "-" : "+"}
                      {tx.quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    {tx.referenceType ? (
                      <span className="capitalize text-sm text-muted-foreground">
                        {tx.referenceType}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
