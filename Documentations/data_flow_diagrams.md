# Wrench Cloud - Data Flow Diagrams

This document describes how data flows through the Wrench Cloud system, from creation to destruction, including all transformations and state changes.

---

## System Overview

```mermaid
graph TB
    subgraph "Multi-Tenant Architecture"
        Platform["Platform Admin"]
        T1["Tenant A (Garage)"]
        T2["Tenant B (Garage)"]
        T3["Tenant C (Garage)"]
    end
    
    subgraph "Core Data Entities"
        Customer
        Vehicle
        Job["JobCard"]
        Estimate
        Invoice
    end
    
    Platform --> T1 & T2 & T3
    T1 & T2 & T3 --> Customer --> Vehicle --> Job --> Estimate --> Invoice
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    TENANT ||--o{ USER : "has"
    TENANT ||--o{ CUSTOMER : "owns"
    CUSTOMER ||--o{ VEHICLE : "owns"
    CUSTOMER ||--o{ JOBCARD : "has"
    VEHICLE ||--o{ JOBCARD : "serviced in"
    JOBCARD ||--o| ESTIMATE : "generates"
    JOBCARD ||--o| INVOICE : "generates"
    ESTIMATE ||--o{ ESTIMATE_ITEM : "contains"
    INVOICE ||--o{ PAYMENT : "receives"
    USER ||--o{ JOBCARD : "assigned to"

    TENANT {
        uuid id PK
        string name
        string slug
        enum status
        enum subscription
    }
    
    CUSTOMER {
        uuid id PK
        uuid tenant_id FK
        string name
        string phone
        string email
        timestamp deleted_at
    }
    
    VEHICLE {
        uuid id PK
        uuid tenant_id FK
        uuid customer_id FK
        string make
        string model
        string reg_no
        timestamp deleted_at
    }
    
    JOBCARD {
        uuid id PK
        uuid tenant_id FK
        uuid customer_id FK
        uuid vehicle_id FK
        enum status
        timestamp deleted_at
    }
    
    ESTIMATE {
        uuid id PK
        uuid jobcard_id FK
        enum status
        decimal total_amount
    }
    
    INVOICE {
        uuid id PK
        uuid jobcard_id FK
        enum status
        decimal total_amount
        decimal paid_amount
    }
```

---

## 1. Tenant Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: Platform Admin creates tenant
    Created --> Trial: Initial 14-day trial
    Trial --> Active: Subscription activated
    Trial --> Suspended: Trial expired
    Active --> Suspended: Non-payment / Policy violation
    Suspended --> Active: Payment received / Issue resolved
    Suspended --> [*]: Account deleted (hard delete)
    
    note right of Trial
        Trial Period:
        - Limited features
        - Max 50 jobs
        - No invoice generation
    end note
```

### Tenant Data Flow

```mermaid
flowchart LR
    subgraph Creation
        A1[Admin Portal] -->|POST /api/admin/tenants| A2[CreateTenantUseCase]
        A2 -->|Insert| A3[(tenants table)]
        A2 -->|Create subdomain| A4[DNS Record]
    end
    
    subgraph Usage
        A3 -->|tenant_id context| B1[All Operations]
        B1 -->|RLS Policies| B2[(Tenant Data)]
    end
    
    subgraph Destruction
        C1[Admin Action] -->|Soft Delete| A3
        A3 -->|deleted_at set| C2[Data Retained 90 days]
        C2 -->|Cleanup Job| C3[Hard Delete]
    end
```

---

## 2. Customer Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: Customer created
    Active --> Active: Updated (name, contact)
    Active --> HasVehicles: Vehicles registered
    HasVehicles --> HasJobs: Jobs created
    HasJobs --> HasVehicles: Jobs completed
    HasVehicles --> Active: Vehicles removed
    Active --> SoftDeleted: Marked as deleted
    SoftDeleted --> [*]: Purged after retention period
    
    note right of SoftDeleted
        Soft Delete:
        - deleted_at timestamp set
        - deleted_by user recorded
        - Data retained for auditing
    end note
```

