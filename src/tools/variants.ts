import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadContent } from '../lib/content.js';

export function registerVariantTools(server: McpServer): void {
  server.tool(
    'variant_get_overview',
    'Get an overview of LaunchFrame project variants: Base (B2B single-tenant), Multi-tenant, and B2B2C. Explains how to read the active variant from the .launchframe file and what behavioral differences to account for when writing new code.',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('variants/overview.md') }],
    })
  );
}
