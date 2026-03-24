# @launchframe/mcp

MCP server that gives AI agents (Claude Code, Cursor, etc.) architectural knowledge about your LaunchFrame project — auth patterns, entity conventions, queue usage, cron jobs, webhooks, and more.

## Installation

Running `launchframe init` automatically configures this MCP server in your project. No manual setup needed.

## What It Does

Instead of bloating `CLAUDE.md` with rules, agents call tools on demand to pull the exact pattern they need:

| Tool | Description |
|------|-------------|
| `auth_get_overview` | Auth system, guard hierarchy, session flow |
| `auth_get_decorator_usage` | Exact decorator for a given auth need |
| `auth_get_guard_usage` | Guard class + import for admin/user/credits |
| `feature_gates_get_overview` | How feature gates are stored and queried |
| `feature_gates_get_check_pattern` | Copy-paste feature check snippet |
| `credits_get_deduction_pattern` | Decorator + guard for route-level credit deduction |
| `credits_get_add_pattern` | Code snippet for programmatic credit addition |
| `credits_get_monetization_strategies` | Overview of free/subscription/credits/hybrid modes |
| `queue_get_names` | Available Bull queues and their purpose |
| `queue_scaffold_producer` | Producer injection snippet for a given queue |
| `queue_scaffold_processor` | Processor class scaffold for a queue + job name |
| `webhook_get_architecture` | Receipt/processing separation, retry logic |
| `webhook_scaffold_handler` | Controller + processor scaffold for a provider/event |
| `cron_get_pattern` | Where crons live, available schedules, rules |
| `cron_scaffold_job` | Cron method scaffold to add to CronService |
| `module_get_structure` | NestJS module folder structure and conventions |
| `module_scaffold_nestjs` | Full module scaffold (module + service + controller + entity) |
| `entity_get_conventions` | TypeORM entity conventions and required decorators |
| `entity_scaffold_typeorm` | TypeORM entity file scaffold |
| `env_get_conventions` | Centralized `.env` rules and key variable reference |
| `variant_get_overview` | Base / Multi-tenant / B2B2C variant differences |
| `database_schema` | Full DB schema with tables, columns, types, and common SQL snippets |
| `subscriptions_get_plans_overview` | Subscription plans system: plan groups, annual billing, API shape |
| `architecture_get_overview` | Overall architecture: services, modules, patterns, infrastructure |
| `email_get_conventions` | Email system: sending patterns, templates, built-in templates |
| `email_scaffold_template` | Handlebars template stub for a new transactional email |
| `email_scaffold_send` | NestJS code to send an email (direct or queued) |
| `cli_docker_up` | Start Docker services (detached) |
| `cli_docker_down` | Stop all running Docker services |
| `cli_docker_build` | Build Docker images (all or specific service) |
| `cli_docker_logs` | Fetch a snapshot of Docker service logs |
| `cli_docker_destroy` | Destroy ALL Docker resources — irreversible |
| `cli_migration_run` | Run all pending TypeORM migrations |
| `cli_migration_create` | Create a new empty TypeORM migration file |
| `cli_migration_revert` | Revert the most recently applied migration |
| `cli_database_query` | Execute a SQL query (local or remote via SSH) |
| `cli_service_list` | List available optional services |
| `cli_service_add` | Install an optional service non-interactively |
| `cli_module_list` | List available optional modules |
| `cli_module_add` | Install a module non-interactively |
| `cli_deploy_build` | Build production images and push to GHCR |
| `cli_deploy_up` | Deploy latest images to VPS via SSH |
| `cli_deploy_sync_features` | Sync plan features to production DB — destructive |
| `cli_waitlist_up` | Start the waitlist service locally |
| `cli_waitlist_down` | Stop the local waitlist service |
| `cli_waitlist_deploy` | Build and deploy waitlist service to VPS |
| `cli_waitlist_logs` | Fetch waitlist service logs from VPS |
| `cli_dev_add_user` | Create a random test user in the local DB |
| `cli_dev_npm_install` | Run npm install inside a service via Docker |
| `cli_dev_logo` | Generate and inject logo/favicon assets |
| `cli_cache_info` | Show local service cache info |
| `cli_cache_update` | Force-update the local service cache |
| `cli_cache_clear` | Delete the entire local service cache |

## Manual Install

If you prefer a global install:

```bash
npm install -g @launchframe/mcp
```

Then in `.mcp.json`:

```json
{
  "mcpServers": {
    "launchframe": {
      "command": "launchframe-mcp"
    }
  }
}
```
