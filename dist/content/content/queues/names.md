# Bull Queues

LaunchFrame registers 5 Bull queues via `BullQueueModule` (`src/modules/bull/bull.module.ts`).

| Queue name   | Purpose                                      |
|--------------|----------------------------------------------|
| `emails`     | Transactional email sending via Resend       |
| `api`        | Outbound HTTP API calls to third-party services |
| `webhooks`   | Processing inbound webhook payloads          |

## Usage rules

- **Import `BullQueueModule`** (not `BullModule.forRoot`) in your feature module — it re-uses the shared Redis connection.
- Register the queue in your module with `BullModule.registerQueue({ name: 'queue-name' })`, imported from `bull.module.ts`.
- Inject with `@InjectQueue('queue-name') private queue: Queue` from `@nestjs/bull`.
- Default job options: `{ attempts: 3, backoff: { type: 'exponential', delay: 2000 } }`.
- **Always `throw error`** in processor catch blocks — Bull needs the error to trigger retries.
- Keep cron/scheduler methods lightweight: enqueue to Bull, do heavy work in the processor.
