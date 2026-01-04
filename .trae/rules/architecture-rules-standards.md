Here is the condensed and structured Clean Architecture documentation, optimized for readability and strict enforcement.

## **1. Strict Import Rules**

### **1.1 Layer Hierarchy**

Dependencies must flow **downward only**. Lower layers generally cannot import from upper layers.

1. **app/** (Routing & Rendering)
2. **components/** (UI Composition)
3. **modules/** (Business Logic)
4. **shared/** (Cross-cutting concerns)
5. **lib/** (Technical Adapters)

### **1.2 Import Matrix**

| **From ↓ / To →** | **app** | **components** | **modules** | **shared** | **lib** |
| --- | --- | --- | --- | --- | --- |
| **app/** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **components/** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **modules/** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **shared/** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **lib/** | ❌ | ❌ | ❌ | ❌ | ❌ |

> **Critical Red Lines (Reject PR if violated):**
> * 🚫 **components → modules:** UI is "dumb"; it receives data via props.
> * 🚫 **components → lib:** UI cannot touch infrastructure directly.
> * 🚫 **modules → app:** Business logic cannot depend on the router/framework.
> * 🚫 **modules/domain → infrastructure:** Domain logic must remain pure.
> 
> 

### **1.3 Module Layer Rules**

* **Domain (`modules/*/domain`):** Pure business logic only.
* ❌ No HTTP calls, DB clients (Prisma/Supabase), or Next.js code.
* ✅ Types, Classes, Pure Functions.


* **Application (`modules/*/application`):** Use Cases defining *what* the system does.
* ❌ No HTTP concerns (Cookies, Headers).
* ✅ Imports Domain entities and Repository Interfaces.


* **Infrastructure (`modules/*/infrastructure`):** Defines *how* we talk to the world.
* ❌ No Business decisions.
* ✅ Imports `lib/` (clients) and implements Repository Interfaces.



---

## **2. Naming Conventions**

### **2.1 Folders**

| Type | Convention | Example |
| --- | --- | --- |
| **Route Groups** | kebab-case (parens) | `(platform-admin)` |
| **Modules** | kebab-case | `tenant-management/` |
| **Layers** | lowercase | `domain/`, `application/` |

### **2.2 Files**

| Category | Suffix / Pattern | Example |
| --- | --- | --- |
| **UI Views** | `<feature>-view.tsx` | `tenants-view.tsx` |
| **UI Dialogs** | `<feature>-dialog.tsx` | `create-tenant-dialog.tsx` |
| **Use Cases** | `<verb>-<noun>.usecase.ts` | `create-tenant.usecase.ts` |
| **Entities** | `<entity>.entity.ts` | `tenant.entity.ts` |
| **Repos (Interface)** | `<entity>.repository.ts` | `invoice.repository.ts` |
| **Repos (Impl)** | `<entity>.repository.<provider>.ts` | `invoice.repository.supabase.ts` |
| **DTOs** | `<action>.input.ts` | `create-tenant.input.ts` |

---

## **3. UI Component Rules**

| Type | Location | Responsibility |
| --- | --- | --- |
| **Page** | `app/**/page.tsx` | **Orchestrator.** Fetches data via Use Case, handles Params, passes props to View. |
| **View** | `components/**/views` | **Layout.** Page-level composition. strictly visual. |
| **Dialog** | `components/**/dialogs` | **Interaction.** Modals, forms, slide-overs. |
| **Primitive** | `components/ui` | **Reusable.** Buttons, inputs, cards (Shadcn/UI). |

---

## **4. API & Transport Rules**

### **4.1 "Thin" API Routes (`app/api/...`)**

Routes are strictly for transport. They must not contain business logic.

1. Extract Request Data.
2. Resolve Context (Auth/Tenant).
3. **Call ONE Use Case.**
4. Return Response.

### **4.2 Shared & Lib**

* **`shared/`**: Cross-cutting concerns (Auth helpers, Constants, Error Classes). **No** feature logic.
* **`lib/`**: Technical adapters only (Supabase client, Redis client, `cn` utility).

---

## **5. Enforcement Checklist**

Copy this into Pull Request descriptions:

```markdown
### Architecture Review Checklist
- [ ] **Imports:** Does any UI component import a module directly? (Should be ❌)
- [ ] **Purity:** Does `domain/` import any infrastructure or library? (Should be ❌)
- [ ] **Logic:** Does the `app/` route contain business logic? (Should be ❌ - move to Use Case)
- [ ] **Pattern:** Is every database write action wrapped in a Use Case? (Should be ✅)
- [ ] **Context:** Is tenant context passed explicitly, not fetched inside domain? (Should be ✅)

```

---

### **Next Step**

**Would you like me to generate the `.eslintrc.json` configuration file that automatically enforces these import rules (using `eslint-plugin-import`) so the build fails if a developer violates the matrix?**