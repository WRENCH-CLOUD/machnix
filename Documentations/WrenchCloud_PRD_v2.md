# WrenchCloud – Product Requirements Document (PRD)
## Version 2.0

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2025 | Product Team | Initial v1 release |
| 2.0 | January 2026 | Product Team | Added GST, Payments, WhatsApp |

---

## 1. Product Overview

### Product Name
WrenchCloud v2

### Executive Summary
WrenchCloud v2 builds upon the successful v1 foundation by adding three critical features that transform the platform from a job tracking system into a complete business management solution for automobile garages:

1. **GST Compliance & Filing** - Automated GST return preparation and filing
2. **Digital Payments** - Integrated UPI and card payments via Cashfree
3. **WhatsApp Notifications** - Automated customer updates via Gupshup

These features address the three biggest operational pain points identified during the v1 pilot: tax compliance burden, payment collection delays, and customer communication overhead.

### Product Vision
To be the **complete operating system** for automobile garages in India—handling everything from job intake to tax compliance, enabling garage owners to focus on vehicle service quality rather than administrative complexity.

### What Changed from v1
v1 successfully validated that garages need and will use digital job tracking, customer management, and basic billing. v2 addresses the next layer of operational needs that emerged from pilot feedback:

- **"GST filing is a nightmare"** → GST automation
- **"Collecting payments takes too long"** → Digital payment integration
- **"Customers keep calling for updates"** → WhatsApp automation

---

## 2. Target Users

### Primary Users (v2)

#### 1. Garage Owner / Manager (Continuing from v1)
- **New Capabilities in v2:**
  - Views GST reports and liabilities
  - Initiates GST return filing
  - Monitors payment collection efficiency
  - Sends WhatsApp updates with one click

#### 2. Accountant / Tax Professional (NEW in v2)
- **Profile:**
  - Either in-house finance staff or external CA
  - Responsible for GST compliance
  - Visits monthly or quarterly
- **Needs:**
  - Access to GST-ready reports
  - Ability to review before filing
  - Reconciliation tools

### Explicitly Excluded in v2
- **Mechanics** - Still no direct system access (deferred to v3)
- **Customer-facing mobile app** - Customers receive WhatsApp, no app needed
- **Multi-location management** - Single garage focus continues

---

## 3. Current State & New Problems

### Problems Validated in v1 Pilot

Based on feedback from 2 pilot garages (November 2025 - January 2026):

#### Problem 1: GST Compliance is Manual & Error-Prone
**Current Reality:**
- Garage owners manually compile invoices at month-end
- Data handed over to CA who manually enters into GST portal
- Process takes 3-5 hours per month
- Frequent errors in invoice matching
- Late fees paid due to missed deadlines

**Customer Quote:**
> "I spend the 15th to 20th of every month just preparing GST data. Even then, my CA finds mistakes." — Pilot Garage Owner

#### Problem 2: Payment Collection is Slow
**Current Reality:**
- 70% of customers pay cash
- Digital payment requires sharing QR codes via WhatsApp (manual)
- No automatic payment confirmation in system
- Cash handling creates security and reconciliation issues
- Payment delays affect cash flow

**Customer Quote:**
> "Customers say they'll pay via UPI, I send them a QR on WhatsApp, then I have to manually mark it as paid in the system. It's tedious." — Pilot Garage Manager

#### Problem 3: Constant Phone Calls for Updates
**Current Reality:**
- Each customer calls 2-3 times per job to check status
- Service advisors spend 30-40% of time answering status calls
- Customers complain about lack of proactive updates
- Phone lines busy during peak hours

**Customer Quote:**
> "Half my day is answering 'Is my car ready?' calls. I wish they just knew automatically." — Service Advisor

---

## 4. Value Proposition (v2)

### Core Value Statement
WrenchCloud v2 provides **automated compliance, faster payments, and proactive communication**, enabling garages to operate professionally with less manual effort.

### Value Delivered by Each Feature

#### GST Automation
- **Saves 3-5 hours/month** on GST preparation
- **Reduces errors** through automated reconciliation
- **Prevents late fees** via deadline reminders
- **Builds trust** with accurate, auditable records

