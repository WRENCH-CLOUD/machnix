# Decentralised Event System — Architecture Decision Record

## Overview

This document describes the event-driven architecture for WrenchCloud's multi-tenant garage management system. The design enforces strict schema isolation, decouples analytics from transactional workloads, and provides a scalable notification pipeline.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONTROL PLANE (public)                         │
│  platform_admins · notifications · vehicle reference data · leads      │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ reads only
┌─────────────────────────────▼───────────────────────────────────────────┐
│                     INTELLIGENCE LAYER (analytics)                     │
│  event_logs · event_dead_letter · whatsapp_messages · pending_events   │
│  event_processing_stats                                                │
│                                                                        │
│  ← Event Processor (sole writer to analytics aggregates)               │
│  ← Triggers publish events (fire-and-forget)                           │
└─────────────────────────────▲───────────────────────────────────────────┘
                              │ triggers write events
┌─────────────────────────────┴───────────────────────────────────────────┐
│                     EXECUTION LAYER (tenant)                           │
│  tenants · users · customers · vehicles · jobcards · invoices ·        │
│  payments · mechanics · parts · estimates · notifications · activities  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
Tenant Action (e.g., create job card)
  │
  ▼
tenant.jobcards INSERT
  │
  ▼ (PostgreSQL AFTER INSERT trigger)
analytics.publish_event('job.created', ...)
  │
  ▼
analytics.event_logs row created (processed_at = NULL)
  │
  ▼ (Event Processor polls pending events)
EventProcessorService.processBatch()
  │
  ├──▶ generateNotifications(event)
  │     ├── platform notifications → public.notifications
  │     └── tenant notifications  → tenant.notifications
  │
  ├──▶ [future] update analytics aggregates (monthly_analytics)
  │
  └──▶ markProcessed(eventId)
```

---

## Schema Boundaries — Enforcement Rules

| Rule | Enforced By |
|------|-------------|
| Tenant code NEVER writes to `analytics` schema directly | No Supabase client calls to analytics in tenant repositories |
| Only triggers write to `analytics.event_logs` | `SECURITY DEFINER` functions in analytics schema |
| Only EventProcessor writes to `public.notifications` | Service-role client in processor only |
| Only EventProcessor writes to analytics aggregates | Processor is sole consumer of event_logs |
| Cross-schema reads use explicit JOINs via event data | Payload snapshots in events avoid cross-schema FKs |

---

## Event Types

| Event | Trigger | Entity |
|-------|---------|--------|
| `job.created` | `AFTER INSERT ON tenant.jobcards` | jobcard |
| `job.status_changed` | `AFTER UPDATE ON tenant.jobcards` (status change) | jobcard |
| `invoice.generated` | `AFTER INSERT ON tenant.invoices` | invoice |
| `payment.received` | `AFTER INSERT ON tenant.payments` | payment |
| `subscription.changed` | `AFTER UPDATE ON tenant.tenants` (tier change) | tenant |
| `subscription.expiring` | `AFTER UPDATE ON tenant.tenants` (end date within 7d) | tenant |
| `tenant.status_changed` | `AFTER UPDATE ON tenant.tenants` (status change) | tenant |

---

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `analytics.event_logs` | `idx_event_logs_unprocessed` (partial: `processed_at IS NULL`) | **Hot path**: processor polling |
| `analytics.event_logs` | `idx_event_logs_tenant_id` (tenant_id, created_at DESC) | Tenant-scoped event history |
| `analytics.event_logs` | `idx_event_logs_event_type` (event_type, created_at DESC) | Event type filtering |
| `analytics.event_logs` | `idx_event_logs_entity` (entity_type, entity_id) | Entity audit trail |
| `analytics.event_dead_letter` | `idx_event_dead_letter_unresolved` (partial: `resolved_at IS NULL`) | DLQ monitoring |
| `public.notifications` | `idx_public_notifications_recipient` (recipient_id, is_read, created_at DESC) | Admin notification feed |
| `public.notifications` | `idx_public_notifications_unread` (partial: `is_read = false`) | Unread badge count |
| `tenant.notifications` | `idx_tenant_notifications_user_unread` (user_id, is_read, created_at DESC) | User notification feed |
| `tenant.notifications` | `idx_tenant_notifications_tenant_unread` (tenant_id, is_read, created_at DESC) | Tenant-wide notification feed |

---

## Transaction Safety

1. **Triggers are transactional**: If the tenant INSERT/UPDATE fails, the trigger event is automatically rolled back. No orphaned events.
2. **Event publishing uses `ON CONFLICT DO NOTHING`**: Duplicate idempotency keys are silently skipped.
3. **Processor uses `FOR UPDATE SKIP LOCKED`**: Multiple processor instances can run concurrently without processing the same event twice.
4. **Notification creation is independent**: Each notification INSERT is a separate operation. A single notification failure doesn't roll back the entire batch.

---

## Failure Recovery Strategy

```
Event Published
  │
  ▼
