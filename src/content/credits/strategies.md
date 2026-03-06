# Credits Monetization Strategies

The active strategy is stored in `AdminSettings` and cached for 24h in Redis via `MonetizationConfigService`.

## Strategies

| Strategy | Behaviour |
|----------|-----------|
| `free` | All credit checks bypass — no deduction ever |
| `subscription` | Credit checks bypass — use feature gates to restrict instead |
| `credits` | Deduct `n` credits from user balance; 402 if insufficient |
| `hybrid` | Deduct from `subscription.plan.monthlyCredits` allowance first; bill Polar overage when exhausted |

## Hybrid details

- Monthly allowance: `subscription.plan.monthlyCredits` (column on `SubscriptionPlan` entity, NOT a feature code)
- Overage rate: `subscription.plan.overageRate` (column on `SubscriptionPlan` entity)
- Overage is charged via Polar meter API

## Choosing a strategy

- **SaaS with flat plans** → `subscription` (gates control feature access, no per-call cost)
- **API / AI product** → `credits` (pay-as-you-go balance)
- **AI + subscription tiers** → `hybrid` (included monthly quota + Polar overage billing)
- **Early stage / free tier** → `free` (disable all metering)
