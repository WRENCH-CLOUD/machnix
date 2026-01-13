# Wrench Cloud - User Workflows (Part 2: Administration & System)

This document covers administrative workflows, system processes, and technical integrations.

---

## 1. Authentication Workflow

**Actors:** All Users

```mermaid
flowchart TD
    A[User Visits App] --> B{Has Session?}
    B -->|Yes| C[Validate Session]
    B -->|No| D[Login Page]
    
    C --> E{Valid?}
    E -->|Yes| F[Resolve Role]
    E -->|No| D
    
    D --> G[Enter Credentials]
    G --> H[POST /api/auth/login]
    H --> I{Success?}
    I -->|Yes| J[Set HttpOnly Cookie]
    I -->|No| K[Show Error]
    
    J --> F
    F --> L{Role?}
    L -->|platform_admin| M[Admin Dashboard]
    L -->|tenant/admin| N[Tenant Dashboard]
    L -->|mechanic| O[Mechanic View]
    
    K --> D
```

### Session Management

| Component | Description |
|-----------|-------------|
| `AuthProvider` | Client-side auth context |
| `/api/auth/login` | Server-side login (sets cookies) |
| `/api/auth/me` | Validate current session |
| `/api/auth/logout` | Clear session |

### Role-Based Routing

| Role | Default Route | Access |
|------|---------------|--------|
| `platform_admin` | `/admin/dashboard` | All tenants |
| `tenant` | `/dashboard` | Own tenant |
| `mechanic` | `/dashboard` | Limited view |

---

## 2. Tenant Onboarding Workflow

**Actors:** Platform Admin

```mermaid
flowchart TD
    A[Admin Portal] --> B[Create Tenant]
    B --> C[Enter Details]
    C --> D[Set Plan]
    D --> E[Create Tenant Record]
    E --> F[Generate Slug]
    F --> G[Create Admin User]
    G --> H[Send Welcome Email]
    H --> I[Tenant Active]
    
    subgraph "Tenant Setup"
        I --> J[First Login]
        J --> K[Complete Profile]
        K --> L[Add First Customer]
        L --> M[Operational]
    end
```

### Tenant Plans

| Plan | Features | Limits |
|------|----------|--------|
| Starter | Basic CRUD, 1 user | 100 jobs/month |
| Pro | + Reports, 5 users | 500 jobs/month |
| Enterprise | + API, Unlimited | Unlimited |

---

## 3. User Management Workflow

**Actors:** Tenant Admin

```mermaid
flowchart LR
    A[Settings > Users] --> B[User List]
    B --> C{Action?}
    C -->|Add| D[Invite User]
    C -->|Edit| E[Update Role/Status]
    C -->|Deactivate| F[Set isActive=false]
    
    D --> G[Send Invite Email]
    G --> H[User Creates Password]
    H --> I[Active User]
    
    E --> J[Save Changes]
    F --> J
```

### User Roles in Tenant

| Role | Permissions |
|------|-------------|
| Admin | Full access, user management |
| Employee | CRUD operations, no settings |
| Mechanic | View assigned jobs, update status |

---

## 4. Impersonation Workflow (Platform Admin)

**Actors:** Platform Admin

```mermaid
flowchart TD
    A[Admin Dashboard] --> B[Select Tenant]
    B --> C[Click Impersonate]
    C --> D[POST /api/admin/impersonate]
    D --> E[Set Session Override]
    E --> F[Redirect to Tenant Dashboard]
    
    F --> G[Impersonation Banner Shows]
    G --> H{Action?}
    H -->|Work as Tenant| I[Normal Operations]
    H -->|Exit| J[Clear Override]
    J --> K[Return to Admin]
```

### Security Considerations

- Impersonation logged in audit trail
- Session expires after 1 hour
- Clear visual indicator of impersonation mode

---

## 5. Estimate-to-Invoice Workflow

**Actors:** System / Service Advisor

```mermaid
flowchart TD
    A[Estimate Approved] --> B[Generate Invoice]
    B --> C[Copy Estimate Items]
    C --> D[Calculate Totals]
    D --> E[Apply Tax Rate]
    E --> F[Generate Invoice Number]
    F --> G[Save Invoice]
    G --> H[Link to JobCard]
    H --> I[Invoice Ready]
```

### Auto-Calculation Rules

```
partsTotal = SUM(item.qty × item.unitPrice)
laborTotal = SUM(item.laborCost)
subtotal = partsTotal + laborTotal
taxAmount = subtotal × taxRate
discountAmount = manual or percentage
totalAmount = subtotal + taxAmount - discountAmount
balance = totalAmount - paidAmount
```

---

## 6. Reporting Workflow

**Actors:** Tenant Admin / Owner

