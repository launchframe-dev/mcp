import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAuthTools } from './tools/auth.js';
import { registerFeatureGatesTools } from './tools/feature-gates.js';
import { registerCreditsTools } from './tools/credits.js';
import { registerQueueTools } from './tools/queues.js';
import { registerWebhookTools } from './tools/webhooks.js';
import { registerCronTools } from './tools/crons.js';
import { registerModuleTools } from './tools/modules.js';
import { registerEntityTools } from './tools/entities.js';
import { registerEnvTools } from './tools/env.js';
import { registerVariantTools } from './tools/variants.js';
import { registerCliTools } from './tools/cli.js';
import { registerDatabaseTools } from './tools/database.js';
import { registerSubscriptionTools } from './tools/subscriptions.js';
import { registerArchitectureTools } from './tools/architecture.js';

export function createServer(): McpServer {
  const server = new McpServer({ name: 'launchframe-mcp', version: '1.0.0' });

  registerAuthTools(server);
  registerFeatureGatesTools(server);
  registerCreditsTools(server);
  registerQueueTools(server);
  registerWebhookTools(server);
  registerCronTools(server);
  registerModuleTools(server);
  registerEntityTools(server);
  registerEnvTools(server);
  registerVariantTools(server);
  registerCliTools(server);
  registerDatabaseTools(server);
  registerSubscriptionTools(server);
  registerArchitectureTools(server);

  return server;
}
