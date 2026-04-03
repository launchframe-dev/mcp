import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadContent } from '../lib/content.js';

export function registerRbacTools(server: McpServer): void {
  server.tool(
    'rbac_get_overview',
    'Get full RBAC model overview: actor responsibilities, data model, default roles, guard evaluation order, and variant axis.',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('rbac/overview.md') }],
    }),
  );

  server.tool(
    'rbac_get_permission_pattern',
    'Get the 4-step workflow for adding a new permission: enum → seeder → superadmin assigns → @RequiresPermission().',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('rbac/permission-pattern.md') }],
    }),
  );

  server.tool(
    'rbac_get_guard_usage',
    'Get when and how to apply @RequiresPermission, owner bypass rules, cache invalidation patterns, and multi-tenant scoping behaviour.',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('rbac/guard-usage.md') }],
    }),
  );
}
