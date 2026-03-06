import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadContent } from '../lib/content.js';

export function registerFeatureGatesTools(server: McpServer): void {
  server.tool(
    'feature_gates_get_overview',
    'Get the feature gate system overview: how features are stored, how to query them, and the check pattern.',
    {},
    async () => ({
      content: [{ type: 'text', text: loadContent('feature-gates/overview.md') }],
    })
  );

  server.tool(
    'feature_gates_get_check_pattern',
    'Get a copy-paste TypeScript snippet for checking a feature gate by code and type.',
    {
      featureCode: z.string().describe('The feature code to check (as defined in the database)'),
      featureType: z.enum(['boolean', 'numeric']).describe('Whether to generate a boolean or numeric (with limit) check'),
    },
    async ({ featureCode, featureType }) => {
      const label = featureCode.replace(/_/g, ' ');
      const camel = featureCode.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');

      const checkSnippet = featureType === 'boolean'
        ? `const features = await this.userSubscriptionService.getCurrentFeatures(userId);

const hasAccess = features['${featureCode}'] === true;
if (!hasAccess) {
  throw new ForbiddenException('Your plan does not include ${label}');
}`
        : `const features = await this.userSubscriptionService.getCurrentFeatures(userId);

const limit = features['${featureCode}'] as number ?? 0;
const isUnlimited = limit === -1;
const currentCount = await this.get${camel}Count(userId);
if (!isUnlimited && currentCount >= limit) {
  throw new ForbiddenException(\`Plan limit reached for ${label} (\${limit})\`);
}`;

      return {
        content: [{
          type: 'text',
          text: `# Feature Gate Check: \`${featureCode}\` (${featureType})

## Imports

\`\`\`typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserSubscriptionService } from '../subscriptions/services/user-subscription.service';
\`\`\`

## Constructor Injection

\`\`\`typescript
constructor(
  private readonly userSubscriptionService: UserSubscriptionService,
) {}
\`\`\`

## Check

\`\`\`typescript
${checkSnippet}
\`\`\`

> Feature code \`${featureCode}\` must exist in the \`subscription_plan_features\` table and have values configured per plan.
`,
        }],
      };
    }
  );
}
