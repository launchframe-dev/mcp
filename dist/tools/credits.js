import { z } from 'zod';
import { loadContent } from '../lib/content.js';
export function registerCreditsTools(server) {
    server.tool('credits_get_deduction_pattern', 'Get the decorator + guard pattern for deducting credits on a route.', {}, async () => ({
        content: [{ type: 'text', text: loadContent('credits/deduction.md') }],
    }));
    server.tool('credits_get_add_pattern', 'Get the code snippet for programmatically adding credits to a user with a specific transaction type.', {
        transactionType: z
            .enum(['INITIAL', 'PURCHASE', 'USAGE', 'REFUND', 'BONUS', 'EXPIRY', 'REDEMPTION'])
            .describe('The CreditTransactionType to use'),
    }, async ({ transactionType }) => {
        const descriptions = {
            INITIAL: 'Grant starting credits to a new user',
            PURCHASE: 'Credit top-up purchased by the user',
            USAGE: 'Manual usage deduction (prefer CreditsGuard for route-level deduction)',
            REFUND: 'Refund credits after a failed or cancelled operation',
            BONUS: 'Promotional or reward credits',
            EXPIRY: 'Expire/remove unused credits',
            REDEMPTION: 'Redeem credits (e.g. voucher, referral)',
        };
        const snippet = `// ${descriptions[transactionType]}
import { CreditsService } from '../credits/credits.service';
import { CreditTransactionType } from '../credits/entities/credit-transaction.entity';

// Inject in constructor:
constructor(private readonly creditsService: CreditsService) {}

// Call:
await this.creditsService.addCredits(
  user,                              // User entity
  100,                               // amount (positive to add, negative to deduct)
  CreditTransactionType.${transactionType},
  'Optional description',            // optional
  'optional-ref-id',                 // optional — external reference (e.g. Polar order ID)
);`;
        return {
            content: [{ type: 'text', text: snippet }],
        };
    });
    server.tool('credits_get_monetization_strategies', 'Get an overview of all monetization strategies (free, subscription, credits, hybrid) and when to use each.', {}, async () => ({
        content: [{ type: 'text', text: loadContent('credits/strategies.md') }],
    }));
}
