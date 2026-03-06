import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadContent } from '../lib/content.js';

export function registerVariantTools(server: McpServer): void {
  server.tool(
    'variant_get_overview',
    'Get an overview of LaunchFrame project variants: Base (B2B single-tenant), Multi-tenant, and B2B2C. Covers differences, section marker syntax for CLI code generation, and coding guidelines per variant.',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('variants/overview.md') }],
    })
  );
}
