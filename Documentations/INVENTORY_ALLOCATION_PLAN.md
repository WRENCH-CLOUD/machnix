# Inventory Allocation & Consumption Implementation Plan

## Overview

This document outlines the implementation plan for automatic inventory management tied to the job card lifecycle. The system will:
1. **Reserve** parts when added to an estimate (linked to a job card)
2. **Consume** parts when tasks are marked as "changed"
3. **Release** reserved parts if job is cancelled or parts are removed

---

## Current State Analysis

### Existing Infrastructure

| Component | Current State |
|-----------|---------------|
| `inventory_items` | Stores parts with `stock_on_hand` field |
| `inventory_transactions` | Logs movements (purchase, sale, adjustment_in/out, return, usage) |
| `estimate_items` | Links parts (`part_id`) to estimates via `estimate_id` |
| `estimates` | Linked to job cards via `jobcard_id` |
| `TodoItem.status` | Has "changed", "repaired", "no_change" statuses |

### Missing Components
- No `stock_reserved` field in inventory
- No reservation transaction type
- No link between `estimate_items` and `todos`
- No automatic stock management on status changes

---

## Data Model Changes

### 1. Database Schema Changes

#### A. Add `stock_reserved` column to `inventory_items`
```sql
-- Migration: Add reserved stock tracking
ALTER TABLE tenant.inventory_items 
ADD COLUMN IF NOT EXISTS stock_reserved integer DEFAULT 0;

-- Add constraint: reserved cannot exceed on-hand
ALTER TABLE tenant.inventory_items 
ADD CONSTRAINT check_reserved_stock 
CHECK (stock_reserved >= 0 AND stock_reserved <= stock_on_hand);
```

#### B. Add new transaction types
```sql
-- Update transaction_type to include reservation types
-- Types: 'reserve', 'unreserve', 'consume'
```

#### C. Create `inventory_allocations` table (reservation ledger)
```sql
CREATE TABLE IF NOT EXISTS tenant.inventory_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES tenant.inventory_items(id),
  jobcard_id uuid NOT NULL REFERENCES tenant.jobcards(id),
  estimate_item_id uuid REFERENCES tenant.estimate_items(id),
  quantity_reserved integer NOT NULL,
  quantity_consumed integer DEFAULT 0,
  status text NOT NULL DEFAULT 'reserved', -- 'reserved', 'consumed', 'released'
  reserved_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  released_at timestamptz,
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_allocations_jobcard ON tenant.inventory_allocations(jobcard_id);
CREATE INDEX idx_allocations_item ON tenant.inventory_allocations(item_id);
CREATE INDEX idx_allocations_status ON tenant.inventory_allocations(status);
```

#### D. Link todos to estimate items (for consumption tracking)
```sql
-- Add part_id to track which inventory item a todo relates to
-- This is stored in the todos JSONB in jobcards.details
-- Todo structure will be updated to include optional part_id
```

### 2. Entity Updates

#### A. Update `InventoryItem` Entity
```typescript
// src/modules/inventory/domain/inventory.entity.ts
export interface InventoryItem {
  // ... existing fields
  stockReserved: number       // NEW: quantity reserved for jobs
  stockAvailable: number      // COMPUTED: stockOnHand - stockReserved
}
```

#### B. New Allocation Entity
```typescript
// src/modules/inventory/domain/allocation.entity.ts
export type AllocationStatus = 'reserved' | 'consumed' | 'released'

export interface InventoryAllocation {
  id: string
  tenantId: string
  itemId: string
  jobcardId: string
  estimateItemId?: string
  quantityReserved: number
  quantityConsumed: number
  status: AllocationStatus
  reservedAt: Date
  consumedAt?: Date
  releasedAt?: Date
  createdBy?: string
}
```

#### C. Update `TodoItem` Type
```typescript
// src/modules/job/domain/todo.types.ts
export interface TodoItem {
  id: string
  text: string
  completed: boolean
  status: TodoStatus
  createdAt: string
  completedAt?: string
  // NEW fields for inventory linking
  partId?: string              // Link to inventory item
  estimateItemId?: string      // Link to estimate item
  quantityRequired?: number    // How many parts needed
  allocationId?: string        // Link to allocation record
}
```

---

## Business Logic

### 1. Reservation Flow (When estimate item is added)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADD PART TO ESTIMATE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User adds part to estimate (with quantity)                  │
│                         ▼                                       │
│  2. Check stock availability:                                   │
│     available = stock_on_hand - stock_reserved                  │
│     IF available < quantity THEN warn user (allow override)     │
│                         ▼                                       │
│  3. Create allocation record:                                   │
│     status = 'reserved'                                         │
│     quantity_reserved = qty                                     │
│                         ▼                                       │
│  4. Update inventory_items:                                     │
│     stock_reserved += qty                                       │
│                         ▼                                       │
│  5. Create inventory_transaction:                               │
│     type = 'reserve'                                            │
│     reference_type = 'estimate_item'                            │
│     reference_id = estimate_item.id                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Consumption Flow (When todo marked as "changed")