```mermaid
flowchart LR
    A[Reports Page] --> B{Report Type}
    B -->|Jobs| C[Jobs Report]
    B -->|Revenue| D[Revenue Report]
    B -->|Customers| E[Customer Report]
    
    C & D & E --> F[Select Date Range]
    F --> G[Generate Report]
    G --> H[View in Dashboard]
    H --> I{Export?}
    I -->|PDF| J[Generate PDF]
    I -->|Excel| K[Generate XLSX]
```

### Available Reports

| Report | Metrics |
|--------|---------|
| Jobs Summary | Total jobs, by status, avg completion time |
| Revenue | Total revenue, by payment method, trends |
| Customer Activity | New customers, repeat visits, vehicle count |

---

## 7. Notification Workflow

**Actors:** System

```mermaid
flowchart TD
    A[Event Occurs] --> B{Event Type}
    B -->|Job Created| C[Notify Customer: Vehicle Received]
    B -->|Estimate Ready| D[Notify Customer: Review Estimate]
    B -->|Job Ready| E[Notify Customer: Pickup Ready]
    B -->|Payment Received| F[Notify Customer: Receipt]
    
    C & D & E & F --> G{Channel}
    G -->|In-App| H[Push Notification]
    G -->|WhatsApp| I[WhatsApp Message]
    G -->|SMS| J[SMS Gateway]
```

### Notification Templates

| Event | Message |
|-------|---------|
| Job Created | "Your vehicle has been checked in. Job #{number}" |
| Estimate Ready | "Your estimate is ready for review: ₹{amount}" |
| Job Ready | "Your vehicle is ready for pickup!" |
| Payment | "Payment received. Thank you!" |

---

## 8. Data Backup & Recovery Workflow

**Actors:** System / Platform Admin

```mermaid
flowchart TD
    A[Scheduled Job] --> B[Daily Backup]
    B --> C[Supabase Backup]
    C --> D[Store in S3]
    
    E[Recovery Request] --> F[Select Backup Point]
    F --> G[Restore to Staging]
    G --> H[Verify Data]
    H --> I[Swap to Production]
```

### Backup Schedule

| Type | Frequency | Retention |
|------|-----------|-----------|
| Full | Daily | 30 days |
| Incremental | Hourly | 7 days |
| Point-in-time | Continuous | 7 days |

---

## 9. API Integration Workflow

**Actors:** External Systems

```mermaid
flowchart LR
    A[External System] --> B[API Key Auth]
    B --> C{Endpoint}
    C -->|GET /api/customers| D[List Customers]
    C -->|POST /api/jobs| E[Create Job]
    C -->|GET /api/invoices| F[Get Invoices]
    
    D & E & F --> G[JSON Response]
    G --> H[Rate Limited]
```

### API Rate Limits

| Tier | Requests/min | Burst |
|------|-------------|-------|
| Starter | 60 | 10 |
| Pro | 300 | 50 |
| Enterprise | 1000 | 200 |

---

## 10. Error Handling Workflow

**Actors:** System

```mermaid
flowchart TD
    A[Error Occurs] --> B{Error Type}
    B -->|Validation| C[400 Bad Request]
    B -->|Auth| D[401/403 Unauthorized]
    B -->|Not Found| E[404 Not Found]
    B -->|Server| F[500 Internal Error]
    
    C --> G[Return Error Details]
    D --> H[Redirect to Login]
    E --> I[Show Not Found Page]
    F --> J[Log to Monitoring]
    J --> K[Alert Team]
```

### Error Response Format

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "code": "VALIDATION_ERROR"
}
```

---

## Quick Reference: System Endpoints

### Authentication

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/me` | GET | Current user |

### CRUD Entities

| Entity | List | Get | Create | Update | Delete |
|--------|------|-----|--------|--------|--------|
| Customers | GET / | GET /{id} | POST /create | PUT /{id}/update | DELETE /{id}/delete |
| Vehicles | GET / | GET /{id} | POST /create | PUT /{id}/update | DELETE /{id}/delete |
| Jobs | GET / | GET /{id} | POST / | PUT /{id} | DELETE /{id} |
| Estimates | GET / | GET /{id} | POST / | PUT /{id} | DELETE /{id} |
| Invoices | GET / | GET /{id} | POST /generate | PUT /pay | - |

---

## Integration Points

```mermaid
graph LR
    A[Wrench Cloud] --> B[Supabase Auth]
    A --> C[Supabase DB]
    A --> D[Razorpay Payments]
    A --> E[WhatsApp API]
    A --> F[SMS Gateway]
    A --> G[PDF Generator]
```

| Integration | Purpose | Status |
|-------------|---------|--------|
| Supabase | Auth + Database | ✅ Active |
| Razorpay | Payment Gateway | ✅ Active |
| WhatsApp | Notifications | 🔜 Planned |
| SMS | Notifications | 🔜 Planned |
