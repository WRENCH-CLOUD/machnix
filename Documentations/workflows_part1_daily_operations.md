# Wrench Cloud - User Workflows (Part 1: Daily Operations)

This document covers the primary user workflows for daily garage operations.

---

## 1. Customer Check-In Workflow

**Actors:** Front Desk / Service Advisor

```mermaid
flowchart TD
    A[Customer Arrives] --> B{Existing Customer?}
    B -->|Yes| C[Search by Phone]
    B -->|No| D[Create New Customer]
    C --> E[Customer Found]
    D --> E
    E --> F{Has Vehicle Registered?}
    F -->|Yes| G[Select Vehicle]
    F -->|No| H[Register New Vehicle]
    H --> G
    G --> I[Create Job Card]
    I --> J[Assign to Queue]
    J --> K[Print Job Ticket]
```

### Step-by-Step

1. **Customer Search**
   - Navigate to **Customers** page
   - Search by phone number or name
   - If not found, click **Add Customer**

2. **Customer Registration** (if new)
   - Fill in: Name (required), Phone, Email, Address
   - Click **Create Customer**

3. **Vehicle Selection/Registration**
   - View customer's registered vehicles
   - If new vehicle: Click **Add Vehicle**
   - Enter: Make, Model, Reg No., Owner Phone (for linking)

4. **Job Card Creation**
   - Click **Create Job** from customer or vehicle
   - Enter complaint/description
   - Assign mechanic (optional)
   - Job status starts as **Received**

---

## 2. Job Processing Workflow

**Actors:** Mechanic / Service Advisor

```mermaid
flowchart TD
    A[Job Board] --> B[View Jobs]
    B --> C[Select Job Card]
    C --> D[Review Details]
    D --> E{Start Work?}
    E -->|Yes| F[Change Status: Working]
    F --> G[Perform Inspection]
    G --> H[Add Estimate Items]
    H --> I{More Parts?}
    I -->|Yes| H
    I -->|No| J[Send Estimate to Customer]
    J --> K{Approved?}
    K -->|Yes| L[Continue Work]
    K -->|No| M[Revise Estimate]
    M --> J
    L --> N[Complete Work]
    N --> O[Change Status: Ready]
    O --> P[Generate Invoice]
```

### Job Status Flow

| Status | Who Changes | Next Valid States |
|--------|-------------|------------------|
| Received | System (auto) | Working, Cancelled |
| Working | Mechanic | Ready, Cancelled |
| Ready | System/Advisor | Completed |
| Completed | System (auto) | - |
| Cancelled | Advisor | - |

### Estimate Management

1. **Add Parts/Labor**
   - Select from parts catalog or add custom item
   - Enter quantity and unit price
   - Add labor cost per item
   - System auto-calculates totals

2. **Send to Customer**
   - Click **Send Estimate**
   - Customer receives notification (future: WhatsApp/SMS)
   - Wait for approval

3. **Handling Approval**
   - Approved → Continue work
   - Rejected → Revise estimate

---

## 3. Payment & Delivery Workflow

**Actors:** Front Desk / Cashier

```mermaid
flowchart TD
    A[Job Status: Ready] --> B[Customer Notified]
    B --> C[Customer Arrives]
    C --> D[Review Invoice]
    D --> E{Payment Mode?}
    E -->|Cash| F[Accept Cash]
    E -->|UPI| G[Show QR Code]
    E -->|Card| H[Razorpay Checkout]
    F & G & H --> I[Record Payment]
    I --> J[Mark as Paid]
    J --> K[Job Status: Completed]
    K --> L[Print Invoice]
    L --> M[Vehicle Handover]
    M --> N[Update Mileage]
```

### Payment Methods

| Method | Process |
|--------|---------|
| Cash | Enter amount, click "Mark as Paid" |
| UPI | Generate QR, customer pays, mark paid |
| Card | Razorpay popup, auto-confirms |
| Bank Transfer | Record reference, mark paid |

---

## 4. Customer Detail View Workflow

```mermaid
flowchart LR
    A[Customer List] -->|Click Card| B[Detail Sheet Opens]
    B --> C[View Info]
    C --> D{Action?}
    D -->|Edit| E[Edit Dialog]
    D -->|Delete| F[Confirm Delete]
    D -->|Create Job| G[Job Creation]
    E -->|Save| H[Refresh List]
    F -->|Confirm| H
    G --> I[Job Board]
```

### Available Actions

| Action | Description |
|--------|-------------|
| View Details | See full customer info, vehicles, job history |
| Edit Customer | Update name, phone, email, address |
| Create Job | Start new job for this customer |
| Delete | Soft-delete (can be recovered) |

---

## 5. Vehicle Management Workflow

```mermaid
flowchart TD
    A[Vehicles Page] --> B[Vehicle Registry]
    B -->|Click Card| C[Detail Sheet]
    C --> D[Vehicle Info]
    D --> E[Owner Information]
    D --> F[Service History]
    
    G[Add Vehicle] --> H[Enter Details]
    H --> I[Enter Owner Phone]
    I --> J{Customer Found?}
    J -->|Yes| K[Link to Customer]
    J -->|No| L[Error: Create Customer First]
    K --> B
```

### Vehicle Registration Requirements

| Field | Required | Notes |
|-------|----------|-------|
| Registration No. | ✅ | Must be unique |
| Make | ❌ | Select from dropdown |
| Model | ❌ | Free text |
| Year | ❌ | 1900-2030 |
| Color | ❌ | Free text |
| Odometer | ❌ | Current reading |
| Owner Phone | ✅ | Links to customer |

---

## 6. Search & Filter Workflow

```mermaid
flowchart LR
    A[Search Box] --> B[Enter Query]
    B --> C{Search Type}
    C -->|Customer| D[Name, Phone, Email]
    C -->|Vehicle| E[Make, Model, Reg No]
    C -->|Job| F[Job Number, Description]
    D & E & F --> G[Filtered Results]
    G --> H[Click to View]
```

### Search Shortcuts

| Page | Searchable Fields |
|------|------------------|
| Customers | Name, Phone, Email |
| Vehicles | Make, Model, Registration |
| Jobs | Job Number, Customer Name |

---

## Quick Reference Card

### Keyboard Shortcuts (Future)

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Customer |
| `Ctrl+J` | New Job |
| `Ctrl+F` | Focus Search |
| `Esc` | Close Dialog |

### Status Colors

| Color | Meaning |
|-------|---------|
| 🔵 Blue | Received (New) |
| 🟡 Amber | Working (In Progress) |
| 🟢 Green | Ready (Awaiting Payment) |
| ⚪ Gray | Completed |
| 🔴 Red | Cancelled |