Processor picks up event
  │
  ├── Success → markProcessed() → done
  │
  └── Failure
       │
       ▼
       recordFailure(eventId, error)
       retry_count++
       │
       ├── retry_count < max_retries (5)
       │    → Event stays in pending queue
       │    → Picked up again on next poll
       │
       └── retry_count >= max_retries
            → moveToDeadLetter(eventId)
            → Event removed from pending queue
            → Manual investigation required
            → Admin notified via platform notification
```

### Backoff Strategy
- Processor uses exponential backoff when no events are found
- Starts at 5s polling interval
- Backs off to max 60s when idle
- Immediately resets to 5s when events appear

---

## Idempotency Handling

1. **Event level**: `idempotency_key` UNIQUE constraint on `analytics.event_logs`. Default key: `{event_type}:{entity_id}:{epoch_timestamp}`. Custom keys can be provided for deterministic deduplication.

2. **Trigger level**: Triggers use `analytics.publish_event()` which includes `ON CONFLICT (idempotency_key) DO NOTHING`.

3. **Processor level**: Processing is idempotent because:
   - `processed_at IS NULL` filter ensures events are only picked up once
   - `FOR UPDATE SKIP LOCKED` prevents concurrent processing of the same row
   - Notification creation with `source_event_id` allows detecting duplicate notifications

---

## Deployment Options

### Option A: Standalone Processor (Recommended for production)
```bash
# Run as a persistent background service
npx tsx scripts/run-event-processor.ts
```
- Best for: dedicated infrastructure, always-on processing
- Latency: 5 seconds (configurable)

### Option B: Serverless Cron (Vercel/Supabase Edge)
```bash
# Call via cron every 30 seconds
POST /api/events/process
Authorization: Bearer <CRON_SECRET>
```
- Best for: serverless deployments, cost optimization
- Latency: depends on cron frequency

### Option C: Supabase Edge Function
```sql
-- Trigger via pg_cron (Supabase)
SELECT cron.schedule('process-events', '*/30 * * * * *',
  $$ SELECT net.http_post('https://your-app.vercel.app/api/events/process', ...); $$
);
```

---

## File Structure

```
src/modules/event/
├── domain/
│   ├── event-types.ts              # Event type registry & enums
│   ├── event.entity.ts             # EventLog domain model
│   ├── event.repository.ts         # Event repository interface
│   ├── notification.entity.ts      # Platform & Tenant notification models
│   └── notification.repository.ts  # Notification repository interfaces
├── application/
│   ├── publish-event.use-case.ts   # Fire-and-forget event publisher
│   ├── event-processor.service.ts  # Polling loop + batch processor
│   ├── notification-generator.ts   # Event → notification mapping (pure)
│   └── get-event-history.use-case.ts  # Audit trail queries
├── infrastructure/
│   ├── event.repository.supabase.ts       # Supabase event_logs implementation
│   └── notification.repository.supabase.ts # Supabase notification implementations
└── index.ts                        # Barrel exports

supabase/migrations/
├── 0007_event_system_and_notifications.sql  # Tables, triggers, RLS, views
└── 0008_event_system_rpc_functions.sql      # RPC functions for safe operations

scripts/
└── run-event-processor.ts          # Standalone processor runner

src/app/api/events/
├── process/route.ts                # Serverless batch processor endpoint
└── history/route.ts                # Event audit trail API
```

---

## Future Extensions

1. **Webhook dispatch**: Add a webhook handler that reads events and POSTs to tenant-configured URLs
2. **Real-time subscriptions**: Use Supabase Realtime on `analytics.event_logs` for live dashboards
3. **Analytics aggregation**: Add aggregate update logic to the processor (monthly_analytics table)
4. **Event replay**: Dead letter queue events can be replayed after root cause is fixed
5. **Multi-channel notifications**: Extend notification generator to produce WhatsApp/email/SMS notifications
6. **Event sourcing**: The event log can be used to rebuild state for audit/compliance purposes
