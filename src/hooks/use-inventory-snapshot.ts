"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useEffect } from "react";
import { api } from "@/lib/supabase/client";
import type { 
  InventorySnapshotItem, 
  InventorySnapshotResponse, 
  InventoryDeltaResponse 
} from "@/modules/inventory/domain/inventory.entity";

// ============================================================================
// Query Keys
// ============================================================================

export const inventorySnapshotKeys = {
  all: ["inventory-snapshot"] as const,
  snapshot: () => [...inventorySnapshotKeys.all, "snapshot"] as const,
  syncedAt: () => [...inventorySnapshotKeys.all, "syncedAt"] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface InventorySnapshot {
  items: Map<string, InventorySnapshotItem>;
  syncedAt: string;
  initialized: boolean;
}

export interface UseInventorySnapshotReturn {
  /** Array of inventory items (for compatibility with existing components) */
  items: InventorySnapshotItem[];
  /** Map of items keyed by ID for O(1) lookups */
  itemsMap: Map<string, InventorySnapshotItem>;
  /** Whether initial snapshot is loading */
  isLoading: boolean;
  /** Error from snapshot fetch */
  error: Error | null;
  /** Whether snapshot is initialized */
  isInitialized: boolean;
  /** Last sync timestamp */
  syncedAt: string | null;
  /** Manual refresh function (fetches delta or full sync) */
  refresh: () => Promise<void>;
  /** Force full resync (discards cache) */
  forceFullSync: () => Promise<void>;
  /** Get single item by ID (O(1) lookup) */
  getItem: (id: string) => InventorySnapshotItem | undefined;
  /** Search items by name or SKU (client-side filter) */
  searchItems: (query: string, limit?: number) => InventorySnapshotItem[];
  /** Update specific items in cache (used after operations) */
  updateItems: (items: InventorySnapshotItem[]) => void;
  /** Remove items from cache by ID */
  removeItems: (ids: string[]) => void;
}

// ============================================================================
// Constants
// ============================================================================

/** How often to auto-sync in background (5 minutes) */
const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;

/** Stale time for snapshot (essentially infinite - we control refresh manually) */
const SNAPSHOT_STALE_TIME = Infinity;

/** GC time for snapshot (30 minutes - keep in memory for session) */
const SNAPSHOT_GC_TIME = 30 * 60 * 1000;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useInventorySnapshot
 * 
 * Manages client-side inventory cache with efficient delta sync.
 * 
 * Features:
 * - Loads full snapshot on first access
 * - Subsequent refreshes use delta sync (only changed items)
 * - Provides O(1) lookups by ID
 * - Client-side search/filter
 * - Manual and automatic refresh
 * - Graceful fallback to full sync when needed
 * 
 * Usage:
 * ```tsx
 * const { items, isLoading, searchItems, getItem, refresh } = useInventorySnapshot();
 * 
 * // For autocomplete
 * const filtered = searchItems(searchTerm, 50);
 * 
 * // For direct lookup
 * const item = getItem(itemId);
 * ```
 */
export function useInventorySnapshot(): UseInventorySnapshotReturn {
  const queryClient = useQueryClient();
  const syncedAtRef = useRef<string | null>(null);
  const autoSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================
  // Initial Snapshot Query
  // ========================================
  const { 
    data: snapshot, 
    isLoading, 
    error,
    refetch: refetchSnapshot 
  } = useQuery({
    queryKey: inventorySnapshotKeys.snapshot(),
    queryFn: async (): Promise<InventorySnapshot> => {
      const res = await api.get("/api/inventory/items/snapshot");
      if (!res.ok) throw new Error("Failed to fetch inventory snapshot");
      
      const data: InventorySnapshotResponse = await res.json();
      
      // Convert array to Map for O(1) lookups
      const itemsMap = new Map<string, InventorySnapshotItem>();
      data.items.forEach(item => itemsMap.set(item.id, item));
      
      // Store syncedAt for delta requests
      syncedAtRef.current = data.syncedAt;
      
      return {
        items: itemsMap,
        syncedAt: data.syncedAt,
        initialized: true,
      };
    },
    staleTime: SNAPSHOT_STALE_TIME,
    gcTime: SNAPSHOT_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // ========================================
  // Delta Sync Mutation
  // ========================================
  const deltaSyncMutation = useMutation({
    mutationFn: async (since: string): Promise<InventoryDeltaResponse> => {
      const res = await api.get(`/api/inventory/items/delta?since=${encodeURIComponent(since)}`);
      if (!res.ok) throw new Error("Failed to fetch inventory delta");
      return res.json();
    },
    onSuccess: (delta) => {
      if (delta.requiresFullSync) {
        // Too many changes, do full resync
        refetchSnapshot();
        return;
      }

      // Apply delta to existing snapshot
      queryClient.setQueryData<InventorySnapshot>(
        inventorySnapshotKeys.snapshot(),
        (old) => {
          if (!old) return old;
          
          const newItems = new Map(old.items);
          
          // Apply upserts
          delta.upserted.forEach(item => {
            newItems.set(item.id, item);
          });
          
          // Apply deletes
          delta.deleted.forEach(id => {
            newItems.delete(id);
          });
          
          syncedAtRef.current = delta.syncedAt;
          
          return {
            items: newItems,
            syncedAt: delta.syncedAt,
            initialized: true,
          };
        }
      );
    },
  });

  // ========================================
  // Refresh Function (delta or full)
  // ========================================
  const refresh = useCallback(async () => {
    if (syncedAtRef.current) {
      // Have a sync timestamp, try delta
      await deltaSyncMutation.mutateAsync(syncedAtRef.current);
    } else {
      // No sync timestamp, do full sync
      await refetchSnapshot();
    }
  }, [deltaSyncMutation, refetchSnapshot]);

  // ========================================
  // Force Full Sync
  // ========================================
  const forceFullSync = useCallback(async () => {
    syncedAtRef.current = null;
    await refetchSnapshot();
  }, [refetchSnapshot]);

  // ========================================
  // Item Lookup (O(1))
  // ========================================
  const getItem = useCallback((id: string): InventorySnapshotItem | undefined => {
    return snapshot?.items.get(id);
  }, [snapshot]);

  // ========================================
  // Search/Filter (client-side)
  // ========================================
  const searchItems = useCallback((query: string, limit: number = 50): InventorySnapshotItem[] => {
    if (!snapshot?.items) return [];
    
    const searchLower = query.toLowerCase().trim();
    if (!searchLower) {
      // No query, return first N items
      return Array.from(snapshot.items.values()).slice(0, limit);
    }
    
    const results: InventorySnapshotItem[] = [];
    for (const item of snapshot.items.values()) {
      if (results.length >= limit) break;
      
      const nameMatch = item.name.toLowerCase().includes(searchLower);
      const skuMatch = item.stockKeepingUnit?.toLowerCase().includes(searchLower);
      
      if (nameMatch || skuMatch) {
        results.push(item);
      }
    }
    
    return results;
  }, [snapshot]);

  // ========================================
  // Update Items (after operations)
  // ========================================
  const updateItems = useCallback((items: InventorySnapshotItem[]) => {
    queryClient.setQueryData<InventorySnapshot>(
      inventorySnapshotKeys.snapshot(),
      (old) => {
        if (!old) return old;
        
        const newItemsMap = new Map(old.items);
        items.forEach(item => {
          newItemsMap.set(item.id, item);
        });
        
        return {
          ...old,
          items: newItemsMap,
        };
      }
    );
  }, [queryClient]);

  // ========================================
  // Remove Items (after delete operations)
  // ========================================
  const removeItems = useCallback((ids: string[]) => {
    queryClient.setQueryData<InventorySnapshot>(
      inventorySnapshotKeys.snapshot(),
      (old) => {
        if (!old) return old;
        
        const newItemsMap = new Map(old.items);
        ids.forEach(id => {
          newItemsMap.delete(id);
        });
        
        return {
          ...old,
          items: newItemsMap,
        };
      }
    );
  }, [queryClient]);

  // ========================================
  // Auto-sync on interval (background)
  // ========================================
  useEffect(() => {
    // Only set up auto-sync if snapshot is initialized
    if (!snapshot?.initialized) return;

    autoSyncIntervalRef.current = setInterval(() => {
      // Don't auto-sync if tab is hidden
      if (document.hidden) return;
      
      // Perform delta sync in background
      if (syncedAtRef.current) {
        deltaSyncMutation.mutate(syncedAtRef.current);
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
      }
    };
  }, [snapshot?.initialized, deltaSyncMutation]);

  // ========================================
  // Return Value
  // ========================================
  return {
    items: snapshot ? Array.from(snapshot.items.values()) : [],
    itemsMap: snapshot?.items ?? new Map(),
    isLoading,
    error: error as Error | null,
    isInitialized: snapshot?.initialized ?? false,
    syncedAt: snapshot?.syncedAt ?? null,
    refresh,
    forceFullSync,
    getItem,
    searchItems,
    updateItems,
    removeItems,
  };
}

/**
 * Lightweight hook for just the item count
 * Useful for displaying "X items in inventory" without loading full snapshot
 */
export function useInventoryItemCount(): number {
  const { itemsMap } = useInventorySnapshot();
  return itemsMap.size;
}
