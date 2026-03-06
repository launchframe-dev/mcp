import { z } from 'zod';
import { loadContent } from '../lib/content.js';
export function registerAuthTools(server) {
    server.tool('auth_get_overview', 'Get full auth system overview: guard hierarchy, session flow, Better Auth setup, roles, and decorator system.', {}, async () => ({
        content: [{ type: 'text', text: loadContent('auth/overview.md') }],
    }));
    server.tool('auth_get_decorator_usage', 'Get the exact decorator and import for a specific auth need.', {
        need: z.enum([
            'public',
            'optional',
            'customer_portal',
            'admin_only',
            'current_user',
            'full_session',
        ]).describe('The auth need for the route'),
    }, async ({ need }) => {
        const map = {
            public: `// No authentication required
import { AllowAnonymous } from '../auth/auth.decorator';

@AllowAnonymous()
@Get('route')
handler() { ... }`,
            optional: `// Auth is checked but not required — user may be undefined
import { OptionalAuth, UserSession } from '../auth/auth.decorator';
import { User } from '../users/user.entity';

@OptionalAuth()
@Get('route')
handler(@UserSession() user?: User) { ... }`,
            customer_portal: `// Accessible by regular_user role (B2B2C variant only)
// Without this decorator, regular_user gets 401
import { CustomerPortal, UserSession } from '../auth/auth.decorator';
import { User } from '../users/user.entity';

@CustomerPortal()
@Get('route')
handler(@UserSession() user: User) { ... }`,
            admin_only: `// Admin-only access: superadmin role only.
// Admin routes are separated by the /admin/* prefix with AdminGuard (applied globally via RouterModule).
// For a superadmin check on a non-admin route, guard manually in the handler:
import { UserSession } from '../auth/auth.decorator';
import { User } from '../users/user.entity';
import { ForbiddenException } from '@nestjs/common';

@Get('route')
handler(@UserSession() user: User) {
  if (user.role !== 'superadmin') throw new ForbiddenException();
  ...
}`,
            current_user: `// Inject the current authenticated user
import { UserSession } from '../auth/auth.decorator';
import { User } from '../users/user.entity';

@Get('route')
handler(@UserSession() user: User) {
  // user.id, user.email, user.role, etc.
}`,
            full_session: `// Inject the full Better Auth session (user + session metadata)
import { Session } from '../auth/auth.decorator';

@Get('route')
handler(@Session() session: { user: any; session: any }) {
  const { user, session: sessionData } = session;
}`,
        };
        return {
            content: [{ type: 'text', text: map[need] ?? `Unknown need: ${need}` }],
        };
    });
    server.tool('auth_get_guard_usage', 'Get the guard class, import path, and decorator combo for a specific guard type.', {
        guard: z.enum(['admin', 'business_user', 'credits']).describe('The guard to look up'),
    }, async ({ guard }) => {
        const map = {
            admin: `// AdminGuard — applied globally to all /admin/* routes via RouterModule.
// Source: src/modules/admin/guards/admin.guard.ts
// You do NOT need to add @UseGuards(AdminGuard) manually on admin controllers.
// The admin router config registers it globally for the admin route prefix.
// Checking inside: verifies user.role === 'superadmin'`,
            business_user: `// BetterAuthGuard — the global default guard (all routes).
// Source: src/modules/auth/better-auth.guard.ts
// Applied globally in app.module.ts as APP_GUARD.
// Allows: business_user, superadmin
// Blocks: unauthenticated, regular_user (unless @CustomerPortal())
// You never need to add this manually.`,
            credits: `// CreditsGuard — deducts credits per request based on @DeductCredits(n).
// Source: src/modules/credits/guards/credits.guard.ts
// MUST be combined with @DeductCredits(n) decorator.
import { UseGuards } from '@nestjs/common';
import { CreditsGuard } from '../credits/guards/credits.guard';
import { DeductCredits } from '../credits/decorators/deduct-credits.decorator';

@DeductCredits(10)
@UseGuards(CreditsGuard)
@Post('ai-operation')
handler() { ... }

// Strategy behaviour (read from AdminSettings, cached 24h in Redis):
// - free:         bypass (no deduction)
// - subscription: bypass (use feature gates instead)
// - credits:      deduct from balance
// - hybrid:       deduct from monthly allowance first, then Polar overage`,
        };
        return {
            content: [{ type: 'text', text: map[guard] ?? `Unknown guard: ${guard}` }],
        };
    });
}