### Customer Data Flow

```mermaid
flowchart TB
    subgraph "Creation Phase"
        UI1[Add Customer Dialog] -->|Form Data| API1["/api/customers/create"]
        API1 -->|Validate| UC1[CreateCustomerUseCase]
        UC1 -->|Check duplicates| REPO1[CustomerRepository]
        REPO1 -->|Insert| DB1[(customers table)]
        DB1 -->|Return| RESP1[Customer Object]
    end
    
    subgraph "Read Phase"
        UI2[Customer List] -->|GET| API2["/api/customers"]
        API2 -->|Query with tenant_id| REPO2[GetAllCustomersUseCase]
        REPO2 -->|SELECT with joins| DB2[(customers + vehicles)]
        DB2 -->|Transform| VM1[CustomerWithStats ViewModel]
    end
    
    subgraph "Update Phase"
        UI3[Edit Dialog] -->|PUT| API3["/api/customers/{id}/update"]
        API3 -->|Validate| UC3[UpdateCustomerUseCase]
        UC3 -->|Check exists| REPO3[CustomerRepository]
        REPO3 -->|UPDATE| DB3[(customers table)]
        DB3 -->|updated_at = now| RESP3[Updated Customer]
    end
    
    subgraph "Deletion Phase"
        UI4[Delete Confirmation] -->|DELETE| API4["/api/customers/{id}/delete"]
        API4 -->|Soft Delete| UC4[DeleteCustomerUseCase]
        UC4 -->|Set deleted_at| REPO4[CustomerRepository]
        REPO4 -->|UPDATE| DB4[(customers table)]
    end
```

---

## 3. Vehicle Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Registered: Vehicle added
    Registered --> Serviced: First job created
    Serviced --> Serviced: Additional jobs
    Serviced --> Idle: No active jobs
    Idle --> Serviced: New job created
    Registered --> Transferred: Owner changed
    Transferred --> Registered: Linked to new customer
    Registered --> SoftDeleted: Deleted
    SoftDeleted --> [*]: Purged
```

### Vehicle Data Flow

```mermaid
flowchart TB
    subgraph "Creation with Customer Lookup"
        F1[Add Vehicle Form] -->|ownerPhone| API1["/api/vehicles/create"]
        API1 -->|Search by phone| CR1[CustomerRepository.searchByPhone]
        CR1 -->|Found?| D1{Customer Exists?}
        D1 -->|Yes| UC1[CreateVehicleUseCase]
        D1 -->|No| ERR1[Error: Create customer first]
        UC1 -->|makeId lookup| MK1[vehicle_make table]
        MK1 -->|Get name| UC1
        UC1 -->|Insert| DB1[(vehicles table)]
    end
    
    subgraph "Data Enrichment"
        DB1 -->|vehicle_id| JC1[(jobcards)]
        JC1 -->|Count jobs| STATS1[totalJobs]
        JC1 -->|Last job date| STATS2[lastService]
        STATS1 & STATS2 -->|Merge| VM1[VehicleViewModel]
    end
```

---

## 4. JobCard Lifecycle (Primary Business Flow)

```mermaid
stateDiagram-v2
    [*] --> Received: Customer drops off vehicle
    Received --> Working: Mechanic starts work
    Working --> Working: Parts ordered / Work continues
    Working --> Ready: Work complete, awaiting payment
    Ready --> Completed: Payment received
    Ready --> Working: Additional issues found
    
    Received --> Cancelled: Customer cancels
    Working --> Cancelled: Cannot be repaired
    
    Completed --> [*]: Archived
    Cancelled --> [*]: Archived
    
    note right of Received
        Auto-creates:
        - Estimate (draft)
        - Links customer & vehicle
    end note
    
    note right of Ready
        Triggers:
        - Invoice generation
        - Customer notification
    end note
