# Task System Documentation

## Overview

The Task System is a core feature of WrenchCloud that manages work items within job cards. Tasks represent individual pieces of work to be done on a vehicle, with full integration to:

- **Inventory Management** - Automatic stock reservation and consumption
- **Estimate Generation** - Tasks sync to estimates for customer approval
- **Price Locking** - Price snapshots prevent mid-job pricing changes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  JobTasks Component (job-tasks.tsx)                                  │   │
│  │  - Task list with action type dropdown                               │   │
│  │  - Status transition buttons                                         │   │
│  │  - Add/Edit task dialogs                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REACT QUERY LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  use-job-tasks.ts                                                    │   │
│  │  - useJobTasks()         → Fetch tasks for a job                     │   │
│  │  - useCreateTask()       → Create new task                           │   │
│  │  - useUpdateTask()       → Update task details                       │   │
│  │  - useUpdateTaskStatus() → Status transitions with inventory effects │   │
│  │  - useDeleteTask()       → Delete task                               │   │
│  │  - useTaskActions()      → Convenience hooks (approve, complete...)  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  /api/jobs/[id]/tasks                                                │   │
│  │  ├── GET  → List tasks (with optional inventory join)                │   │
│  │  └── POST → Create task (triggers estimate sync)                     │   │
│  │                                                                       │   │
│  │  /api/jobs/[id]/tasks/[taskId]                                       │   │
│  │  ├── GET    → Get single task                                        │   │
│  │  ├── PATCH  → Update task (triggers estimate sync)                   │   │
│  │  └── DELETE → Delete task (removes estimate item)                    │   │
│  │                                                                       │   │
│  │  /api/jobs/[id]/tasks/[taskId]/status                                │   │
│  │  └── PATCH  → Status transition (inventory side effects)             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  TaskEstimateSyncService                                             │   │
│  │  - syncTaskToEstimate()         → Create/update estimate item        │   │
│  │  - removeEstimateItemForTask()  → Delete estimate item               │   │
│  │  - syncAllTasksForJob()         → Bulk sync                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SupabaseTaskRepository                                              │   │
│  │  - findById() / findByJobcardId() / findByJobcardIdWithItems()       │   │
│  │  - create() / update() / delete() / softDelete()                     │   │
│  │  - updateStatus() / linkAllocation() / linkEstimateItem()            │   │
│  │                                                                       │   │
│  │  SupabaseInventoryRepository                                         │   │
│  │  - reserveStock() / unreserveStock() / consumeReservedStock()        │   │
│  │                                                                       │   │
│  │  SupabaseAllocationRepository                                        │   │
│  │  - create() / markConsumed() / markReleased()                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  tenant.job_card_tasks                                               │   │
│  │  ├── Links to: inventory_items, inventory_allocations, estimate_items│   │
│  │  └── RLS: tenant_id = current_tenant_id()                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Domain Model

### Task Entity

