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
