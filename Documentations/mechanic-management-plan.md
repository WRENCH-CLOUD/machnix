# Tenant-Controlled Mechanic Management System

Implement mechanic management where tenants create mechanics as tenant-scoped records (no auth.users initially).

---

## Phased Approach

### Phase 1 (Now): Mechanic Records Only
- Create `tenant.mechanics` records with name, phone, email
- No login capability - just data records for job assignment
- Tenants can CRUD their mechanics freely

### Phase 2 (Future): Mechanic Logins

When ready to add mechanic dashboards:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  auth.users     │──────│  tenant.users   │──────│ tenant.mechanics│
│  (login)        │ 1:1  │  (role=mechanic)│ 1:1  │  (profile data) │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

**Migration strategy:**
1. Add `auth_user_id` column to `tenant.mechanics` (nullable)
2. Create "Invite Mechanic" flow → creates auth.users entry + links to mechanic
3. Mechanic logs in → sees their dashboard with assigned jobs
4. **Cap control**: You can limit mechanics per subscription tier

---

## Proposed Changes

### Database

#### [NEW] [0005_mechanics_improvements.sql](file:///c:/Projects/machnix/supabase/migrations/0005_mechanics_improvements.sql)
```sql
ALTER TABLE tenant.mechanics ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE tenant.mechanics ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE tenant.mechanics ADD COLUMN IF NOT EXISTS auth_user_id uuid; -- For future linking
```

---

### New Mechanic Module

| File | Purpose |
|------|---------|
| `mechanic/domain/mechanic.entity.ts` | Mechanic interface (id, name, phone, email, isActive) |
| `mechanic/domain/mechanic.repository.ts` | Repository interface |
| `mechanic/infrastructure/mechanic.repository.supabase.ts` | Supabase CRUD |
| `mechanic/application/*.use-case.ts` | Create, Update, Delete, GetAll use cases |

---

### API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mechanics` | GET | List all mechanics |
| `/api/mechanics` | POST | Create mechanic |
| `/api/mechanics/[id]` | GET | Get single mechanic |
| `/api/mechanics/[id]` | PATCH | Update mechanic |
| `/api/mechanics/[id]` | DELETE | Soft delete mechanic |

---

### Frontend

#### [NEW] Mechanics Page (`/mechanics`)
- Table listing mechanics with name, phone, email, status
- "Add Mechanic" button → modal with name, phone, email fields
- Edit/Deactivate actions per row
- Sidebar link under "Settings" or as main item (I'll add it as a main nav item with a wrench icon)

**Simplified UI** - No skills or hourly rate fields in this phase.

---

## Summary

| Phase | What happens | Mechanic login? |
|-------|-------------|-----------------|
| 1 (Now) | Tenant creates mechanic records, assigns to jobs | ❌ No |
| 2 (Future) | Add "Invite" flow, link to auth.users | ✅ Yes |

---

## Verification

1. Create mechanic via UI
2. Assign to job
3. Verify mechanic appears on job card/PDF
4. Deactivate mechanic → verify excluded from assignment dropdown