```typescript
interface JobCardTask {
  id: string;
  tenantId: string;
  jobcardId: string;
  
  // Task description
  taskName: string;
  description?: string;
  
  // Action type → determines inventory behavior
  actionType: 'NO_CHANGE' | 'REPAIRED' | 'REPLACED';
  
  // Inventory linkage (only for REPLACED)
  inventoryItemId?: string;
  qty?: number;
  
  // Price snapshots (immutable after approval)
  unitPriceSnapshot?: number;
  laborCostSnapshot: number;
  taxRateSnapshot: number;
  
  // Lifecycle status
  taskStatus: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  
  // Linked entities
  allocationId?: string;      // Inventory reservation reference
  estimateItemId?: string;    // Estimate item reference
  
  // Audit fields
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  completedBy?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

### Action Types

| Action Type | Description | Inventory Impact | Estimate Item |
|-------------|-------------|------------------|---------------|
| `NO_CHANGE` | Inspection only - no work needed | None | None |
| `REPAIRED` | Part was repaired (not replaced) | None | Labor only |
| `REPLACED` | Part was replaced with new one | Reserve → Consume | Part + Labor |

### Task Status Lifecycle

```
                        ┌──────────────┐
                        │    DRAFT     │ ◄─────────────────┐
                        └──────┬───────┘                    │
                               │                            │
                    [Approve]  │                   [Reactivate]
                               │                            │
                       Reserve ▼ Stock                      │
                        ┌──────────────┐                    │
                        │   APPROVED   │◄───┐               │
                        └──────┬───────┘    │               │
                               │            │               │
                  [Start]      │    [Back]  │               │
                               │            │               │
                               ▼            │               │
                        ┌──────────────┐    │               │
                        │ IN_PROGRESS  │────┘               │
                        └──────┬───────┘                    │
                               │                            │
                  [Complete]   │                            │
                               │                            │
                      Consume  ▼ Stock                      │
                        ┌──────────────┐                    │
                        │  COMPLETED   │ (Terminal)         │
                        └──────────────┘                    │
                                                            │
                                         [Cancel]           │
                        ┌──────────────┐       Release      │
                        │  CANCELLED   │◄───── Stock ───────┤
                        └──────────────┘                    │
                               │                            │
                               └────────────────────────────┘
```

---

## Status Transitions & Inventory Effects

### Valid Transitions

| From Status | Valid Next States |
|-------------|-------------------|
| DRAFT | APPROVED, CANCELLED |
| APPROVED | IN_PROGRESS, CANCELLED |
| IN_PROGRESS | COMPLETED, APPROVED |
| COMPLETED | (none - terminal) |
| CANCELLED | DRAFT |

### Inventory Operations by Transition

| Transition | Operation | Effect |
|------------|-----------|--------|
| DRAFT → APPROVED | `reserveStock()` | Increments `stock_reserved` |
| IN_PROGRESS → COMPLETED | `consumeReservedStock()` | Decrements both `stock_on_hand` and `stock_reserved` |
| Any → CANCELLED | `unreserveStock()` | Decrements `stock_reserved`, releases allocation |
| CANCELLED → DRAFT | (none) | Ready for re-approval |

---

## Task-Estimate Synchronization

Tasks automatically sync to estimate items so customers can see work details before approving:

### Sync Rules

| Task Action | Estimate Item Created | Contents |
|-------------|----------------------|----------|
| NO_CHANGE | ❌ No | No estimate entry (inspection only) |
| REPAIRED | ✅ Yes | Labor cost only |
| REPLACED | ✅ Yes | Part (linked to inventory) + Labor |

### Sync Flow

```
┌─────────────┐     API Route calls      ┌─────────────────────────┐
│ Task CRUD   │ ────────────────────────▶ │ TaskEstimateSyncService │
└─────────────┘                           └───────────┬─────────────┘
                                                      │
                                                      ▼
                                          ┌─────────────────────────┐
                                          │ syncTaskToEstimate()    │
                                          └───────────┬─────────────┘
                                                      │
                          ┌───────────────────────────┼───────────────────────────┐
                          │                           │                           │
                          ▼                           ▼                           ▼
                   ┌────────────┐           ┌────────────────┐          ┌─────────────────┐
                   │ NO_CHANGE  │           │    REPAIRED    │          │    REPLACED     │
                   │            │           │                │          │                 │
                   │ Remove any │           │ Create/update  │          │ Create/update   │
                   │ existing   │           │ estimate_item  │          │ estimate_item   │
                   │ estimate   │           │ with:          │          │ with:           │
                   │ item       │           │ - Labor cost   │          │ - Part ID       │
                   └────────────┘           │ - Task name    │          │ - Unit price    │
                                            └────────────────┘          │ - Qty           │
                                                                        │ - Labor cost    │
                                                                        └─────────────────┘
