import { z } from 'zod';
import { loadContent } from '../lib/content.js';
const QUEUE_NAMES = ['emails', 'api', 'webhooks'];
export function registerQueueTools(server) {
    server.tool('queue_get_names', 'List all available Bull queues in LaunchFrame with their purpose and usage rules.', {}, async () => ({
        content: [{ type: 'text', text: loadContent('queues/names.md') }],
    }));
    server.tool('queue_scaffold_producer', 'Get the code to inject and use a Bull queue as a producer in a NestJS service.', {
        queueName: z
            .enum(QUEUE_NAMES)
            .describe('The queue to produce jobs for'),
    }, async ({ queueName }) => {
        const snippet = `import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { BullQueueModule } from '../bull/bull.module';

// In your module imports array:
// BullQueueModule,
// BullModule.registerQueue({ name: '${queueName}' }),  // from '@nestjs/bull'

@Injectable()
export class YourService {
  constructor(
    @InjectQueue('${queueName}') private readonly ${camelCase(queueName)}Queue: Queue,
  ) {}

  async enqueueJob(data: Record<string, unknown>): Promise<void> {
    await this.${camelCase(queueName)}Queue.add('job-name', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}`;
        return {
            content: [{ type: 'text', text: snippet }],
        };
    });
    server.tool('queue_scaffold_processor', 'Get a Bull processor class scaffold for a given queue and job name.', {
        queueName: z
            .enum(QUEUE_NAMES)
            .describe('The queue this processor listens to'),
        jobName: z
            .string()
            .describe('The job name string passed to queue.add() (e.g. "send-email")'),
    }, async ({ queueName, jobName }) => {
        const className = toPascalCase(queueName) + 'Processor';
        const snippet = `import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

// Add this class to the providers array of your module.
// Your module must also import BullQueueModule and BullModule.registerQueue({ name: '${queueName}' }).

@Processor('${queueName}')
export class ${className} {
  private readonly logger = new Logger(${className}.name);

  @Process('${jobName}')
  async handle(job: Job<Record<string, unknown>>): Promise<void> {
    this.logger.log(\`Processing job \${job.id}\`);
    try {
      // TODO: implement job logic using job.data
    } catch (error) {
      this.logger.error(\`Job \${job.id} failed\`, error);
      throw error; // Required — Bull needs the error to trigger retries
    }
  }
}`;
        return {
            content: [{ type: 'text', text: snippet }],
        };
    });
}
function camelCase(str) {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
function toPascalCase(str) {
    const camel = camelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}
