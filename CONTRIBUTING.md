# Contributing to Wrench Cloud

Thank you for contributing to Wrench Cloud! This guide will help you get started.

---

## Development Workflow

### 1. Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `DEVELOPMENT` | Integration branch for all features |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation updates |
| `refactor/*` | Code improvements |

### 2. Branch Naming

```
feature/short-description
fix/issue-description
docs/what-documenting
refactor/what-refactoring
```

**Examples:**
- `feature/tenant-onboarding-form`
- `fix/job-status-transition-bug`
- `docs/api-reference`
- `refactor/auth-middleware`

### 3. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]
```

**Types:**
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding tests |
| `chore` | Maintenance |

**Examples:**
```
feat(jobs): add status transition validation
fix(auth): resolve session timeout issue
docs(api): update customer endpoints
refactor(invoice): simplify total calculation
```

---

## Pull Request Process

### Before Creating PR

1. ✅ Run `npm run build` — must pass
2. ✅ Run `npm run lint` — fix all errors
3. ✅ Test your changes locally
4. ✅ Update documentation if needed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test this?

## Screenshots (if UI changes)
Add screenshots here
```

### Review Process

1. Create PR against `DEVELOPMENT`
2. Request review from maintainers
3. Address feedback
4. Merge after approval

---

## Code Standards

### TypeScript

```typescript
// ✅ DO: Use strict types
interface CustomerProps {
  id: string;
  name: string;
  email: string | null;
}

// ❌ DON'T: Use any
const customer: any = fetchCustomer();

// ✅ DO: Use unknown for truly unknown types
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
}
```

### Components

```tsx
// ✅ DO: Name props interface consistently
interface CustomerCardProps {
  customer: Customer;
  onEdit: (id: string) => void;
}

export function CustomerCard({ customer, onEdit }: CustomerCardProps) {
  // component implementation
}
```

### API Routes

```typescript
// ✅ DO: Use Next.js 15 async params pattern
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  // ...
}

// ✅ DO: Handle errors properly
} catch (error: unknown) {
  console.error('[API_NAME]', error);
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
  );
}
```

### Modules (DDD Pattern)

```
modules/
└── customer/
    ├── domain/
    │   └── customer.entity.ts      # Types & interfaces
    ├── application/
    │   ├── create-customer.use-case.ts
    │   └── get-all-customers.use-case.ts
    └── infrastructure/
        ├── customer.repository.ts      # Interface
        └── customer.repository.supabase.ts  # Implementation
```

---

## Database Conventions

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `customers`, `job_cards` |
| Columns | snake_case | `created_at`, `tenant_id` |
| Indexes | `idx_table_column` | `idx_customers_tenant_id` |
| Foreign Keys | `table_column_fkey` | `customers_tenant_id_fkey` |

### Required Columns

Every tenant table must have:

```sql
tenant_id uuid NOT NULL REFERENCES tenant.tenants(id)
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
deleted_at timestamptz          -- Soft delete
deleted_by uuid                 -- Who deleted
```

### Migrations

```bash
# Create new migration
npx supabase migration new migration_name

# Apply migrations
npx supabase db reset
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.ts

# Run with coverage
npm test -- --coverage
```

### Test File Naming

```
src/
└── modules/
    └── customer/
        └── application/
            ├── create-customer.use-case.ts
            └── create-customer.use-case.test.ts  # Co-located
```

---

## Getting Help

- Check existing documentation in `Documentations/`
- Ask in team Slack channel
- Create a GitHub issue for bugs

---

## Code of Conduct

- Be respectful and constructive
- Focus on the code, not the person
- Help others learn and grow

---

*Happy coding! 🔧*