```

### JobCard Data Transformation Flow

```mermaid
flowchart TB
    subgraph "Job Creation"
        C1[Create Job Dialog] -->|customer_id, vehicle_id| A1["/api/jobs"]
        A1 -->|Generate job_number| UC1[CreateJobUseCase]
        UC1 -->|Insert job| DB1[(jobcards)]
        UC1 -->|Auto-create estimate| DB2[(estimates)]
        DB1 & DB2 -->|Return| J1[JobCardWithRelations]
    end
    
    subgraph "Status Progression"
        J1 -->|Status Update| A2["/api/jobs/{id}/status"]
        A2 -->|Validate transition| UC2[UpdateJobStatusUseCase]
        UC2 -->|Check valid transition| RULES[Status Rules Engine]
        RULES -->|Valid| DB3[(jobcards.status)]
        RULES -->|Invalid| ERR[Error Response]
    end
    
    subgraph "Estimate to Invoice"
        DB2 -->|Estimate approved| E1[EstimateItems]
        E1 -->|Copy to invoice| A3["/api/invoices/generate"]
        A3 -->|Calculate totals| UC3[GenerateInvoiceUseCase]
        UC3 -->|Insert| DB4[(invoices)]
    end
    
    subgraph "Completion"
        DB4 -->|Payment received| P1[PaymentTransaction]
        P1 -->|Update balance| DB4
        DB4 -->|balance = 0| COMPLETE[Status: Completed]
        COMPLETE -->|Archive| DB1
    end
```

---

## 5. Estimate Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: Created with job
    Draft --> Draft: Items added/modified
    Draft --> Pending: Sent to customer
    Pending --> Approved: Customer approves
    Pending --> Rejected: Customer rejects
    Pending --> Expired: Validity period passed
    Approved --> [*]: Converted to invoice
    Rejected --> Draft: Revised quote
    Expired --> Draft: Extended validity
```

### Estimate Data Flow

```mermaid
flowchart LR
    subgraph "Item Management"
        UI[Estimate Editor] -->|Add Item| API1["/api/estimates/items"]
        API1 -->|Insert| DB1[(estimate_items)]
        DB1 -->|Trigger| CALC[Recalculate Totals]
        CALC -->|Update| DB2[(estimates)]
    end
    
    subgraph "Total Calculation"
        DB1 -->|SUM qty * unitPrice| PARTS[partsTotal]
        DB1 -->|SUM laborCost| LABOR[laborTotal]
        PARTS & LABOR -->|Add| SUBTOTAL[subtotal]
        SUBTOTAL -->|Apply tax rate| TAX[taxAmount]
        SUBTOTAL -->|Apply discount| DISC[discountAmount]
        SUBTOTAL & TAX & DISC -->|Calculate| TOTAL[totalAmount]
        TOTAL -->|Save| DB2
    end
```

---

## 6. Invoice & Payment Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Invoice generated
    Pending --> Paid: Full payment received
    Pending --> Overdue: Due date passed
    Overdue --> Paid: Payment received
    Paid --> [*]: Closed
    
    note right of Pending
        Payment Methods:
        - Cash
        - UPI
        - Card (Razorpay)
        - Bank Transfer
    end note
```

### Payment Data Flow

```mermaid
flowchart TB
    subgraph "Invoice Generation"
        EST[Approved Estimate] -->|Copy items| GEN[GenerateInvoiceUseCase]
        GEN -->|Calculate| INV[(invoices)]
        INV -->|invoice_number auto| NUM[INV-{tenant}-{seq}]
    end
    
    subgraph "Payment Processing"
        PAY1[Mark as Paid] -->|POST| API1["/api/invoices/{id}/pay"]
        API1 -->|Create transaction| TXN[(payment_transactions)]
        TXN -->|Update paid_amount| INV
        INV -->|Check balance| D1{balance = 0?}
        D1 -->|Yes| STATUS1[status: paid]
        D1 -->|No| STATUS2[status: pending]
    end
    
    subgraph "Razorpay Flow"
        RP1[Initiate Payment] -->|Create Order| API2[/api/payments/razorpay/order]
        API2 -->|razorpay_order_id| TXN
        RP2[Razorpay Callback] -->|Verify signature| API3[/api/payments/razorpay/verify]
        API3 -->|Update status| TXN
    end
