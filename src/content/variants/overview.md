# LaunchFrame Variants

LaunchFrame projects are generated in one of several variants. **By the time an agent reads this file, the CLI has already run and baked the variant-specific code into the project.** Section markers no longer exist — the code is already the final form for the chosen variant.

## Determining the Active Variant

Read the `.launchframe` file in the project root:

```json
{
  "variants": {
    "tenancy": "single-tenant | multi-tenant",
    "userModel": "b2b | b2b2c"
  }
}
```

Do not rely on environment variables — `.launchframe` is the authoritative source.

---

## Variant Descriptions

### Base (B2B single-tenant)

`tenancy: "single-tenant"`, `userModel: "b2b"`

The simplest variant. One admin panel, one backend, no project isolation, no end-customer layer.

- No `projectId` on entities
- No `ProjectsModule`, no `ProjectOwnershipGuard`
- Roles: `admin`, `user` only
- No `customers-portal` service

### Multi-tenant

`tenancy: "multi-tenant"`

Extends Base by adding workspace/project isolation.

- All domain entities have a `projectId: number` column
- All project-scoped routes use `ProjectOwnershipGuard` (`src/core/guards/project-ownership.guard.ts`)
- API client sends `X-Project-Id` header on every request
- `ProjectsModule` exists at `src/domain/projects/`
- Admin portal has a project selector in the sidebar

**When writing new code for a multi-tenant project:**
- Add `@Column() projectId: number;` to new domain entities
- Apply `@UseGuards(ProjectOwnershipGuard)` to project-scoped controllers
- Filter all DB queries by `projectId`

### B2B2C

`userModel: "b2b2c"`

Extends Base by adding a separate end-customer layer (end-users of your customers).

- `UserRole` enum includes `CUSTOMER` (`UserRole.CUSTOMER`)
- Customers authenticate at `/api/auth/customer` — a separate Better Auth instance with `customer_` cookie prefix
- `UserBusiness` entity links businesses to their customers
- `customers-portal` service is deployed alongside `admin-portal` and `website`
- Admin portal has a `/users` route for managing end customers
- Sessions have a `tenant_id` column for customer isolation

**When writing new code for a B2B2C project:**
- Use `@CustomerPortal()` decorator on customer-only endpoints
- Guard customer routes with the customer auth instance, not the standard one
- Do not mix business-user sessions with customer sessions

### B2B2C + Multi-tenant

Both patterns above apply simultaneously. New code must satisfy both sets of constraints.

---

## Default Assumption

If `.launchframe` is absent or unreadable, default to **Base** (single-tenant B2B) and ask the user to confirm.