#### Digital Payments
- **70% faster payment collection** (UPI instant confirmation)
- **Better cash flow** from faster settlements (T+0 available)
- **Zero manual reconciliation** for digital payments
- **Professional experience** for customers

#### WhatsApp Notifications
- **80% reduction** in status inquiry calls
- **Better customer satisfaction** through proactive updates
- **Professional brand image** via automated messaging
- **Reduced service advisor workload**

### Consequence of Not Upgrading to v2
- Continue wasting 40+ hours/year on GST compilation
- Lose customers to garages offering digital payment convenience
- Service quality suffers due to time spent on phone calls
- Risk GST non-compliance penalties

---

## 5. Product Scope – Version 2

### New Features in v2 (Must-Have)

#### 5.1 GST Compliance Module

**Core Capabilities:**
1. **Automatic Invoice Classification**
   - Every invoice auto-tagged with correct GST rate (18% for services, 18% for parts)
   - HSN codes for parts, SAC codes for services
   - Separate tracking of CGST, SGST, IGST

2. **GSTR-1 Report Generation**
   - B2B invoices with customer GSTIN
   - B2C summary (aggregated by value)
   - Export-ready Excel and JSON formats
   - One-click upload to GST portal

3. **GSTR-3B Preparation**
   - Auto-populated from GSTR-1 data
   - Input Tax Credit (ITC) calculation
   - Tax liability summary
   - Payment challans tracking

4. **GST Dashboard**
   - Current month collections
   - Tax liability (payable)
   - Filing deadlines
   - Compliance status

**What's NOT Included in v2:**
- Direct filing to GST portal (output is file upload-ready)
- Annual return (GSTR-9) preparation
- TDS/TCS handling
- Composition scheme support

#### 5.2 Payment Integration Module

**Core Capabilities:**
1. **Multiple Payment Methods**
   - UPI (0% fee via Cashfree)
   - Debit/Credit cards (2% + GST fee)
   - Cash (manual recording)
   - Net banking

2. **Payment Collection Flow**
   - Generate payment link from invoice
   - Customer pays via Cashfree checkout
   - Automatic payment confirmation
   - Auto-update invoice status
   - Receipt generation

3. **Reconciliation**
   - Automatic payment matching
   - Settlement tracking
   - Fee calculation
   - Payment method analytics

**What's NOT Included in v2:**
- Partial payments
- Refunds
- Payment plans/EMI
- Multiple payment methods per invoice

#### 5.3 WhatsApp Notification Module

**Core Capabilities:**
1. **Automated Notifications**
   - Job created → "Vehicle received"
   - Estimate ready → "Please review estimate"
   - Work started → "Work in progress"
   - Job ready → "Vehicle ready for pickup"
   - Payment received → "Thank you + receipt"

2. **Template Management**
   - Pre-approved templates from Gupshup
   - Variable substitution (customer name, job number, amount)
   - Multi-language support (English, Hindi)

3. **Notification Settings**
   - Enable/disable per notification type
   - Per-tenant customization
   - Opt-out management

4. **Delivery Tracking**
   - Sent/Delivered/Read status
   - Failed delivery alerts
   - Notification history per customer

**What's NOT Included in v2:**
- Two-way WhatsApp chat
- Rich media (images, PDFs)
- Bulk promotional messages
- Chatbot interactions

### Explicitly Excluded from v2

The following remain deferred:
- **Digital Vehicle Inspection (DVI)** - Planned for v3
- **Mechanic mobile app** - Planned for v3
- **Multi-location support** - Planned for v4
- **Parts inventory management** - Planned for v3
- **Customer loyalty programs** - Planned for v4
- **Advanced analytics/BI** - Enhanced in v3

---

## 6. User Roles & Permissions (v2)

### Platform Admin (Unchanged from v1)
- Manages tenants
- Views system-wide analytics
- No new permissions in v2

### Tenant Owner / Admin (Enhanced in v2)
**Existing permissions:**
- All v1 capabilities (jobs, customers, vehicles, invoices)

**New permissions in v2:**
- View GST reports
- Initiate GST return generation
- Configure WhatsApp notification settings
- View payment analytics
- Manage Cashfree integration settings
- View notification delivery reports

