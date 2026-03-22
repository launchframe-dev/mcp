import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadContent } from '../lib/content.js';

export function registerEmailTools(server: McpServer): void {
  server.tool(
    'email_get_conventions',
    'Get an overview of the LaunchFrame email system: sending patterns (direct vs queue-based), template conventions, built-in templates, and environment setup.',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('email/conventions.md') }],
    })
  );

  server.tool(
    'email_scaffold_template',
    'Generate a Handlebars (.hbs) template stub for a new LaunchFrame transactional email, following project conventions.',
    {
      templateName: z
        .string()
        .describe('kebab-case template name without extension (e.g. "invoice-paid", "trial-ending")'),
      contextVars: z
        .array(z.string())
        .describe('camelCase context variable names the template will use (e.g. ["firstName", "url", "planName"]). Do not include baseUrl — it is auto-injected.'),
    },
    async ({ templateName, contextVars }: { templateName: string; contextVars: string[] }) => {
      const hasName = contextVars.includes('name') || contextVars.includes('firstName');
      const hasUrl = contextVars.includes('url');
      const hasOtp = contextVars.includes('otp');

      const greeting = hasName
        ? `<h2 class="title" style="color: #333; font-family: Arial, sans-serif;">Hello {{${contextVars.includes('firstName') ? 'firstName' : 'name'}}}!</h2>\n`
        : '';

      const otpBlock = hasOtp
        ? `<p style="text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px;
          background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 30px 0;">
    {{otp}}
</p>\n`
        : '';

      const ctaBlock = hasUrl
        ? `<p style="text-align: center; margin: 30px 0;">
  <a href="{{url}}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-family: Arial, sans-serif; font-size: 16px; display: inline-block;"><!-- TODO: button label --></a>
</p>\n`
        : '';

      const remainingVars = contextVars
        .filter(v => v !== 'name' && v !== 'firstName' && v !== 'url' && v !== 'otp')
        .map(v => `{{! ${v} }}`)
        .join('\n');

      const snippet = `{{!-- File: src/core/mail/templates/${templateName}.hbs --}}
{{!-- baseUrl is auto-injected by MailService — do not add it to your sendMail context call. --}}
${greeting}
<p style="color: #666; font-family: Arial, sans-serif; font-size: 16px;">
  {{!-- TODO: main message body --}}
</p>
${otpBlock}${ctaBlock}${remainingVars ? `\n{{!-- Other available vars: ${contextVars.filter(v => v !== 'name' && v !== 'firstName' && v !== 'url' && v !== 'otp').join(', ')} --}}\n` : ''}`;

      return {
        content: [{ type: 'text', text: snippet.trim() }],
      };
    }
  );

  server.tool(
    'email_scaffold_send',
    'Generate NestJS code to send a transactional email — either by injecting MailService directly (direct) or via the emails Bull queue (queued).',
    {
      templateName: z
        .string()
        .describe('kebab-case template name without extension (e.g. "invoice-paid")'),
      method: z
        .enum(['direct', 'queued'])
        .describe('"direct" injects MailService; "queued" adds a job to the emails Bull queue'),
      contextVars: z
        .array(z.string())
        .describe('camelCase context variable names required by the template (excluding baseUrl — auto-injected)'),
    },
    async ({ templateName, method, contextVars }: { templateName: string; method: 'direct' | 'queued'; contextVars: string[] }) => {
      const contextLines = contextVars
        .map(v => `    ${v}: ,  // TODO`)
        .join('\n');

      let snippet: string;

      if (method === 'direct') {
        snippet = `import { MailService } from '@core/mail/mail.service';

// In your module imports array:
// MailModule,   // from '@core/mail/mail.module'

@Injectable()
export class YourService {
  constructor(private readonly mailService: MailService) {}

  async sendExampleEmail(recipientEmail: string): Promise<void> {
    await this.mailService.sendMail({
      to: recipientEmail,
      subject: 'Your subject here',
      template: '${templateName}',
      context: {
${contextLines}
        // baseUrl is auto-injected from ADMIN_BASE_URL — do not include it here
      },
    });
  }
}`;
      } else {
        snippet = `import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

// In your module imports array:
// BullQueueModule,                                  // from '@core/bull/bull.module'
// BullModule.registerQueue({ name: 'emails' }),     // from '@nestjs/bull'

@Injectable()
export class YourService {
  constructor(
    @InjectQueue('emails') private readonly emailsQueue: Queue,
  ) {}

  async sendExampleEmail(recipientEmail: string): Promise<void> {
    await this.emailsQueue.add('send-email', {
      to: recipientEmail,
      subject: 'Your subject here',
      template: '${templateName}',
      context: {
${contextLines}
        // baseUrl is auto-injected by MailService — do not include it here
      },
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}`;
      }

      return {
        content: [{ type: 'text', text: snippet }],
      };
    }
  );
}
