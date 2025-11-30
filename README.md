# mechanix

A concise garage-management platform (multi-tenant SaaS) for job cards, vehicles, invoices, and real-time collaboration — built for low-latency UX, background processing, and tenant isolation.

## Quick Summary
- Mechanix provides job-card workflows, vehicle/customer management, parts/estimates, invoicing, and real-time updates between front‑desk and mechanics.
- Tech highlights: `Next.js` frontend, Node.js backend (NestJS recommended), `Redis` for cache/pub-sub, `BullMQ` workers, Postgres/Prisma, and S3 (or MinIO) for media/PDFs.
- Key patterns: tenant-scoped data (subdomain or tenantId), JWT + role-based auth, background workers for IO-heavy tasks, and audit logs for activity tracking.

## Key Features (short)
- Real-time: Socket.IO updates, Redis adapter for multi-instance broadcasting.
- Workers: notifications, invoice PDF generation, payment reconciliation, analytics, reminders.
- Offline support: local cache + sync queue for mechanics; conflict resolution by timestamp + actor.

## Local dev (essential commands)
1. Copy `.env.example` -> `.env` and set credentials.
2. Start infra: `docker-compose up -d` (Postgres, Redis, MinIO).
3. Install deps: `pnpm install` (or `yarn` / `npm install`).
4. Migrate: `npx prisma migrate deploy` (or `migrate dev`).
5. Start services (example):
   - API: `pnpm --filter @mechanix/api dev`
   - Frontend: `pnpm --filter @mechanix/frontend dev`
   - Workers: `pnpm --filter @mechanix/workers start`

## Want the full details?
The original, full README with architecture notes, lifecycle steps, and implementation guidance is preserved in `README.full.md`.

Contributions: add tests, follow CODEOWNERS/PR guidelines, and keep DVI templates immutable.