```
┌─────────────────────────────────────────────────────────────────┐
│                TODO STATUS → "CHANGED"                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User marks todo as "changed"                                │
│     (indicating part was replaced)                              │
│                         ▼                                       │
│  2. Find linked allocation via todo.allocationId                │
│     OR via todo.partId + jobcard_id                             │
│                         ▼                                       │
│  3. Update allocation:                                          │
│     quantity_consumed = quantity_reserved                       │
│     status = 'consumed'                                         │
│     consumed_at = now()                                         │
│                         ▼                                       │
│  4. Update inventory_items:                                     │
│     stock_on_hand -= quantity_consumed                          │
│     stock_reserved -= quantity_reserved                         │
│                         ▼                                       │
│  5. Create inventory_transaction:                               │
│     type = 'usage'                                              │
│     reference_type = 'jobcard'                                  │
│     reference_id = jobcard.id                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Release Flow (Job cancelled or part removed)

```
┌─────────────────────────────────────────────────────────────────┐
│              JOB CANCELLED / PART REMOVED                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Trigger: Job status → 'cancelled'                           │
│     OR: Estimate item deleted                                   │
│                         ▼                                       │
│  2. Find all 'reserved' allocations for job/item                │
│                         ▼                                       │
│  3. For each allocation:                                        │
│     Update allocation:                                          │
│       status = 'released'                                       │
│       released_at = now()                                       │
│                         ▼                                       │
│  4. Update inventory_items:                                     │
│     stock_reserved -= quantity_reserved                         │
│                         ▼                                       │
│  5. Create inventory_transaction:                               │
│     type = 'unreserve'                                          │
│     reference_type = 'jobcard'                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database & Domain Layer (Day 1-2)

1. **Create migration** for schema changes
   - Add `stock_reserved` to `inventory_items`
   - Create `inventory_allocations` table
   - Add new transaction types

2. **Update domain entities**
   - Add `AllocationEntity`
   - Update `InventoryItem` with `stockReserved`
   - Update `TodoItem` with part linking

3. **Create allocation repository**
   - CRUD for allocations
   - Query by jobcard, item, status

### Phase 2: Use Cases & Application Layer (Day 2-3)

1. **Create new use cases:**
   ```
   src/modules/inventory/application/
   ├── reserve-stock.use-case.ts
   ├── consume-stock.use-case.ts
   ├── release-stock.use-case.ts
   └── get-available-stock.use-case.ts
   ```

2. **Update existing use cases:**
   - `add-estimate-item.use-case.ts` → integrate reservation
   - `remove-estimate-item.use-case.ts` → integrate release

3. **Create inventory allocation service**
   ```typescript
   // src/modules/inventory/application/inventory-allocation.service.ts
   export class InventoryAllocationService {
     reserveForEstimateItem(estimateItemId, itemId, qty, jobcardId)
     consumeForTodo(todoId, jobcardId)
     releaseForJob(jobcardId)
     releaseForEstimateItem(estimateItemId)
     getAvailableStock(itemId): number
     getReservedByJob(jobcardId): InventoryAllocation[]
   }
   ```

### Phase 3: Integration with Job Lifecycle (Day 3-4)

1. **Hook into todo status changes**
   - Update `useUpdateTodos` hook or relevant API
   - When status changes to "changed", trigger consumption

2. **Hook into job status changes**
   - Update `UpdateJobStatusUseCase`
   - When status → "cancelled", release all reservations

3. **Hook into estimate item operations**
   - Add item → reserve
   - Remove item → release
   - Update quantity → adjust reservation

### Phase 4: API Routes (Day 4)

1. **Add inventory allocation endpoints:**
   ```
   POST   /api/inventory/allocations/reserve
   POST   /api/inventory/allocations/consume
   POST   /api/inventory/allocations/release
   GET    /api/inventory/allocations?jobcard_id=xxx
   GET    /api/inventory/items/:id/availability
   ```

2. **Update existing endpoints:**
   - `POST /api/estimates/:id/items` → include reservation
   - `DELETE /api/estimates/:id/items/:itemId` → include release

### Phase 5: UI Updates (Day 5)

1. **Stock availability display**
   - Show "X available (Y reserved)" in part picker
   - Warn when selecting part with low availability

2. **Todo status change integration**
   - Add confirmation when marking as "changed"
   - Show what inventory will be consumed