### Accountant (NEW Role in v2)
**Permissions:**
- Read-only access to invoices
- Access to all GST reports
- Download GST return files
- View tax liability dashboard
- Cannot modify invoices or jobs
- Cannot access customer personal data (phone, email)

**Rationale:**
Many garages use external CAs. This role allows secure, limited access for compliance without exposing operational data.

---

## 7. Feature Workflows

### 7.1 GST Filing Workflow

```
┌─────────────────────────────────────────────┐
│          Monthly Operations                 │
│                                             │
│  1. Create invoices (with GST)              │
│  2. System auto-calculates tax              │
│  3. System logs HSN/SAC codes               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         Month End (Before 10th)             │
│                                             │
│  1. Owner clicks "Prepare GSTR-1"           │
│  2. System generates report                 │
│  3. Owner/CA reviews                        │
│  4. Download Excel/JSON                     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      External GST Portal (Before 11th)      │
│                                             │
│  1. CA logs into GST portal                 │
│  2. Upload WrenchCloud file                 │
│  3. Submit GSTR-1                           │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      GSTR-3B Preparation (Before 20th)      │
│                                             │
│  1. System reads filed GSTR-1               │
│  2. Auto-populates GSTR-3B                  │
│  3. Owner/CA reviews tax liability          │
│  4. Pay tax via GST portal                  │
│  5. Record payment in WrenchCloud           │
│  6. Download/upload GSTR-3B                 │
└─────────────────────────────────────────────┘
```

### 7.2 Payment Collection Workflow

```
┌─────────────────────────────────────────────┐
│            Customer Arrives                 │
│                                             │
│  1. Service advisor opens invoice           │
│  2. Invoice shows: ₹8,500 due               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│          Choose Payment Method              │
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  Cash   │  │   UPI   │  │  Card   │    │
│  └─────────┘  └─────────┘  └─────────┘    │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
      ▼           ▼           ▼
┌─────────┐ ┌──────────┐ ┌──────────┐
│  Cash   │ │   UPI/   │ │Cashfree  │
│ Marked  │ │  Card    │ │ Checkout │
│Manually │ │          │ │  Popup   │
└─────────┘ └──────────┘ └──────────┘
                  │
                  ▼
      ┌───────────────────────┐
      │  Customer completes   │
      │  payment on phone     │
      └───────────┬───────────┘
                  │
                  ▼
      ┌───────────────────────┐
      │ Cashfree webhook      │
      │ confirms to system    │
      └───────────┬───────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        Auto-updates in WrenchCloud          │
│                                             │
│  ✓ Invoice marked PAID                      │
│  ✓ Payment transaction logged               │
│  ✓ Job status → Completed                   │
│  ✓ WhatsApp receipt sent                    │
└─────────────────────────────────────────────┘
```

### 7.3 WhatsApp Notification Workflow

```
┌─────────────────────────────────────────────┐
│          Trigger Event Occurs               │
│                                             │
│  Examples:                                  │
│  • Job status changed to "Working"          │
│  • Estimate status changed to "Pending"     │
│  • Payment received                         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      System Event Handler                   │
│                                             │
│  1. Detect event type                       │
│  2. Check tenant notification settings      │
│  3. Validate customer has phone number      │
│  4. Prepare template with variables         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        Gupshup API Call                     │
│                                             │
│  POST /whatsapp/api/v1/msg                  │
│  {                                          │
│    "channel": "whatsapp",                   │
│    "source": "919876543210",               │
│    "destination": "919123456789",          │
│    "message": {                            │
│      "type": "template",                   │
│      "template": "job_ready",              │
│      "params": ["Honda City", "JOB-123"]   │
│    }                                       │
│  }                                         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      Log Notification                       │
│                                             │
│  • Save to notification_logs table          │
│  • Status: sent/delivered/failed            │
│  • Link to job and customer                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        Customer Receives Message            │
│                                             │
│  WhatsApp notification:                     │
│  "Your Honda City (JOB-123) is ready for    │
│   pickup! Amount due: ₹8,500"               │
└─────────────────────────────────────────────┘
```

---

## 8. Technical Requirements

### 8.1 GST Module

**Database Schema Changes:**

