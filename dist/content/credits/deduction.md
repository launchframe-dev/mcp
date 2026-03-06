# Credits Deduction Pattern

Add `@DeductCredits(n)` + `@UseGuards(CreditsGuard)` to any route that should cost credits.

```typescript
import { UseGuards } from '@nestjs/common';
import { CreditsGuard } from '../credits/guards/credits.guard';
import { DeductCredits } from '../credits/decorators/deduct-credits.decorator';

@DeductCredits(10)
@UseGuards(CreditsGuard)
@Post('ai-operation')
async handler(@UserSession() user: User) {
  // CreditsGuard runs before the handler and deducts based on monetization strategy
  // Handler only runs if credits check passes
}
```

## Rules

- **Both** `@DeductCredits(n)` and `@UseGuards(CreditsGuard)` are required together — neither works alone.
- `n` is the number of credits to deduct per call.
- `CreditsGuard` reads the active monetization strategy from `MonetizationConfigService` (cached 24h in Redis).
- The guard behaviour depends on strategy (see `credits_get_monetization_strategies`).
- Source files:
  - `src/modules/credits/decorators/deduct-credits.decorator.ts`
  - `src/modules/credits/guards/credits.guard.ts`