```

### Bidirectional Linking

- `job_card_tasks.estimate_item_id` → Points to the synced estimate item
- `estimate_items.task_id` → Reverse lookup from estimate to task

---

## Database Schema

### job_card_tasks Table

```sql
CREATE TABLE tenant.job_card_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  jobcard_id uuid NOT NULL,
  
  -- Task details
  task_name text NOT NULL,
  description text,
  action_type text NOT NULL DEFAULT 'NO_CHANGE',
  
  -- Inventory (REPLACED only)
  inventory_item_id uuid REFERENCES tenant.inventory_items(id),
  qty integer,
  
  -- Price snapshots
  unit_price_snapshot numeric(12,2),
  labor_cost_snapshot numeric(12,2) DEFAULT 0,
  tax_rate_snapshot numeric(5,2) DEFAULT 0,
  
  -- Status
  task_status text NOT NULL DEFAULT 'DRAFT',
  
  -- Linked entities
  allocation_id uuid,
  estimate_item_id uuid REFERENCES tenant.estimate_items(id),
  
  -- Audit
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid,
  
  -- Constraints
  CONSTRAINT check_action_type CHECK (action_type IN ('NO_CHANGE', 'REPAIRED', 'REPLACED')),
  CONSTRAINT check_task_status CHECK (task_status IN ('DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT check_replaced_has_inventory CHECK (
    action_type != 'REPLACED' OR (inventory_item_id IS NOT NULL AND qty > 0)
  )
);
```

### Indexes

```sql
CREATE INDEX idx_job_card_tasks_tenant ON tenant.job_card_tasks(tenant_id);
CREATE INDEX idx_job_card_tasks_jobcard ON tenant.job_card_tasks(jobcard_id);
CREATE INDEX idx_job_card_tasks_inventory_item ON tenant.job_card_tasks(inventory_item_id) WHERE inventory_item_id IS NOT NULL;
CREATE INDEX idx_job_card_tasks_status ON tenant.job_card_tasks(task_status);
CREATE INDEX idx_job_card_tasks_allocation ON tenant.job_card_tasks(allocation_id) WHERE allocation_id IS NOT NULL;
CREATE INDEX idx_job_card_tasks_estimate_item ON tenant.job_card_tasks(estimate_item_id) WHERE estimate_item_id IS NOT NULL;
```

---

## API Reference

### GET /api/jobs/[id]/tasks

Fetch all tasks for a job card.

**Query Parameters:**
- `with_items=true` - Include inventory item details

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "taskName": "Replace brake pads",
      "actionType": "REPLACED",
      "taskStatus": "APPROVED",
      "inventoryItemId": "uuid",
      "qty": 4,
      "unitPriceSnapshot": 1500.00,
      "laborCostSnapshot": 500.00,
      "inventoryItem": {
        "id": "uuid",
        "name": "Brake Pads - Premium",
        "stockKeepingUnit": "BP-001",
        "stockOnHand": 100,
        "stockReserved": 4,
        "stockAvailable": 96
      }
    }
  ]
}
```

### POST /api/jobs/[id]/tasks

Create a new task.

**Request Body:**
```json
{
  "taskName": "Replace brake pads",
  "description": "Front brake pads worn",
  "actionType": "REPLACED",
  "inventoryItemId": "uuid",
  "qty": 4,
  "laborCostSnapshot": 500.00
}
```

**Validation:**
- `taskName` - Required, 1-500 chars
- `actionType` - Required: NO_CHANGE | REPAIRED | REPLACED
- For REPLACED: `inventoryItemId` and `qty > 0` required

### PATCH /api/jobs/[id]/tasks/[taskId]

Update task details. Cannot modify APPROVED or COMPLETED tasks.

### PATCH /api/jobs/[id]/tasks/[taskId]/status

Update task status with inventory side effects.

**Request Body:**
```json
{
  "taskStatus": "APPROVED"
}
```

**Response (with inventory update):**
```json
{
  "task": { ... },
  "inventoryUpdate": {
    "id": "uuid",
    "stockOnHand": 100,
    "stockReserved": 4,
    "stockAvailable": 96
  }
}
```

**Error: Insufficient Stock (409)**
```json
{
  "error": "INSUFFICIENT_STOCK",
  "message": "Cannot reserve 4 units. Only 2 available.",
  "stockAvailable": 2,
  "stockRequested": 4
}
```

