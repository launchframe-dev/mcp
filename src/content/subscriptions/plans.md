# Subscription Plans System

## Overview

LaunchFrame supports two billing modes:

1. **Simple (monthly only)** — default; each plan is a single Polar product billed monthly.
2. **Annual billing** — opt-in; plans are paired into "plan groups" (one monthly + one annual Polar product per tier).

Polar has no built-in product variants, so annual billing requires two separate products per paid tier, grouped together by LaunchFrame.

---

## Enabling Annual Billing

Admin → Monetization → Strategy → toggle **"Enable Annual Billing"**.

This is stored as a `monetization_settings` row with key `annual_billing_enabled`.
Service: `backend/src/core/billing/services/monetization-config.service.ts` → `isAnnualBillingEnabled()`

---

## `GET /subscriptions/plans` — Response Shape

The response shape depends on whether annual billing is enabled.

### Annual billing disabled

```json
{
  "annualBillingEnabled": false,
  "plans": [
    {
      "id": 1,
      "name": "Free",
      "code": "free",
      "price": "0.00",
      "billingInterval": "monthly",
      "featureValues": [...]
    },
    {
      "id": 2,
      "name": "Pro",
      "code": "pro",
      "price": "29.00",
      "billingInterval": "monthly",
      "featureValues": [...]
    }
  ]
}
```

### Annual billing enabled

```json
{
  "annualBillingEnabled": true,
  "groups": [
    {
      "id": 1,
      "name": "Free",
      "code": "free",
      "description": "...",
      "sortOrder": -1,
      "monthlyPlan": { ...planFields, "featureValues": [...] },
      "annualPlan":  { ...planFields, "featureValues": [...], "monthlyEquivalent": 0, "savingsPercent": 0 },
      "featureValues": [...]
    },
    {
      "id": 2,
      "name": "Pro",
      "code": "pro",
      "description": "...",
      "sortOrder": 1,
      "monthlyPlan": { ...planFields, "price": "29.00", "billingInterval": "monthly", "featureValues": [...] },
      "annualPlan":  { ...planFields, "price": "278.00", "billingInterval": "yearly", "featureValues": [...], "monthlyEquivalent": 23.17, "savingsPercent": 20 },
      "featureValues": [...]
    }
  ]
}
```

### `PlanGroup` shape

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Group ID (or free plan ID for synthetic group) |
| `name` | string | Display name |
| `code` | string | Identifier slug |
| `description` | string \| null | Marketing copy |
| `sortOrder` | number | Display order (`-1` for free plan) |
| `monthlyPlan` | Plan | Monthly billing variant |
| `annualPlan` | Plan & extras | Annual billing variant |
| `annualPlan.monthlyEquivalent` | number | `annualPrice / 12` |
| `annualPlan.savingsPercent` | number | `round((1 - monthlyEquivalent / monthlyPrice) * 100)` |
| `featureValues` | array | Copied from `monthlyPlan.featureValues` |

### Free plan (synthetic group)

The free plan (`price === 0`) is not stored in `subscription_plan_groups`. When annual billing is enabled, it is prepended as a synthetic group entry with:
- The same plan object in both `monthlyPlan` and `annualPlan` slots
- `monthlyEquivalent: 0`, `savingsPercent: 0`
- `sortOrder: -1` (always first)

---

## Plan Groups — Admin Workflow

Admin UI: **Admin → Monetization → Plans → Plan Groups** tab
Page: `admin-portal/src/admin/pages/MonetizationPlans.tsx`

### Creating a plan group

1. Click **New Group** → fill in name, code, description, sort order.
2. Click **Assign Plans** → select exactly one monthly plan and one annual plan for this tier.

### Activation validation

When activating a group (toggling it active), the backend validates:
- Group has exactly **1 monthly plan** assigned.
- Group has exactly **1 annual plan** (billing interval `yearly`) assigned.
- `annualPrice / 12 < monthlyPrice` — annual must be cheaper per month than monthly.

Validation is in: `backend/src/core/admin/services/monetization-admin.service.ts`

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/core/subscriptions/services/user-subscription.service.ts` | `findAllPlans()` — builds the grouped/flat response |
| `backend/src/core/admin/services/monetization-admin.service.ts` | Plan group CRUD + activation validation |
| `backend/src/core/billing/services/monetization-config.service.ts` | `isAnnualBillingEnabled()` |
| `backend/src/core/subscriptions/entities/subscription-plan-group.entity.ts` | `SubscriptionPlanGroup` entity |
| `admin-portal/src/admin/pages/MonetizationPlans.tsx` | Plan Groups UI (Groups tab) |
| `admin-portal/src/admin/components/PlanGroupModal.tsx` | Create/edit group modal |
| `admin-portal/src/admin/components/AssignPlanGroupModal.tsx` | Assign plans to group modal |
| `admin-portal/src/pages/SubscriptionPlans.tsx` | User-facing plans page (monthly/annual toggle) |
| `website/src/app/pricing/PricingClient.tsx` | Website pricing page (monthly/annual toggle) |

---

## Database Tables

**`subscription_plan_groups`**

| Column | Description |
|--------|-------------|
| `id` | Primary key |
| `name` | Display name |
| `code` | Unique slug |
| `description` | Marketing copy |
| `sort_order` | Display order |
| `is_active` | Whether group is active |

**`subscription_plans`** (extended)

| Column | Description |
|--------|-------------|
| `plan_group_id` | FK → `subscription_plan_groups.id` (nullable) |
| `billing_interval` | `'monthly'` \| `'yearly'` |