```

---

## 7. Soft Delete Pattern

All entities follow a consistent soft-delete pattern for data integrity and audit trails:

```mermaid
flowchart LR
    subgraph "Soft Delete Implementation"
        DEL[Delete Request] -->|Set timestamp| A1[deleted_at = NOW]
        DEL -->|Record user| A2[deleted_by = user_id]
        A1 & A2 -->|Update row| DB[(Table)]
    end
    
    subgraph "Query Filtering"
        QUERY[All Queries] -->|WHERE| FILTER[deleted_at IS NULL]
        FILTER -->|Return| ACTIVE[Active Records Only]
    end
    
    subgraph "Data Retention"
        DB -->|90 days| CLEANUP[Retention Job]
        CLEANUP -->|Hard DELETE| PURGE[Permanent Removal]
    end
```

---

## 8. Data Transformation Layers

```mermaid
flowchart TB
    subgraph "Database Layer"
        DB1[(Supabase Tables)]
        DB1 -->|snake_case columns| RAW[Raw DB Rows]
    end
    
    subgraph "Repository Layer"
        RAW -->|toDomain| ENTITY[Domain Entities]
        ENTITY -->|camelCase properties| DOMAIN[Clean Domain Objects]
    end
    
    subgraph "API Layer"
        DOMAIN -->|JSON.stringify| API[API Response]
        API -->|HTTP Response| CLIENT[Frontend]
    end
    
    subgraph "UI Layer"
        CLIENT -->|transform| VM[ViewModels]
        VM -->|Format dates, calculate stats| UI[React Components]
    end
```

### Example: Vehicle Transformation Chain

```mermaid
flowchart LR
    subgraph "DB Row"
        A1["id: uuid"]
        A2["tenant_id: uuid"]
        A3["customer_id: uuid"]
        A4["make: 'Toyota'"]
        A5["model: 'Camry'"]
        A6["reg_no: 'KA 01 AB 1234'"]
    end
    
    subgraph "Domain Entity"
        B1["id: string"]
        B2["tenantId: string"]
        B3["customerId: string"]
        B4["make: string"]
        B5["model: string"]
        B6["licensePlate: string"]
    end
    
    subgraph "ViewModel"
        C1["id: string"]
        C2["makeName: 'Toyota'"]
        C3["modelName: 'Camry'"]
        C4["regNo: 'KA 01 AB 1234'"]
        C5["ownerName: 'John Doe'"]
        C6["totalJobs: 5"]
    end
    
    A1 & A2 & A3 & A4 & A5 & A6 -->|toDomain| B1 & B2 & B3 & B4 & B5 & B6
    B1 & B2 & B3 & B4 & B5 & B6 -->|transformVehicleToViewModel| C1 & C2 & C3 & C4 & C5 & C6
```

---

## Summary

| Entity | Create | Read | Update | Delete | States |
|--------|--------|------|--------|--------|--------|
| Tenant | Platform Admin | All Users | Platform Admin | Soft Delete | trial, active, suspended |
| Customer | Tenant User | Tenant Users | Tenant User | Soft Delete | active, deleted |
| Vehicle | Tenant User | Tenant Users | Tenant User | Soft Delete | registered, deleted |
| JobCard | Tenant User | Tenant Users | Tenant User | Soft Delete | received → completed |
| Estimate | Auto/Manual | Tenant Users | Tenant User | Soft Delete | draft → approved/rejected |
| Invoice | Auto | Tenant Users | System | Soft Delete | pending → paid |