### DELETE /api/jobs/[id]/tasks/[taskId]

Soft-delete a task. Also removes linked estimate item.

---

## React Hooks

### useJobTasks(jobId)

Fetch tasks for a job with inventory details.

```tsx
const { data: tasks, isLoading, error } = useJobTasks(jobId);
```

### useCreateTask(jobId)

Create a new task.

```tsx
const createTask = useCreateTask(jobId);

await createTask.mutateAsync({
  taskName: "Replace brake pads",
  actionType: "REPLACED",
  inventoryItemId: "uuid",
  qty: 4,
  laborCostSnapshot: 500
});
```

### useTaskActions(jobId)

Convenience hooks for common status transitions.

```tsx
const taskActions = useTaskActions(jobId);

// Approve task (reserves inventory)
await taskActions.approve(taskId);

// Start work
await taskActions.startProgress(taskId);

// Complete task (consumes inventory)
await taskActions.complete(taskId);

// Cancel task (releases inventory)
await taskActions.cancel(taskId);

// Reactivate cancelled task
await taskActions.reactivate(taskId);
```

### calculateTaskTotals(tasks)

Calculate cost totals from tasks.

```tsx
const totals = calculateTaskTotals(tasks);
// Returns: { partsTotal, laborTotal, taxTotal, subtotal, total, taskCount, completedCount }
```

---

## UI Components

### JobTasks Component

Located at: `src/components/tenant/jobs/job-tasks.tsx`

**Features:**
- Task list with status indicators
- Action type dropdown (editable for DRAFT tasks)
- Status transition dropdown
- Add/Edit task dialogs
- Inventory search and selection
- Real-time cost calculations

**Props:**
```tsx
interface JobTasksProps {
  jobId: string;
  disabled?: boolean;
  className?: string;
  searchInventory?: (query: string, limit?: number) => InventoryItem[];
}
```

### Task Dialog

Modal for creating/editing tasks with:
- Task name and description inputs
- Action type selection (NO_CHANGE, REPAIRED, REPLACED)
- Inventory search (for REPLACED)
- Quantity input with stock availability check
- Labor cost input

---

## Cache Invalidation

All task mutations invalidate:
1. `taskQueryKeys.byJob(jobId)` - Refresh task list
2. `queryKeys.estimates.byJob(jobId)` - Refresh estimate (due to sync)

Status updates with inventory effects also invalidate:
3. `["inventory-snapshot"]` - Refresh inventory display

---

## Error Handling

### Insufficient Stock

When approving a REPLACED task with insufficient stock:

```typescript
try {
  await taskActions.approve(taskId);
} catch (error) {
  if (error.code === 'INSUFFICIENT_STOCK') {
    // error.stockAvailable - Current available quantity
    // error.stockRequested - Quantity needed
    alert(`Only ${error.stockAvailable} available, need ${error.stockRequested}`);
  }
}
```

### Invalid Transitions

API returns 400 with allowed transitions:

```json
{
  "error": "Invalid status transition: COMPLETED → DRAFT",
  "allowedTransitions": []
}
```

---

## Migrations

| Migration | Purpose |
|-----------|---------|
| 0010_job_card_tasks_and_inventory_delta.sql | Create job_card_tasks table, indexes, RLS |
| 0011_add_task_id_to_allocations.sql | Add task_id to allocations for reverse lookup |
| 0012_add_estimate_item_id_to_tasks.sql | Bidirectional task ↔ estimate_item linking |

---

## Best Practices

1. **Always use DRAFT first** - Create tasks in DRAFT, then approve after customer confirmation
2. **Check stock before approval** - UI should show available stock to prevent approval failures
3. **Lock prices at approval** - Price snapshots are taken at task creation, locked at approval
4. **Use TaskActions hook** - Provides consistent status transitions with proper error handling
5. **Handle INSUFFICIENT_STOCK** - Display clear feedback when stock isn't available
