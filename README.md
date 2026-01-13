# Wrench Cloud

Multi-tenant garage management SaaS for job cards, customers, vehicles, and invoicing.

![Version](https://img.shields.io/badge/version-0.6.0-blue)
![License](https://img.shields.io/badge/license-Private-red)

---

## Overview

Wrench Cloud is a comprehensive garage management platform that enables auto repair shops to manage their daily operations efficiently. Each tenant (garage) gets their own isolated workspace with subdomain access.

### Key Features

- 🚗 **Customer & Vehicle Management** - Track customers and their vehicles
- 🔧 **Job Card Workflow** - Create, assign, and track repair jobs
- 📝 **Estimates & Invoicing** - Generate estimates and convert to invoices
- 📊 **Dashboard & Analytics** - Business insights at a glance
- 🔐 **Multi-tenant Security** - Complete data isolation per tenant

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth + JWT + RLS |
| UI | Tailwind CSS + shadcn/ui |
| State | React Query |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- Docker (for Supabase local development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd machnix

# Install dependencies
npm install

# Start Supabase locally
npx supabase start

# Apply migrations
npx supabase db reset

# Copy environment variables
cp .env.example .env.local
# Update with credentials from: npx supabase status

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Platform admin routes
│   ├── (tenant)/          # Tenant user routes
│   ├── (mechanic)/        # Mechanic routes
│   └── api/               # API routes
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── tenant/            # Tenant components
│   ├── common/            # Shared components
│   └── ui/                # shadcn/ui components
├── modules/               # Domain modules (DDD pattern)
│   ├── customer/          # Customer domain
│   ├── vehicle/           # Vehicle domain
│   ├── job/               # Job card domain
│   ├── estimate/          # Estimate domain
│   ├── invoice/           # Invoice domain
│   └── access/            # Auth & access control
├── lib/                   # Utilities & configurations
│   ├── supabase/          # Supabase clients
│   └── auth/              # Auth helpers
└── providers/             # React context providers
```

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [ROADMAP.md](./ROADMAP.md) | Product roadmap & version plan |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [Documentations/](./Documentations/) | Technical documentation |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See `.env.example` for all variables.

---

## Multi-Tenancy

Each tenant is isolated via:

1. **Subdomain routing** - `tenant-slug.wrenchcloud.com`
2. **JWT Claims** - `tenant_id` embedded in tokens
3. **Row Level Security** - Database-level isolation

---

## License

Private - All rights reserved.

---

*Current Version: 0.6.0 (Pre-release)*