```sql
-- Add GST fields to invoices
ALTER TABLE tenant.invoices ADD COLUMN cgst_amount DECIMAL(10,2);
ALTER TABLE tenant.invoices ADD COLUMN sgst_amount DECIMAL(10,2);
ALTER TABLE tenant.invoices ADD COLUMN igst_amount DECIMAL(10,2);
ALTER TABLE tenant.invoices ADD COLUMN customer_gstin VARCHAR(15);
ALTER TABLE tenant.invoices ADD COLUMN place_of_supply VARCHAR(50);

-- Add GST fields to invoice items
ALTER TABLE tenant.invoice_items ADD COLUMN hsn_code VARCHAR(10);
ALTER TABLE tenant.invoice_items ADD COLUMN sac_code VARCHAR(10);
ALTER TABLE tenant.invoice_items ADD COLUMN gst_rate DECIMAL(5,2);
ALTER TABLE tenant.invoice_items ADD COLUMN taxable_amount DECIMAL(10,2);

-- New: GST returns tracking
CREATE TABLE tenant.gst_returns (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  return_type VARCHAR(10) NOT NULL, -- GSTR1, GSTR3B
  period VARCHAR(7) NOT NULL, -- YYYY-MM
  status VARCHAR(20), -- draft, filed
  filed_date TIMESTAMP,
  file_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**
- `GET /api/gst/dashboard` - Current month summary
- `GET /api/gst/gstr1/:period` - Generate GSTR-1 report
- `GET /api/gst/gstr3b/:period` - Generate GSTR-3B report
- `POST /api/gst/returns` - Mark return as filed
- `GET /api/gst/invoices/:period` - Get all invoices for period

### 8.2 Payments Module

**Database Schema Changes:**

```sql
-- Enhance payment_transactions table
ALTER TABLE tenant.payment_transactions ADD COLUMN gateway VARCHAR(20);
ALTER TABLE tenant.payment_transactions ADD COLUMN gateway_order_id VARCHAR(100);
ALTER TABLE tenant.payment_transactions ADD COLUMN gateway_payment_id VARCHAR(100);
ALTER TABLE tenant.payment_transactions ADD COLUMN gateway_signature VARCHAR(255);
ALTER TABLE tenant.payment_transactions ADD COLUMN gateway_fee DECIMAL(10,2);
ALTER TABLE tenant.payment_transactions ADD COLUMN settlement_date DATE;
ALTER TABLE tenant.payment_transactions ADD COLUMN gateway_response JSONB;

