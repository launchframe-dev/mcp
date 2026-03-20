# LaunchFrame Architecture Overview

## Services

| Service | Tech | Purpose |
|---------|------|---------|
| `backend` | NestJS + TypeORM + PostgreSQL | Core API, auth, billing, webhooks, queues |
| `admin-portal` | React + RTK Query + MUI | Internal admin UI (manage users, plans, features) |
| `website` | Next.js App Router | Public-facing marketing site and pricing page |
| `customers-portal` | React + Zustand | End-customer portal (B2B2C variant only) |
| `infrastructure` | Docker Compose | Orchestrates all services on a single VPS |

All services share a single centralized `.env` file at the repo root.

---

## Backend Module Layout (`backend/src/`)

### `src/core/` — Infrastructure & cross-cutting concerns

| Module | Path | Responsibility |
|--------|------|----------------|
| Auth | `core/auth/` | Better Auth setup, session management, role guards |
| Admin | `core/admin/` | Admin-only controllers and services |
| Billing | `core/billing/` | Monetization config, plan resolution |
| Mail | `core/mail/` | Email templates and sending |
| Webhooks | `core/webhooks/` | Webhook receipt, signature validation, retry queue |
| Queues | `core/queues/` | Bull queue definitions and shared infrastructure |
| Guards | `core/guards/` | `JwtAuthGuard`, `RolesGuard`, `ProjectOwnershipGuard` |
| Users | `core/users/` | User entity, user service |
| Subscriptions | `core/subscriptions/` | Subscription plans, user subscription state |
| Credits | `core/credits/` | Credit balance, deduction, Polar.sh integration |
| Payments | `core/payments/` | Payment event processing |
| Jobs | `core/jobs/` | Scheduled cron jobs |

### `src/domain/` — Feature modules (product-specific)

Business logic lives here. Each feature is a self-contained NestJS module. In multi-tenant projects, `domain/projects/` manages workspace/project isolation.

---

## Key Patterns

### Webhook Architecture
- **Receipt**: thin controller at `core/webhooks/` validates signature and enqueues raw payload
- **Processing**: a Bull processor handles the event asynchronously — decoupled from HTTP layer
- Automatic retry on failure via Bull

### Bull Queues
- Queue names defined in `core/queues/queue-names.ts`
- Producers inject the queue token from `@nestjs/bull`
- Processors decorated with `@Processor(QUEUE_NAME)` in `core/queues/processors/` or domain modules

### Auth (Better Auth)
- Standard business users: `/api/auth/*`, cookie prefix `session_`
- B2B2C customer users: `/api/auth/customer`, cookie prefix `customer_`
- Role-based access: `@Roles(UserRole.ADMIN)` + `RolesGuard`

### Credits System
- Balance stored on user record, deducted atomically
- `CreditsService` exposes `deduct(userId, amount, reason)` and `add(userId, amount, reason)`
- Tied to Polar.sh for top-up purchases

### Subscriptions
- Plans defined in DB (`SubscriptionPlan` entity), synced from Polar.sh
- `UserSubscriptionService` resolves the active plan for a user
- Feature gates check plan entitlements at runtime

---

## Frontend Layout

### `admin-portal`
- React SPA served by Nginx in production
- State: RTK Query for server data, Redux for UI state
- UI: Material UI (MUI) component library
- Routes defined in `src/admin/pages/`, API calls in `src/admin/api/`

### `website`
- Next.js App Router (React Server Components by default)
- Pricing page at `src/app/pricing/` reads plans from backend
- Static-first with selective client components

### `customers-portal` (B2B2C only)
- React SPA, similar structure to admin-portal
- State: Zustand for lightweight client state
- Authenticates against the customer auth endpoint

---

## Infrastructure

- **Single Docker Compose** at `infrastructure/docker-compose.yml` — all services on one VPS ($7–20/mo)
- **PostgreSQL 16** — primary database, one DB shared by all services
- **Redis 7** — Bull queue backend, session store
- **Nginx** — reverse proxy, serves frontend SPAs, routes `/api/*` and `/admin/*` to backend
- **Centralized `.env`** — one file at repo root, bind-mounted into all containers

---

## API Surface

| Prefix | Handler | Auth |
|--------|---------|------|
| `/api/auth/*` | Better Auth (business users) | None (public auth endpoints) |
| `/api/auth/customer` | Better Auth (customers, B2B2C) | None |
| `/api/v1/*` | NestJS controllers | JWT / session cookie |
| `/admin/*` | NestJS admin controllers | Admin role required |

---

## `.launchframe` File

Located at the project root. Contains project metadata and controls variant selection:

```json
{
  "projectName": "my-saas",
  "services": ["backend", "admin-portal", "website"],
  "variants": {
    "tenancy": "single-tenant | multi-tenant",
    "userModel": "b2b | b2b2c"
  }
}
```

Agents should read this file to determine which variant-specific patterns apply. See `variant_get_overview` for details.
