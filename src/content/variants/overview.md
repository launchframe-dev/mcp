# LaunchFrame Variants

LaunchFrame generates projects in one of three variants. Each variant is a superset of the previous.

## Variant Overview

### Base (B2B, single-tenant)
The simplest variant. One admin panel, one customer-facing portal, no multi-tenancy.
- Single workspace per account
- No `projectId` on entities
- No `projects` module
- Roles: `admin`, `user`

### Multi-tenant
Extends Base by adding workspace/project isolation.
- `projects` module: CRUD, ownership guards
- `projectId: number` column on all domain entities
- Project ownership guard on all project-scoped routes
- Roles: `admin`, `user` (scoped to project)

### B2B2C
Extends Base by adding a separate customer-facing experience (end-users of your customers).
- Adds `customer` role
- Adds `customers-portal` frontend service
- Adds `@CustomerPortal()` route decorator for customer-only endpoints
- B2B2C can also be combined with multi-tenancy

## Section Marker Syntax

Source files use markers so the CLI can strip/inject variant-specific code blocks:

```
// {{SECTION_NAME}}_START
... variant-specific code ...
// {{SECTION_NAME}}_END
```

Common section names:
- `MULTI_TENANT_FIELDS` — `projectId` columns on entities
- `MULTI_TENANT_GUARD` — project ownership guard imports/decorators
- `CUSTOMER_PORTAL_ROUTES` — B2B2C customer route blocks

The CLI strips sections that don't apply to the chosen variant and removes the markers from kept sections.

## Coding Guidelines per Variant

### When writing entities
- **Base**: no `projectId`
- **Multi-tenant**: add `@Column() projectId: number;` wrapped in `// MULTI_TENANT_FIELDS_START` / `_END`

### When writing controllers
- **Multi-tenant**: add project ownership guard
  ```typescript
  // MULTI_TENANT_GUARD_START
  @UseGuards(ProjectOwnershipGuard)
  // MULTI_TENANT_GUARD_END
  ```
- **B2B2C**: wrap customer-only routes with `@CustomerPortal()` and section markers

### When scaffolding modules
- Use section markers for any variant-specific imports, providers, or route decorators
- Keep the base code path clean — markers are additive

## Which Variant to Target

When writing code for a LaunchFrame project, check the project's `VARIANT` env var or ask the user.
Default assumption: **Base** (single-tenant B2B) unless told otherwise.