3. **Job card inventory summary**
   - Show reserved parts in job details
   - Show consumed parts history

---

## File Structure

```
src/modules/inventory/
├── domain/
│   ├── inventory.entity.ts        # UPDATE: add stockReserved
│   ├── inventory.repository.ts    # UPDATE: add allocation methods
│   ├── allocation.entity.ts       # NEW
│   └── allocation.repository.ts   # NEW
├── infrastructure/
│   ├── inventory.repository.supabase.ts  # UPDATE
│   └── allocation.repository.supabase.ts # NEW
└── application/
    ├── reserve-stock.use-case.ts         # NEW
    ├── consume-stock.use-case.ts         # NEW
    ├── release-stock.use-case.ts         # NEW
    ├── get-available-stock.use-case.ts   # NEW
    └── inventory-allocation.service.ts   # NEW

src/app/api/inventory/
├── allocations/
│   ├── route.ts                  # NEW: List allocations
│   ├── reserve/route.ts          # NEW: Reserve stock
│   ├── consume/route.ts          # NEW: Consume stock
│   └── release/route.ts          # NEW: Release stock
└── items/[id]/
    └── availability/route.ts     # NEW: Get availability

supabase/migrations/
└── XXXX_inventory_allocations.sql  # NEW
```

---

## API Contracts

### Reserve Stock
```typescript
// POST /api/inventory/allocations/reserve
interface ReserveStockRequest {
  itemId: string
  jobcardId: string
  estimateItemId?: string
  quantity: number
}

interface ReserveStockResponse {
  allocationId: string
  itemId: string
  quantityReserved: number
  stockRemaining: number
  stockAvailable: number
}
```

### Consume Stock
```typescript
// POST /api/inventory/allocations/consume
interface ConsumeStockRequest {
  allocationId?: string     // If known
  jobcardId: string
  itemId?: string           // Alternative lookup
  quantity?: number         // Optional partial consumption
}

interface ConsumeStockResponse {
  success: boolean
  quantityConsumed: number
  transactionId: string
}
```

### Get Availability
```typescript
// GET /api/inventory/items/:id/availability
interface AvailabilityResponse {
  itemId: string
  stockOnHand: number
  stockReserved: number
  stockAvailable: number    // on_hand - reserved
  reservations: {
    jobcardId: string
    jobNumber: string
    quantity: number
    status: AllocationStatus
  }[]
}
```

---

## Edge Cases & Error Handling

### Insufficient Stock (STRICT MODE)
- **Behavior**: Block reservation completely - no overrides allowed
- **Implementation**: 
  ```typescript
  if (available < requested) {
    throw new InsufficientStockError(
      `Cannot reserve ${requested} units. Only ${available} available.`
    )
  }
  ```
- **UI Impact**: 
  - Disable "Add Part" button when stock unavailable
  - Show clear error message with current availability
  - Suggest alternatives: order more stock or reduce quantity

### Double Consumption
- **Guard**: Check if allocation is already consumed
- **Error**: "Part already consumed for this job"

### Orphaned Reservations
- **Scheduled job**: Release reservations older than X days for non-active jobs
- **Manual release**: Admin can release stuck reservations

### Concurrent Modifications
- **Solution**: Use database transactions with row-level locking
  ```sql
  SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE;
  ```

---

## Testing Checklist

### Unit Tests
- [ ] Reserve stock decrements available, increments reserved
- [ ] Consume stock decrements on-hand and reserved
- [ ] Release stock increments available
- [ ] Cannot reserve more than available (without override)
- [ ] Cannot consume already-consumed allocation
- [ ] Cannot consume unreserved item

### Integration Tests
- [ ] Adding estimate item creates reservation
- [ ] Removing estimate item releases reservation
- [ ] Marking todo as "changed" consumes stock
- [ ] Cancelling job releases all reservations
- [ ] Transaction history is accurate

### E2E Tests
- [ ] Full job lifecycle with parts
- [ ] UI shows correct availability
- [ ] Warnings appear for low stock

---

## Rollout Plan

1. **Database migration** (zero-downtime)
   - Add columns as nullable
   - Backfill with defaults
   - Add constraints

2. **Feature flag**
   - `FEATURE_INVENTORY_ALLOCATION=true`
   - Allows gradual rollout

3. **Monitoring**
   - Track reservation/consumption events
   - Alert on negative stock (data integrity issue)
   - Dashboard for reserved vs available

---

## Future Enhancements

1. **Partial consumption** - Allow marking partially used parts
2. **Return flow** - Return unused reserved parts to stock
3. **Batch operations** - Reserve/consume multiple items at once
4. **Threshold alerts** - Notify when item reservation approaches reorder level
5. **Reservation expiry** - Auto-release after configurable time if job not progressing
