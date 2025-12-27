Architecture Blueprint: Modular SaaS Monolith
Version: 1.0
Target: Next.js App Router, Multi-Tenant SaaS
Scale Goal: 1 to 10,000+ Tenants
1. Executive Summary
This architecture is designed to provide a production-grade, scalable foundation for a multi-tenant SaaS. It utilizes a Modular Monolith pattern within the Next.js App Router framework.
Core Philosophy:
Routing & Rendering belong to Next.js (app/)
Business Logic belongs to Domain Modules (modules/)
Data Isolation belongs to the Database (RLS)
Integration belongs to Infrastructure adapters
This structure allows us to move fast today (monolith) while retaining the ability to extract specific modules (e.g., Billing, Analytics) into microservices later without rewriting business logic.

2. Directory Structure
This is the canonical structure for the application. All new features must adhere to this hierarchy.
Plaintext
src/
├─ app/                     # PRESENTATION LAYER (Next.js)
│  ├─ (platform)/           # Super Admin routes
│  ├─ (tenant)/             # Tenant-scoped application UI
│  │  ├─ invoices/
│  │  │  └─ [id]/
│  │  │     └─ page.tsx     # Fetches data via Use Case, renders UI
│  └─ api/                  # HTTP Boundary (Webhooks, External APIs)
│
├─ modules/                 # BUSINESS LOGIC LAYER (The Core)
│  ├─ tenants/              # Module: Tenant Management
│  ├─ billing/              # Module: Invoicing & Payments
│  │  ├─ domain/            # 1. Rules, Entities, Types (Pure TS)
│  │  ├─ application/       # 2. Use Cases (Actions/Verbs)
│  │  └─ infrastructure/    # 3. Adapters (Supabase, Stripe/Razorpay)
│  ├─ jobs/
│  └─ analytics/
│
├─ shared/                  # CROSS-CUTTING CONCERNS
│  ├─ auth/
│  ├─ logging/
│  └─ errors/
│
├─ lib/                     # TECHNICAL HELPERS
│  ├─ supabase/
│  └─ utils/
│
└─ middleware.ts            # Security Firewall



3. Layer Responsibilities
To maintain scalability, we enforce strict boundaries between layers.
A. The App Layer (src/app)
Role: Rendering, Routing, and User Interface.
✅ Allowed: Parsing URL params, Session validation, calling Use Cases, Rendering components.
❌ FORBIDDEN: Direct SQL queries, complex business calculations, 3rd-party SDK imports (stripe, etc).
 Suggested refinement (optional but recommended)
You can improve clarity slightly by grouping:
(admin)/
├─ components/
│  ├─ views/
│  │  ├─ tenants-view.tsx
│  │  ├─ overview-view.tsx
│  ├─ dialogs/
│  │  ├─ create-tenant-dialog.tsx
│  │  ├─ tenant-details-dialog.tsx
│  └─ admin-layout.tsx

This helps future contributors instantly understand intent.

B. The Module Layer (src/modules)
This is where the business lives. Each module is self-contained.
1. Domain (modules/*/domain)
Role: Pure business rules and data shapes.
Contains: Entities (interfaces), Error classes, Validation logic.
Dependencies: ZERO. Pure TypeScript only.
2. Application (modules/*/application)
Role: Orchestration of actions (Use Cases).
Naming Convention: verb-noun.usecase.ts (e.g., create-tenant.usecase.ts, pay-invoice.usecase.ts).
Responsibility: Takes input, calls a repository, applies domain rules, returns result.
3. Infrastructure (modules/*/infrastructure)
Role: The "plumbing" to the outside world.
Contains: Database repositories (Supabase), Payment Gateways (Razorpay), Email Services.
Goal: If we switch DBs, only this folder changes.

4. Scalability & Evolution Strategy
We are avoiding premature optimization by building a Modular Monolith.
Phase
Architecture State
Trigger for Change
Action Required
Phase 1 (Now)
Monolith
Speed to market
Everything in src/modules. Direct import of Use Cases.
Phase 2 (Growth)
Modular Split
Heavy load on specific features (e.g., Analytics)
Move modules/analytics to a separate server. Replace Use Case call with API call.
Phase 3 (Scale)
Event Driven
High concurrency/Complex workflows
Introduce message queues (Kafka/SQS) between modules.

Why this works: Because our business logic is isolated in modules/, extracting a folder into a microservice is a "copy-paste" operation, not a rewrite.

5. Security & Data Isolation
Security is applied in "Defense in Depth" layers:
Middleware (middleware.ts): Validates Authentication tokens and ensures Tenant ID exists.
Layouts (layout.tsx): Checks user Role (e.g., specific permissions to view a route).
Application (usecase): Validates business rules (e.g., "Cannot cancel a paid invoice").
Database (RLS): The Final Gate. Row Level Security ensures a tenant never sees another tenant's data, even if the API logic fails.

6. Development Workflow (How to build a feature)
When adding a new feature (e.g., "Cancel Job"), follow this path:
Define the Domain: Create Job entity and JobStatus types in modules/jobs/domain.
Build the Infrastructure: Create updateJobStatus function in modules/jobs/infrastructure.
Write the Use Case: Create cancel-job.usecase.ts in modules/jobs/application. Add logic to check if the job can be canceled.
Connect the UI: Create a Server Action or API route in src/app that calls cancel-job.usecase.ts.
Render: Update the UI to show the new state.

7. Migration Checklist
For existing code refactoring:
[ ] Identify: Pick one domain (e.g., Billing).
[ ] Extract: Move types to domain.
[ ] Abstract: Move DB calls from app/api to infrastructure/repository.
[ ] Orchestrate: Create a Use Case that connects the two.
[ ] Cleanup: Update app/ files to call the Use Case instead of the DB.

