import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadContent } from '../lib/content.js';

export function registerSubscriptionTools(server: McpServer): void {
  server.tool(
    'subscriptions_get_plans_overview',
    'Get an overview of the subscription plans system: plan groups, annual billing toggle, API response shape, and key files.',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('subscriptions/plans.md') }],
    })
  );
}
