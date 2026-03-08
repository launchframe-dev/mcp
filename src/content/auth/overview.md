# LaunchFrame Auth Overview

## Guard Architecture

All routes are protected by default via the global `BetterAuthGuard` (registered in `app.module.ts` as `APP_GUARD`).

**Import paths:**
- Decorators: `src/modules/auth/auth.decorator.ts`
- Guard: `src/modules/auth/better-auth.guard.ts`
- Base guard: `src/modules/auth/guards/base-auth.guard.ts`

## Roles

| Role | Description |
|------|-------------|
| `business_user` | Default role for all registered users |
| `superadmin` | Granted via admin panel; full access |
| `customer` | B2B2C variant only — end-customer of the SaaS |

## Session Flow

1. Request hits `BetterAuthGuard`
2. Guard checks for `@AllowAnonymous` / `@OptionalAuth` metadata
3. Calls `auth.api.getSession({ headers })` via Better Auth
4. Rejects `customer` on non-`@CustomerPortal` routes
5. Attaches `request.session` and `request.user`

## Decorators

| Decorator | Effect |
|-----------|--------|
| `@AllowAnonymous()` | Route is fully public — no auth check |
| `@Public()` | Alias for `@AllowAnonymous()` |
| `@OptionalAuth()` | Auth checked but not required; `request.user` may be undefined |
| `@CustomerPortal()` | Allows `customer` role (B2B2C variant) |
| `@UserSession()` | Param decorator — injects the `User` from session |
| `@Session()` | Param decorator — injects full `{ user, session }` object |

## Example Usage

```typescript
import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous, UserSession } from '../auth/auth.decorator';
import { User } from '../users/user.entity';

@Controller('example')
export class ExampleController {
  // Public — no auth
  @Get('public')
  @AllowAnonymous()
  getPublic() { ... }

  // Protected (default) — business_user or superadmin
  @Get('me')
  getMe(@UserSession() user: User) { ... }
}
```

## Better Auth Setup

Better Auth instance: `src/modules/auth/auth.ts`
- Adapts to TypeORM via `betterAuthTypeOrmAdapter`
- Plugins: email/password, Google OAuth, API keys, admin
- Session stored in `sessions` table; user in `user` table (Better Auth schema)
