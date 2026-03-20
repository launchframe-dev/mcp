import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadContent } from '../lib/content.js';

export function registerArchitectureTools(server: McpServer): void {
  server.tool(
    'architecture_get_overview',
    'Get the overall architecture of the LaunchFrame project: services, backend module layout, key patterns, frontend structure, and infrastructure.',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('architecture/overview.md') }],
    })
  );
}
