# Feature Gate System Overview

## Architecture

Features are fully generic and defined in the database — there are no hardcoded feature codes.

| Table | Purpose |
|-------|---------|
| `subscription_plan_features` | Feature definitions: `code`, `name`, `featureType` (boolean/numeric/text), `defaultValue` |
| `subscription_plan_feature_values` | Per-plan feature values: links plan → feature → value (JSONB) |

Features are created and managed via the admin portal. The template ships with a single `basic_access` feature for the free plan as a starting point.

## Querying Features

```typescript
import { UserSubscriptionService } from '../subscriptions/services/user-subscription.service';

// Returns Record<string, any> — keys are feature codes, values are the raw stored value
const features = await this.userSubscriptionService.getCurrentFeatures(userId);

// Example: check a boolean feature
const hasFeature = features['your_feature_code'] === true;

// Example: check a numeric feature (-1 means unlimited)
const limit = features['your_feature_code'] as number ?? 0;
const isUnlimited = limit === -1;
```

## Check Pattern (no decorator — manual check only)

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserSubscriptionService } from '../subscriptions/services/user-subscription.service';

@Injectable()
export class YourService {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  async guardedOperation(userId: number) {
    const features = await this.userSubscriptionService.getCurrentFeatures(userId);

    // Boolean feature
    if (!features['your_boolean_feature']) {
      throw new ForbiddenException('Your plan does not include this feature');
    }

    // Numeric feature with limit
    const limit = features['your_numeric_feature'] as number ?? 0;
    const currentCount = await this.getCount(userId);
    if (limit !== -1 && currentCount >= limit) {
      throw new ForbiddenException(`Plan limit reached (${limit})`);
    }
  }
}
```

## Unlimited Sentinel

For numeric features, `-1` means unlimited. Always check for it:
```typescript
const isUnlimited = limit === -1;
if (!isUnlimited && currentCount >= limit) { ... }
```

## Credits-specific Plan Fields

Monthly credits and overage rate are NOT generic features — they live as dedicated columns on `SubscriptionPlan`:
- `plan.monthlyCredits: number | null` — monthly credit allowance (null = not applicable)
- `plan.overageRate: number | null` — per-credit overage cost (null = no overage)

These are read directly from the subscription, not via `getCurrentFeatures()`.
