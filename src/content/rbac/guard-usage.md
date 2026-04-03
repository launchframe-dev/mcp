# PermissionGuard Usage

## When to apply

Use `@RequiresPermission()` on any route that a team member might not have access to. Do NOT apply it to routes that should be universally accessible to all authenticated business users.

## Owner bypass

```typescript
if (user.isOwner) return true; // PermissionGuard short-circuits here
```

The owner never hits the DB. `isOwner` is set at registration and is immutable.

## Cache invalidation

Permissions are cached per `(userId, projectId?)` for 1 hour.

The cache is invalidated automatically when:
- A member is removed (`TeamService.removeMember`)
- An invitation is accepted (`TeamService.attachMember`)

**If you modify `user_role_assignments` directly** (e.g. in a custom migration or admin tool), invalidate manually:

```typescript
await this.cache.del(`rbac:${userId}`);              // single-tenant
await this.cache.del(`rbac:${userId}:global`);        // multi-tenant global scope
await this.cache.del(`rbac:${userId}:${projectId}`);  // multi-tenant project scope
```

## Multi-tenant scope

In the `rbac_multi-tenant` variant, `PermissionGuard` resolves `projectId` from:
1. `x-project-id` request header
2. `:projectId` route param

Assignments with `project_id IS NULL` match all projects (global role). Project-specific assignments only match when `project_id = :projectId`.

## Example patterns

```typescript
// Global permission — any project
@RequiresPermission(Permission.BILLING_VIEW)
@Get('billing')
getBilling() { ... }

// Per-project permission (multi-tenant only)
@RequiresPermission(Permission.PROJECTS_MANAGE)
@Put('projects/:projectId/settings')
updateProjectSettings(@Param('projectId') projectId: string) { ... }

// Owner-only (no decorator needed — just check in handler)
@Get('team')
listTeam(@UserSession() user: User) {
  if (!user.isOwner) throw new ForbiddenException();
  // ...
}
```
