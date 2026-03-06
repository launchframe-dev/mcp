import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadContent } from '../lib/content.js';

const PROVIDERS = ['POLAR', 'PAYPAL', 'STRIPE'] as const;
type Provider = typeof PROVIDERS[number];

export function registerWebhookTools(server: McpServer): void {
  server.tool(
    'webhook_get_architecture',
    'Get an overview of the LaunchFrame webhook architecture: receipt/processing separation, WebhookLog entity, Bull queue, and retry cron.',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('webhooks/architecture.md') }],
    })
  );

  server.tool(
    'webhook_scaffold_handler',
    'Get a scaffold for a new webhook handler: controller receipt + Bull processor for a given provider and event type.',
    {
      provider: z
        .enum(PROVIDERS)
        .describe('The webhook provider (POLAR, PAYPAL, or STRIPE)'),
      eventType: z
        .string()
        .describe('The event type string from the provider (e.g. "subscription.created", "order.paid")'),
    },
    async ({ provider, eventType }: { provider: Provider; eventType: string }) => {
      const providerLower = provider.toLowerCase();
      const providerPascal = provider.charAt(0) + provider.slice(1).toLowerCase();
      const guardName = `${providerPascal}WebhookGuard`;
      const processorClass = `${providerPascal}WebhooksProcessor`;
      const jobName = eventType;

      const snippet = `// ─── Controller (receipt — already exists for POLAR, add for other providers) ───
// File: src/modules/webhooks/controllers/${providerLower}-webhooks.controller.ts

import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../../auth/auth.decorator';
import { ${guardName} } from '../guards/${providerLower}-webhook.guard';
import { WebhookLog, WebhookProvider } from '../entities/webhook-log.entity';

@Controller('webhooks')
export class ${providerPascal}WebhooksController {
  constructor(
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
    @InjectRepository(WebhookLog) private readonly webhookLogRepo: Repository<WebhookLog>,
  ) {}

  @Post('${providerLower}')
  @Public()
  @UseGuards(${guardName})
  async handle(@Req() req: any, @Res() res: any): Promise<void> {
    const log = this.webhookLogRepo.create({
      provider: WebhookProvider.${provider},
      eventType: req.body?.type ?? 'unknown',
      webhookId: req.body?.id ?? null,
      payload: req.body,
      headers: req.headers,
    });
    const saved = await this.webhookLogRepo.save(log);
    await this.webhooksQueue.add('process-webhook', { webhookLogId: saved.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    res.status(200).send();
  }
}

// ─── Processor (processing layer) ───
// File: src/modules/webhooks/processors/${providerLower}-webhooks.processor.ts

import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookLog } from '../entities/webhook-log.entity';

@Processor('webhooks')
export class ${processorClass} {
  private readonly logger = new Logger(${processorClass}.name);

  constructor(
    @InjectRepository(WebhookLog) private readonly webhookLogRepo: Repository<WebhookLog>,
  ) {}

  @Process('process-webhook')
  async handle(job: Job<{ webhookLogId: number }>): Promise<void> {
    const log = await this.webhookLogRepo.findOneOrFail({ where: { id: job.data.webhookLogId } });
    this.logger.log(\`Processing \${log.provider} webhook \${log.eventType} (log id: \${log.id})\`);
    try {
      switch (log.eventType) {
        case '${jobName}':
          await this.handle${toPascalCase(eventType)}(log.payload);
          break;
        default:
          this.logger.warn(\`Unhandled event type: \${log.eventType}\`);
      }
      log.processed = true;
      await this.webhookLogRepo.save(log);
    } catch (error) {
      log.retryCount += 1;
      log.processingError = (error as Error).message;
      await this.webhookLogRepo.save(log);
      this.logger.error(\`Webhook \${log.id} failed (attempt \${log.retryCount})\`, error);
      throw error; // Required — Bull needs the error to trigger retries
    }
  }

  private async handle${toPascalCase(eventType)}(payload: Record<string, unknown>): Promise<void> {
    // TODO: implement handler for '${eventType}'
  }
}

// ─── Module registration ───
// Add to your webhooks module:
//   imports: [BullQueueModule, BullModule.registerQueue({ name: 'webhooks' }), TypeOrmModule.forFeature([WebhookLog])]
//   controllers: [${providerPascal}WebhooksController]
//   providers: [${processorClass}]
`;

      return {
        content: [{ type: 'text', text: snippet }],
      };
    }
  );
}

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^./, c => c.toUpperCase());
}
