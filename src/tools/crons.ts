import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadContent } from '../lib/content.js';

const CRON_EXPRESSIONS = [
  'EVERY_MINUTE',
  'EVERY_30_MINUTES',
  'EVERY_HOUR',
  'EVERY_DAY_AT_MIDNIGHT',
  'EVERY_WEEK',
] as const;
type CronExpressionKey = typeof CRON_EXPRESSIONS[number];

export function registerCronTools(server: McpServer): void {
  server.tool(
    'cron_get_pattern',
    'Get the LaunchFrame cron job pattern: where jobs live, available CronExpression presets, and module registration rules.',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('crons/pattern.md') }],
    })
  );

  server.tool(
    'cron_scaffold_job',
    'Scaffold a new cron method to add to CronService (src/jobs/cron.service.ts).',
    {
      methodName: z
        .string()
        .describe('The name of the cron method, camelCase (e.g. "syncUserStats")'),
      schedule: z
        .enum(CRON_EXPRESSIONS)
        .describe('The CronExpression preset to use'),
      queueName: z
        .string()
        .optional()
        .describe('Optional Bull queue name to enqueue work into (e.g. "api"). Omit for jobs that do lightweight direct work.'),
    },
    async ({ methodName, schedule, queueName }: { methodName: string; schedule: CronExpressionKey; queueName?: string }) => {
      const queueInjection = queueName
        ? `\n    @InjectQueue('${queueName}') private readonly ${toCamelCase(queueName)}Queue: Queue,`
        : '';

      const queueImports = queueName
        ? `\nimport { InjectQueue } from '@nestjs/bull';\nimport { Queue } from 'bull';`
        : '';

      const methodBody = queueName
        ? `    this.logger.log('Starting ${methodName}...');
    try {
      // TODO: fetch items to process
      // const items = await this.repo.find({ where: { ... } });
      // for (const item of items) {
      //   await this.${toCamelCase(queueName)}Queue.add({ id: item.id }, {
      //     attempts: 3,
      //     backoff: { type: 'exponential', delay: 2000 },
      //   });
      // }
    } catch (error) {
      this.logger.error('Error in ${methodName}:', error);
    }`
        : `    this.logger.log('Starting ${methodName}...');
    try {
      // TODO: implement job logic
    } catch (error) {
      this.logger.error('Error in ${methodName}:', error);
    }`;

      const snippet = `// Add this method to src/jobs/cron.service.ts
// ─── Additional imports needed ───
import { Cron, CronExpression } from '@nestjs/schedule';${queueImports}

// ─── Add to CronService constructor params ───
constructor(
  // ... existing params ...${queueInjection}
) {}

// ─── New cron method ───
@Cron(CronExpression.${schedule})
async ${methodName}() {
${methodBody}
}`;

      return {
        content: [{ type: 'text', text: snippet }],
      };
    }
  );
}

function toCamelCase(str: string): string {
  return str
    .split('-')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}
