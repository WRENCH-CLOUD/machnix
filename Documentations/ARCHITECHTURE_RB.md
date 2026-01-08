# Architecture Rules & Blueprint

**Project:** Wrench Cloud
**Architecture:** Modular SaaS Monolith (Next.js App Router)
**Version:** 2.0
**Target Scale:** 1 → 10,000+ Tenants

This document is the **single source of truth** for developers, reviewers, and AI agents (Copilot / Cursor).

Any Pull Request or AI-generated code **must comply** with these rules.

---

## 1. Core Philosophy

* **Routing & Rendering** → `app/` (Next.js only)
* **Business Logic** → `modules/` (framework-agnostic)
* **Data Isolation** → Database (Row Level Security)
* **Integrations** → Infrastructure adapters

This architecture enables:

* Fast iteration today (monolith)
* Clean extraction to microservices later
* Long-term maintainability without rewrites

---

## 2. Canonical Directory Structure

```txt
src/
├─ app/                     # PRESENTATION LAYER (Next.js)
│  ├─ (platform)/           # Super-admin routes
│  ├─ (tenant)/             # Tenant-scoped UI
│  ├─ api/                  # HTTP boundary (thin routes)
│  └─ middleware.ts         # Security firewall
│
├─ components/              # DUMB UI ONLY
│  ├─ views/
│  ├─ dialogs/
│  └─ ui/                   # Shadcn primitives
│
├─ modules/                 # BUSINESS LOGIC (CORE)
│  ├─ tenants/
│  ├─ billing/
│  │  ├─ domain/
│  │  ├─ application/
│  │  └─ infrastructure/
│  ├─ jobs/
│  └─ analytics/
│
├─ shared/                  # CROSS-CUTTING (NO BUSINESS LOGIC)
│  ├─ auth/
│  ├─ logging/
│  └─ errors/
│
├─ lib/                     # TECHNICAL ADAPTERS ONLY
│  ├─ supabase/
│  └─ utils/
```

---

## 3. Import Rules (STRICT)

### 3.1 Layer Hierarchy (One-Way)

```
app/ → components/ → modules/ → shared/ → lib/
```

* Imports flow **downward only**
* Lower layers must **never** import upper layers

### 3.2 Absolute Red Lines 🚨

PR must be rejected if any occur:

* ❌ `components → modules`
* ❌ `components → lib`
* ❌ `modules → app`
* ❌ `modules/domain → infrastructure`

ESLint enforces this automatically.

---

## 4. Layer Responsibilities

### 4.1 App Layer (`app/`)

**Role:** Routing, rendering, orchestration

✅ Allowed:

* Reading params, headers, cookies
* Resolving auth & tenant context
* Calling **ONE** use case
* Rendering components

❌ Forbidden:

* Business logic
* Database access
* SDK usage (Stripe, Supabase, etc.)

---

### 4.2 Components (`components/`)

**Role:** Dumb UI

Rules:

* Props in → JSX out
* No side effects
* No business decisions
* No data fetching

Components **never** know where data comes from.

---

### 4.3 Modules (`modules/`)

This is the **heart of the system**.

#### A. Domain (`modules/*/domain`)

**Pure business logic only**

❌ No:

* Next.js imports
* Supabase / Prisma
* Fetch / HTTP

✅ Only:

* Entities
* Rules
* Value objects
* Deterministic functions

---

#### B. Application (`modules/*/application`)

**Use cases (verbs)**

Rules:

* One action per file
* One public `execute()` method
* No framework or HTTP concerns

Example:

```
create-tenant.usecase.ts
pay-invoice.usecase.ts
```

---

#### C. Infrastructure (`modules/*/infrastructure`)

**External communication only**

Allowed:

* Supabase repositories
* Payment gateways
* Email services

Rules:

* Implements interfaces
* May import `lib/`
* ❌ No business rules

---

## 5. Naming Conventions (MANDATORY)

### UI Components

```
<feature>-<role>.tsx
```

Examples:

* `tenants-view.tsx`
* `create-tenant-dialog.tsx`
* `admin-layout.tsx`

Suffixes:

* `-view` → page composition
* `-dialog` → modal / form
* `-layout` → structure
* `-card` → data display
* `-table` → tables

---

### Domain & Application

* Entities: `<entity>.entity.ts`
* Rules: `<entity>.rules.ts`
* Use Cases: `<verb>-<noun>.usecase.ts`

---

### Repositories & DTOs

* Interface: `<entity>.repository.ts`
* Implementation: `<entity>.repository.<provider>.ts`
* DTOs: `<action>.input.ts`, `<action>.output.ts`

---

## 6. API Route Rules

API routes are **transport only**.

Flow:

1. Extract request
2. Resolve auth / tenant
3. Call ONE use case
4. Return response

❌ Never:

* Write business logic
* Call database directly

---

## 7. Security & Multi-Tenancy (Defense in Depth)

1. **Middleware** – validates auth & tenant
2. **Layouts** – role / permission checks
3. **Use Cases** – business rules
4. **Database (RLS)** – final authority

RLS ensures tenant isolation even if the app layer fails.

---

## 8. Development Workflow (How to Build a Feature)

Example: *Cancel Job*

1. Define Domain rules (`Job`, `JobStatus`)
2. Implement repository in infrastructure
3. Write `cancel-job.usecase.ts`
4. Call use case from `app/`
5. Render UI state

---

## 9. Scalability & Evolution Strategy

| Phase   | State         | Trigger          | Action             |
| ------- | ------------- | ---------------- | ------------------ |
| Phase 1 | Monolith      | Speed            | All modules local  |
| Phase 2 | Modular Split | Hotspot module   | Extract module     |
| Phase 3 | Event Driven  | High concurrency | Queues (Kafka/SQS) |

Because logic is isolated, extraction is **copy-paste**, not rewrite.

---

## 10. Pull Request Checklist

```md
- [ ] No forbidden imports
- [ ] Domain layer is pure
- [ ] No business logic in app/
- [ ] All writes wrapped in use cases
- [ ] Tenant context passed explicitly
```

---

## 11. AI / Copilot Rules

AI must:

* Always create use cases for mutations
* Never place logic in components
* Never import lib into domain
* Refuse architectural violations

This document is **non-negotiable**.
