# Adding a New Permission

## 4-step workflow

### 1. Declare in the enum

File: `src/core/auth/permissions.enum.ts`

```typescript
export enum Permission {
  // ... existing
  VULNERABILITY_CREATE = 'vulnerability:create',
}
```

### 2. Restart the app

`PermissionsSeeder.onModuleInit()` upserts all enum entries into the `permissions` table automatically. Safe to re-run.

### 3. Superadmin assigns to a role

In the admin portal at `/admin/roles`, edit a role and check the new permission.

### 4. Protect the route

```typescript
import { RequiresPermission } from '@core/auth/decorators/requires-permission.decorator';
import { Permission } from '@core/auth/permissions.enum';

@RequiresPermission(Permission.VULNERABILITY_CREATE)
@Post('vulnerabilities')
async createVulnerability(@UserSession() user: User, @Body() dto: CreateVulnerabilityDto) {
  // owner always passes; team members need this permission assigned
}
```

No `@UseGuards()` needed — `PermissionGuard` is globally registered in `AuthModule`.

## String fallback

There is none. All permissions must be declared in the enum. This enforces type safety and ensures the MCP tooling stays accurate.
