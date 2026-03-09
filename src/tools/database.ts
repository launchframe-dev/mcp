import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadContent } from '../lib/content.js';

export function registerDatabaseTools(server: McpServer): void {
  server.tool(
    'database_schema',
    'Returns the full database schema (all tables, columns, types, relations) plus ready-made SQL snippets for common questions like user counts, active sessions, subscription plans, credit balances, etc. Call this before running cli_database_query when the user asks a data question.',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('database/schema.md') }],
    })
  );
}
