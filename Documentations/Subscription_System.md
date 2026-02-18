# Subscription System & Entitlements Documentation

## Overview

Machnix (WrenchCloud) utilizes a hybrid subscription model combining fixed tiers with **Entitlement Management** and **Pay-As-You-Go (PAYG)** capabilities. This architecture decouples "Subscription State" (stored in the database) from "Entitlement Rules" (defined in code), allowing for flexible feature gating, manual overrides, and granular usage tracking.

The system is built to scale from solo workshops to large enterprise chains with automated and manual billing workflows.

---

## Subscription Tiers

### 1. Basic (Starter)

* **Target**: Single-mechanic garages or solo operators.
* **Price**: ₹999/mo
* **Limits**:
* **Jobs**: 70 per month
* **WhatsApp**: 0
* **Digital Payments**: Not included (Cash/Manual only)



### 2. Professional (Growth)

* **Target**: Mid-sized workshops focused on automation.
* **Price**: ₹2,499/mo
* **Limits**:
* **Jobs**: 500 per month
* **WhatsApp**: 100 messages
* **Digital Payments**: Enabled (Cashfree/razorpay integration)
* **GST Automation**: Full filing and tax reports



### 3. Enterprise (Brand)

* **Target**: Multi-branch premium chains.
* **Price**: ₹5,499/mo (Base) + **Pay-As-You-Go**
* **Formula**: `Total Bill = Base_Fee + (Overage_Jobs * Job_Rate) + Third_Party_Costs`
* **Key Features**:
* **WhatsApp**: Unlimited (Pay As You Go)
* **Jobs**: Unlimited (Metered billing per job card)
* **Multi-Location**: Management of multiple branches (v4+)
* **Custom Branding**: Brand-specific customer portals



---

## Technical Implementation: Entitlement Management

The core philosophy is **State in DB, Rules in Code**.

### 1. Configuration (`src/config/subscriptions.ts`)

This is the **Single Source of Truth** for what a plan *means*. Storing limits here instead of DB columns prevents "black hole" tables and avoids complex migrations for simple plan updates.

```typescript
export const PLAN_LIMITS = {
  basic: {
    maxJobs: 100,
    hasGstAutomation: false,
    monthlyPrice: 1999
  },
  pro: {
    maxJobs: 500,
    hasGstAutomation: true,
    monthlyPrice: 3999
  },
  enterprise: {
    maxJobs: Infinity,
    payAsYouGo: true,
    monthlyPrice: 7999
  }
} as const;

```

### 2. Overrides & Top-ups (`tenant.subscription_overrides`)

To support manual admin extensions or user "top-ups" (e.g., buying 50 extra job cards), the system uses an **Override Ledger**.

* **Logic**: When checking a limit, the system calculates: `Tier_Limit + Sum(Active_Overrides) - Current_Usage`.
* **Manual Extension**: Admins can extend a specific tenant's job count or expiry date via the `(admin)` dashboard without changing their global tier.

### 3. Database State (`tenant.tenants`)

The database tracks the specific state of a tenant's subscription:

* `subscription_tier`: enum ('basic', 'pro', 'enterprise')
* `subscription_start_at` / `subscription_end_at`: Validity period
* `grace_period_ends_at`: Time allowed after expiration before hard lockout
* `custom_price`: Override for enterprise clients

---

## Financial Logic & Upgrades

### Upgrade Proration

When a user upgrades from **Basic** to **Pro** mid-cycle, the system applies the following logic:

1. **Price Difference**: `Pro_Price - Basic_Price` (e.g., ₹2,000).
2. **Loyalty Discount**: A 5% discount is applied to the upgrade difference for that month, and the same price after that.
3. **Invoice Generation**: A new invoice is created in `tenant.invoices` for the prorated amount, ensuring a clear audit trail for GST reporting.

### Usage Metering

Usage is tracked in real-time via the `tenant.monthly_analytics` table.

* **Counters**: `total_jobs`, `total_revenue`, and `notification_logs` (for WhatsApp).
* **Hard Lock**: Resource creation (like job cards) is blocked at the API level if `Usage >= (Tier_Limit + Top-ups)`.
* **Soft Lock**: During the grace period, users see an `UnpaidWarningDialog` but retain read/write access.

---

## Admin Management Interface

The Admin dashboard (`/admin/tenants`) provides tools for manual subscription intervention:

* **Usage Progress Bars**: Displays `Used / (Total + Override)` for jobs and WhatsApp.
* **Manual Overrides UI**: A dedicated form for platform admins to:
* Grant extra job credits for a specific month.
* Manually extend an expiry date (useful for offline payment collection).
* Set custom pricing for enterprise contracts.


* **Impersonation**: Admins can use the `/api/admin/impersonate` flow to view the tenant's dashboard exactly as they see it, helping debug entitlement issues.

---

## Edge Cases & Reliability

* **The Double-Spend Protection**: The backend uses database transactions with "Check-and-Increment" logic to prevent exceeding limits when multiple mechanics create jobs simultaneously.
* **Deletion Integrity**: Counters track total resources *created* in a billing period, not just *current* ones. This prevents users from staying under limits by deleting old records.
* **Timezone Safety**: All subscription expirations are stored and calculated in **UTC** to maintain consistency across different regional branches.
* **Prorated Credits**: If a user has an active "WhatsApp Top-up" and upgrades to a tier with "Unlimited WhatsApp," the unused portion of the top-up can be credited toward the new subscription fee.
