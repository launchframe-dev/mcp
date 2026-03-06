# Webhook Architecture

LaunchFrame uses a **receipt/processing separation** pattern for all inbound webhooks.

## Flow

```
Webhook Provider → Controller (receipt) → WebhookLog (DB) → Bull queue → Processor (processing)
                                                         ↑
                                             Cron retries failed jobs
```

## 1. Controller (Receipt Layer)

The controller saves the raw payload and returns 200 **immediately** — never process inline.

```typescript
import { Controller, Post, Req, Res } from '@nestjs/common';
import { Public } from '../auth/auth.decorator';
import { UseGuards } from '@nestjs/common';
import { PolarWebhookGuard } from './guards/polar-webhook.guard';

@Controller('webhooks')
export class WebhooksController {
  @Post('polar')
  @Public()
  @UseGuards(PolarWebhookGuard)
  async handlePolar(@Req() req: Request, @Res() res: Response): Promise<void> {
    // Save raw payload to WebhookLog, enqueue to 'webhooks' Bull queue
    res.status(200).send(); // Always return 200 immediately
  }
}
```

## 2. WebhookLog Entity

Fields: `provider` (enum: POLAR | PAYPAL | STRIPE), `eventType`, `webhookId`, `payload` (jsonb),
`headers` (jsonb), `processed` (bool, default false), `retryCount` (int, default 0), `processingError`.

## 3. Processor (Processing Layer)

A Bull processor on the `webhooks` queue handles the actual logic. Always `throw error` in catch blocks.

## 4. Retry Cron

`CronService` runs `EVERY_HOUR`, fetches up to 100 `WebhookLog` records where `processed=false AND retryCount < 5`,
and re-enqueues them to the `webhooks` Bull queue (which has its own 3-attempt exponential backoff).
App-level max retries: **5** (enforced by the cron filter).

## Guards

- `PolarWebhookGuard` — validates Polar webhook signature
- Add equivalent guards for other providers (PayPal, Stripe) as needed
