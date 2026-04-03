# LaunchFrame RBAC Overview

## Variant axis

RBAC is an init-time choice: `permissions: basic | rbac`. Generated projects either have the full system or none of it. No migration path is provided between the two.

Config in `.launchframe`:
```json
{ "variants": { "permissions": "rbac" } }
```

## Actors

| Actor | Description |
|-------|-------------|
| **Superadmin** | Defines permissions and roles in `/admin/roles` + `/admin/permissions` |
| **Owner** | The business_user who registered first. `isOwner = true`. Bypasses all `PermissionGuard` checks. |
| **Team member** | Added by owner via invitation. `isOwner = false`. Subject to `PermissionGuard`. |
| **Customer** | Unaffected by RBAC (B2B2C only). Governed by `user_businesses` + `BusinessScopingGuard`. |

## Data model

- `permissions` — atomic definitions seeded from `Permission` enum on boot
- `roles` — bundles of permissions, defined by superadmin
- `role_permissions` — many-to-many join
- `user_role_assignments` — which roles a team member has (optionally scoped to a project in multi-tenant)
- `team_invitations` — pending invitations with token + assignments JSONB

Users table additions (RBAC variant only):
- `is_owner boolean` — true for owner, false for team members
- `business_id integer` — team member's owner user id

## Default seeded roles

| Role | Permissions |
|------|-------------|
| `admin` | All system permissions |
| `member` | billing:view, settings:view, projects:view |

## Guard evaluation order

```
BetterAuthGuard → PermissionGuard
```

PermissionGuard self-deactivates on routes without `@RequiresPermission()`.
Owner always passes (`isOwner` bypass). Team members have permissions checked via DB + 1hr cache.
