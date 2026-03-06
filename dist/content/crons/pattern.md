# Cron Jobs — LaunchFrame Pattern

## Key Rules

- **Single service**: All cron jobs live in `src/jobs/cron.service.ts`. Do NOT create new cron services unless the job is genuinely complex enough to warrant its own service.
- **Lightweight methods**: Cron methods should enqueue work to Bull and return. Never do heavy processing inline.
- `ScheduleModule.forRoot()` is already registered in `app.module.ts` — do not add it again.

## Imports

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
```

## Available CronExpression values

```
CronExpression.EVERY_MINUTE
CronExpression.EVERY_30_MINUTES
CronExpression.EVERY_HOUR
CronExpression.EVERY_DAY_AT_MIDNIGHT
CronExpression.EVERY_WEEK
```

Use a raw cron string (e.g. `'0 9 * * 1-5'`) if no preset fits.

## Example method

```typescript
@Cron(CronExpression.EVERY_HOUR)
async processWebhooks() {
  this.logger.log('Starting webhook processing job...');
  try {
    const items = await this.repo.find({ where: { processed: false } });
    for (const item of items) {
      await this.queue.add({ id: item.id }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    }
  } catch (error) {
    this.logger.error('Error in processWebhooks:', error);
  }
}
```

## Module registration

`CronService` is already a provider in `JobsModule`. If you inject a new queue or repository, add the corresponding `BullModule.registerQueue` / `TypeOrmModule.forFeature` to `JobsModule` imports.