-- New: Tenant payment settings
CREATE TABLE tenant.payment_settings (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE,
  cashfree_enabled BOOLEAN DEFAULT FALSE,
  cashfree_app_id VARCHAR(100),
  cashfree_secret_key_encrypted TEXT,
  upi_enabled BOOLEAN DEFAULT TRUE,
  card_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**
- `POST /api/payments/cashfree/order` - Create payment order
- `POST /api/payments/cashfree/verify` - Verify payment
- `POST /api/payments/cashfree/webhook` - Receive webhooks
- `GET /api/payments/settings` - Get tenant settings
- `PUT /api/payments/settings` - Update tenant settings
- `GET /api/invoices/:id/payment-link` - Generate payment link

### 8.3 WhatsApp Module

**Database Schema Changes:**

```sql
-- New: Notification templates
CREATE TABLE tenant.notification_templates (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- job_created, estimate_ready, etc
  template_name VARCHAR(100),
  template_content TEXT,
  gupshup_template_id VARCHAR(100),
  approved BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- New: Notification logs
CREATE TABLE tenant.notification_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  customer_id UUID,
  jobcard_id UUID,
  event_type VARCHAR(50),
  template_id UUID,
  recipient_phone VARCHAR(15),
  status VARCHAR(20), -- sent, delivered, read, failed
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- New: Tenant notification settings
CREATE TABLE tenant.notification_settings (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE,
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  gupshup_app_name VARCHAR(100),
  gupshup_api_key_encrypted TEXT,
  job_created_enabled BOOLEAN DEFAULT TRUE,
  estimate_ready_enabled BOOLEAN DEFAULT TRUE,
  work_started_enabled BOOLEAN DEFAULT TRUE,
  job_ready_enabled BOOLEAN DEFAULT TRUE,
  payment_received_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications/logs` - Get notification history
- `GET /api/notifications/settings` - Get tenant settings
- `PUT /api/notifications/settings` - Update settings
- `GET /api/notifications/templates` - List templates
- `POST /api/notifications/test` - Send test notification

### 8.4 Integration Architecture

```
┌──────────────────────────────────────────┐
│         WrenchCloud Backend              │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │     Domain Modules                 │ │
│  │  • Job                             │ │
│  │  • Invoice                         │ │
│  │  • Payment (NEW)                   │ │
│  │  • Notification (NEW)              │ │
│  │  • GST (NEW)                       │ │
│  └────────────────────────────────────┘ │
└────────┬─────────────┬────────────┬─────┘
         │             │            │
         ▼             ▼            ▼
  ┌──────────┐  ┌───────────┐  ┌────────────┐
  │ Cashfree │  │  Gupshup  │  │ Supabase   │
  │   API    │  │  WhatsApp │  │ PostgreSQL │
  └──────────┘  └───────────┘  └────────────┘
```

---

## 9. GST Compliance Details

### HSN & SAC Codes Used

**For Services (SAC):**
- `9987` - Motor vehicle repair and maintenance services
- GST Rate: **18%** (9% CGST + 9% SGST for intra-state)

**For Parts (HSN):**
- Auto parts: Various HSN codes based on part type
- GST Rate: **18%** (standard rate for auto parts)

### Invoice Requirements
Every invoice must contain:
1. Garage GSTIN
2. Customer GSTIN (if registered business, B2B)
3. Invoice number (sequential)
4. Invoice date
5. Place of supply
6. HSN/SAC codes for each line item
7. Taxable value
8. GST rate and amount (CGST, SGST, or IGST)
9. Total amount

### Filing Schedule
| Return | Filing Frequency | Due Date | Purpose |
|--------|-----------------|----------|---------|
| GSTR-1 | Monthly | 11th of next month | Report all sales |
| GSTR-3B | Monthly | 20th of next month | Pay tax |
| GSTR-9 | Annual | Dec 31 of next year | Annual summary |

**Note:** Garages with turnover < ₹5 crore can opt for QRMP (Quarterly Return Monthly Payment) scheme.

---

## 10. Payment Integration Details

### Cashfree Integration

**Why Cashfree:**
- 0% fee on UPI (vs Razorpay's 2%)
- T+0 settlements available
- Strong India focus
- Simpler integration

**Supported Payment Methods:**
1. UPI (Google Pay, PhonePe, Paytm) - **0% fee**
2. Debit cards - 2% + GST
3. Credit cards - 2% + GST
4. Net banking - 2% + GST

**Fee Structure:**
- Platform bears: 0% (Cashfree paid by garage owner)
- Tenant charged: Transaction fees passed through
- Example: ₹10,000 UPI payment = ₹0 fee, ₹10,000 credited

### Security
- PCI DSS compliant (via Cashfree)
- Cashfree API keys encrypted in database
- Webhook signature verification mandatory
- TLS 1.2+ for all API calls

---

## 11. WhatsApp Integration Details

### Gupshup Integration

**Why Gupshup:**
- Lower cost than Twilio (₹0.38 vs ₹0.50 per message)
- Better India delivery rates
- Simpler setup process
- Local support

**Message Templates (Pre-approved):**

1. **Job Created**
   ```
   Hi {{1}}, your {{2}} has been checked in. 
   Job number: {{3}}. 
   We'll keep you updated.
   - {{4}} Garage
   ```

2. **Estimate Ready**
   ```
   Hi {{1}}, estimate ready for your {{2}}.
   Amount: ₹{{3}}
   View details: {{4}}
   - {{5}} Garage
   ```

3. **Work Started**
   ```
   Hi {{1}}, work has started on your {{2}}.
   Expected completion: {{3}}
   - {{4}} Garage
   ```

4. **Vehicle Ready**
   ```
   Hi {{1}}, your {{2}} is ready for pickup!
   Amount due: ₹{{3}}
   - {{4}} Garage
   ```

5. **Payment Received**
   ```
   Hi {{1}}, payment received for {{2}}.
   Amount: ₹{{3}}
   Thank you for choosing us!
   - {{4}} Garage
   ```

### Compliance
- Templates must be pre-approved by Meta (1-2 days)
- 24-hour session window for follow-ups
- Opt-out mechanism provided
- No promotional content allowed

---

## 12. Success Metrics (v2)

### GST Module
- **Adoption:** 80% of active tenants enable GST features within 2 months
- **Time Savings:** Average 3 hours saved per month per tenant
- **Accuracy:** 95%+ invoice-to-GST-return match rate
- **Compliance:** Zero late filing fees for tenants using the feature

### Payment Module
- **Adoption:** 60% of payments via digital methods within 3 months
- **Speed:** Average payment collection time reduced from 24h to 5 minutes
- **Volume:** ₹50+ lakh processed monthly across platform
- **Satisfaction:** 90%+ tenant satisfaction with payment experience

### WhatsApp Module
- **Delivery:** 95%+ message delivery rate
- **Call Reduction:** 70% reduction in status inquiry calls
- **Engagement:** 80%+ open rate on WhatsApp notifications
- **Opt-out:** <5% opt-out rate

### Platform Metrics
- **Tenant Growth:** 50+ active tenants by June 2026
- **Retention:** 95%+ retention of v1 tenants upgrading to v2
- **Revenue:** ₹5L+ MRR from subscriptions
- **NPS:** 50+ Net Promoter Score

---

## 13. Release Timeline

### Phase 1: Foundation (Weeks 1-2)
**January 2026**
- Database schema updates
- Cashfree sandbox setup
- Gupshup sandbox setup
- Core domain modules built

### Phase 2: Feature Development (Weeks 3-5)
**February 2026**
- GST report generation
- Payment integration (Cashfree)
- WhatsApp notification system
- UI components
- Testing

### Phase 3: Template Approval (Week 6)
**Late February 2026**
- Submit WhatsApp templates to Meta
- Wait for approval (1-2 days)
- Production credentials from Cashfree

### Phase 4: Beta Testing (Weeks 7-8)
**Early March 2026**
- Deploy to 5 beta tenants
- Monitor real transactions
- Fix bugs and iterate
- Gather feedback

### Phase 5: General Release (Week 9)
**Mid March 2026**
- Roll out to all v1 tenants
- Marketing launch
- Documentation updates
- Onboarding webinars

### Phase 6: Stabilization (Weeks 10-12)
**Late March 2026**
- Monitor metrics
- Fix edge cases
- Performance optimization
- User support

**Target: v2 GA by March 31, 2026**

---

## 14. Pricing Model (v2)

### Subscription Tiers

#### Basic Plan (Existing v1 users)
- ₹1,999/month
- All v1 features
- **NEW:** Basic GST reports (view only)
- **NEW:** Cash payment tracking
- **NEW:** 100 WhatsApp notifications/month

#### Professional Plan (NEW)
- ₹3,999/month
- Everything in Basic
- **NEW:** Full GST filing automation
- **NEW:** Unlimited WhatsApp notifications
- **NEW:** Digital payments (Cashfree)
- **NEW:** Priority support

#### Enterprise Plan (NEW)
- ₹7,999/month (or custom)
- Everything in Professional
- **NEW:** Multi-location (planned v4)
- **NEW:** Custom integrations
- **NEW:** Dedicated account manager
- **NEW:** Custom WhatsApp templates

### Transaction Fees (Pass-through)
- **UPI:** 0% (no fee)
- **Cards:** 2% + GST (Cashfree fee)
- **WhatsApp:** ₹0.38 per message (Gupshup fee)

**Note:** Transaction fees are pass-through—WrenchCloud doesn't mark up.

---

## 15. Risks & Mitigation

### Risk 1: Template Rejection by Meta
**Impact:** Cannot launch WhatsApp features  
**Probability:** Medium  
**Mitigation:**
- Use proven template patterns
- Test thoroughly in sandbox
- Have backup templates ready
- Plan 1-week buffer for approvals

### Risk 2: Payment Integration Bugs
**Impact:** Financial loss, customer dissatisfaction  
**Probability:** Medium  
**Mitigation:**
- Extensive sandbox testing
- Beta phase with known users
- Webhook retry logic
- 24/7 monitoring alerts
- Manual override available

### Risk 3: GST Regulation Changes
**Impact:** Reports become non-compliant  
**Probability:** Low-Medium  
**Mitigation:**
- Follow official GST portal formats
- Monthly compliance review
- CA advisory board
- Rapid update capability

### Risk 4: Low Adoption Rate
**Impact:** Feature doesn't justify development cost  
**Probability:** Low  
**Mitigation:**
- Based on validated pilot feedback
- Free tier for WhatsApp (100 msgs)
- UPI is free (no barrier)
- Strong onboarding & training

### Risk 5: Payment Gateway Downtime
**Impact:** Cannot collect digital payments  
**Probability:** Low  
**Mitigation:**
- Always allow cash option
- Multiple payment methods
- Cashfree has 99.9% uptime SLA
- Clear error messages to users

---

## 16. Dependencies & Prerequisites

### External Dependencies
1. **Cashfree Account**
   - Business KYC approval (2-3 days)
   - Production API credentials

2. **Gupshup Account**
   - WhatsApp Business API approval
   - Template approvals from Meta (1-2 days)

3. **GST Portal Access**
   - No direct integration in v2
   - Tenants need own GSTIN

### Technical Dependencies
1. Supabase database v2.0+
2. Next.js 14+ with App Router
3. Node.js 18+
4. PostgreSQL 14+

### Team Dependencies
1. 2 full-stack developers (6 weeks)
2. 1 QA engineer (4 weeks)
3. 1 CA consultant (ongoing)
4. Product manager (ongoing)

---

## 17. Compliance & Legal

### Data Privacy
- Customer phone numbers encrypted at rest
- Payment data stored per PCI standards (via Cashfree)
- GST data retained for 6 years (as per IT Act)
- Customer opt-out honored within 24 hours

### Financial Compliance
- Not a payment aggregator (using Cashfree)
- Transaction logs maintained
- Audit trail for all financial operations

### GST Compliance
- Reports match official GST portal formats
- HSN/SAC codes from official government sources
- Regular updates as regulations change

---

## 18. Out of Scope (Explicit)

The following are **NOT** included in v2 and are deferred:

### Explicitly Excluded
- Multi-location / multi-garage management
- Mechanic mobile apps
- Customer mobile apps
- Parts inventory management
- Purchase order management
- Vendor management
- Advanced BI/analytics
- Digital Vehicle Inspection checklists
- Appointment/scheduling system
- Customer loyalty programs
- Marketing automation
- CRM features beyond basic contact info

### Deferred to Future Versions
- **v3 (June 2026):**
  - Mechanic app
  - Parts inventory
  - DVI checklists
  
- **v4 (Dec 2026):**
  - Multi-location
  - Advanced analytics
  - Marketing automation

---

## 19. Migration Path (v1 → v2)

### For Existing v1 Tenants

**Phase 1: Automatic Upgrade (No Action Required)**
- GST fields added to all new invoices
- Payment options visible in UI
- WhatsApp settings page available

**Phase 2: Opt-in Configuration**
1. Tenant enables WhatsApp in settings
2. Tenant connects Cashfree account (optional)
3. Tenant configures GST preferences

**Phase 3: Historical Data**
- Existing invoices backfilled with GST data where possible
- Payment history preserved
- No data loss

**Timeline:** Rolling upgrade over 2 weeks in March 2026

---

## 20. Guiding Principles (v2)

### Core Principles (Continuing from v1)
1. **Simplicity over features** - Easy to use > feature-rich
2. **Real workflows over ideal processes** - Match how garages actually work
3. **Data integrity** - Never lose customer or financial data
4. **Multi-tenant by design** - Strict data isolation

### New Principles in v2
5. **Compliance-first** - GST accuracy is non-negotiable
6. **Zero manual reconciliation** - Automation must be trustworthy
7. **Opt-in complexity** - Advanced features are optional
8. **Transparent pricing** - Pass-through costs, no hidden markups

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | ___________ | ___________ | ___________ |
| Engineering Lead | ___________ | ___________ | ___________ |
| Finance/CA Advisor | ___________ | ___________ | ___________ |
| CEO | ___________ | ___________ | ___________ |

---

**End of PRD v2.0**
