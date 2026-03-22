# Email

## Overview

LaunchFrame uses **Resend** in production and **SMTP (Mailtrap)** in development. The `MailService` (`src/core/mail/mail.service.ts`) handles both transparently based on `NODE_ENV`:

- **Development** (`NODE_ENV=development`): sends via `@nestjs-modules/mailer` + Nodemailer to your configured SMTP host (e.g. Mailtrap). A temporary HTML file is written to the OS temp dir for preview before sending.
- **Production**: sends directly via the Resend API using `RESEND_API_KEY`.

Templates are written in **Handlebars** (`.hbs`) and rendered server-side by `MailService` before sending.

## Sending Patterns

Two patterns exist. Choose based on whether the email is part of a request/response flow.

### Direct (inject MailService)

Use when sending from admin services, commands, or one-off flows where queue overhead is unnecessary.

```typescript
// Requires MailModule imported in your feature module
await this.mailService.sendMail({
  to: recipientEmail,
  subject: 'Your subject',
  template: 'template-name',   // kebab-case, no extension
  context: { name: 'Alice', url: 'https://...' },
  // replyTo, text, attachments are optional
});
```

### Queued (emails Bull queue)

Use in auth flows, webhooks, or anywhere email failure must not block the request. Jobs are processed by `EmailProcessor` (`src/core/mail/processors/email.processor.ts`), which calls `MailService.sendMail` internally.

```typescript
// Requires BullQueueModule + BullModule.registerQueue({ name: 'emails' }) in your module
await this.emailsQueue.add('send-email', {
  to: recipientEmail,
  subject: 'Your subject',
  template: 'template-name',
  context: { name: 'Alice', url: 'https://...' },
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
});
```

## Template Conventions

- **Location**: `src/core/mail/templates/{kebab-case-name}.hbs`
- **Naming**: `kebab-case` (e.g. `password-reset.hbs`, `invoice-paid.hbs`)
- **Layout**: All templates are automatically wrapped by `layouts/main.hbs`. Your template provides only the body HTML — do not include `<html>`, `<head>`, or `<body>` tags.
- **Context variables**: Use `camelCase` (e.g. `appName`, `firstName`, `url`, `otp`).
- **`baseUrl`**: Auto-injected from `ADMIN_BASE_URL` by `MailService`. Never pass it in the `context` object.
- **`from`**: Auto-set to `{{PROJECT_DISPLAY_NAME}} <{{ADMIN_EMAIL}}>` by `MailService`. Never set it manually.
- **Conditional blocks**: Use Handlebars `{{#if varName}}...{{/if}}` for optional content (e.g. a CTA button that only shows when a `url` is provided).

## Built-in Templates

| Template | Purpose | Context vars |
|---|---|---|
| `email-verification` | Verify email address after signup | `name`, `appName`, `url` |
| `password-reset` | Password reset link | `name`, `appName`, `url` |
| `welcome` | Welcome email after first project created | `name`, `projectTitle`, `projectUrl`, `adminUrl` |
| `magic-link` | OTP + optional magic-link for passwordless sign-in | `otp`, `url` (optional) |
| `otp-verification` | OTP code for email verification | `otp`, `appName` |
| `contact` | Contact form submission (internal) | `name`, `email`, `message` |
| `referral-application` | Referral program application (internal) | `name`, `email`, `company`, `promotion_plan`, `expected_referrals` |

## Environment Variables

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key (production) |
| `MAIL_HOST` | SMTP host (development, e.g. Mailtrap) |
| `MAIL_USER` | SMTP username |
| `MAIL_PASSWORD` | SMTP password |
| `MAIL_FROM` | Sender address (overridden by MailService in most cases) |

## Testing

- **CLI**: `npm run test-email <template> <email>` from the backend service root — renders and sends the template to the given address using the current env config.
- **HTTP**: `POST /mail/test` — test endpoint exposed by `MailController`.
