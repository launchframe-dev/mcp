import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { execSync } from 'child_process';

/**
 * Request human confirmation for a destructive action via MCP elicitation.
 * Returns true if the user confirmed, false if declined/cancelled or if the
 * client does not support elicitation (fails safe — aborts rather than proceeds).
 */
async function confirmDestructive(server: McpServer, message: string): Promise<boolean> {
  try {
    const result = await server.server.elicitInput({
      mode: 'form',
      message,
      requestedSchema: {
        type: 'object',
        properties: {
          confirmed: {
            type: 'boolean',
            title: 'Yes, proceed',
          },
        },
        required: ['confirmed'],
      },
    });

    return result.action === 'accept' && result.content?.confirmed === true;
  } catch {
    // Client does not support elicitation — fail safe
    return false;
  }
}

export function registerCliTools(server: McpServer): void {

  // ─── docker:* ────────────────────────────────────────────────────────────

  server.tool(
    'cli_docker_up',
    'Start Docker services for a LaunchFrame project. Always runs detached (background). Use cli_docker_logs to inspect output afterward.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
      service: z.string().optional().describe('Specific service to start (e.g., "backend", "admin-portal"). Omit to start all services.'),
    },
    async ({ projectPath, service }) => {
      try {
        const svc = service ? ` ${service}` : '';
        const output = execSync(`launchframe docker:up${svc} --detach`, { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Services started in detached mode.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_docker_down',
    'Stop all running Docker services for a LaunchFrame project.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const output = execSync('launchframe docker:down', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Services stopped.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_docker_build',
    'Build Docker images for a LaunchFrame project (all services or a specific one).',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
      service: z.string().optional().describe('Specific service to build (e.g., "backend"). Omit to build all.'),
    },
    async ({ projectPath, service }) => {
      try {
        const svc = service ? ` ${service}` : '';
        const output = execSync(`launchframe docker:build${svc}`, { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Build complete.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_docker_logs',
    'Fetch a snapshot of Docker service logs (non-streaming). Returns the last N lines.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
      service: z.string().optional().describe('Specific service to get logs for (e.g., "backend"). Omit for all services.'),
      tail: z.number().optional().describe('Number of log lines to return (default: 100)'),
    },
    async ({ projectPath, service, tail }) => {
      try {
        const svc = service ? ` ${service}` : '';
        const lines = tail || 100;
        const output = execSync(`launchframe docker:logs${svc} --no-follow --tail ${lines}`, { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || '(no output)' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_docker_destroy',
    'Destroy ALL Docker resources for a LaunchFrame project (containers, volumes, images, network). IRREVERSIBLE — all local data including database volumes will be lost. Will prompt for confirmation before proceeding.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const confirmed = await confirmDestructive(
          server,
          '⚠️ This will permanently delete ALL Docker resources for this project: containers, volumes (including the local database), images, and the network. This cannot be undone. Proceed?'
        );
        if (!confirmed) {
          return { content: [{ type: 'text', text: 'Aborted. No Docker resources were removed.' }] };
        }

        const output = execSync('launchframe docker:destroy --force', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'All Docker resources destroyed.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  // ─── migration:* + database:* ────────────────────────────────────────────

  server.tool(
    'cli_migration_run',
    'Run all pending TypeORM database migrations against the local database.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const output = execSync('launchframe migration:run', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Migrations applied.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_migration_create',
    'Create a new empty TypeORM migration file with the given name.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
      name: z.string().describe('Migration name in PascalCase (e.g., "AddStripeCustomerId")'),
    },
    async ({ projectPath, name }) => {
      try {
        const output = execSync(`launchframe migration:create ${name}`, { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Migration file created.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_migration_revert',
    'Revert the most recently applied TypeORM database migration.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const output = execSync('launchframe migration:revert', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Migration reverted.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_database_query',
    'Execute a SQL query against the local (or remote) database and return results. Use for SELECT queries, schema inspection, or data checks. When remote=true, will prompt for confirmation before touching production.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
      sql: z.string().describe('SQL to execute (e.g., "SELECT * FROM users LIMIT 10;")'),
      remote: z.boolean().optional().describe('If true, query the production database via SSH instead of local. Requires confirmation.'),
    },
    async ({ projectPath, sql, remote }) => {
      try {
        if (remote) {
          const confirmed = await confirmDestructive(
            server,
            `⚠️ This will execute SQL against the PRODUCTION database:\n\n${sql}\n\nProceed?`
          );
          if (!confirmed) {
            return { content: [{ type: 'text', text: 'Aborted. Query not executed on production.' }] };
          }
        }

        const remoteFlag = remote ? ' --remote' : '';
        const output = execSync(`launchframe database:console${remoteFlag} --query ${JSON.stringify(sql)}`, { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || '(no output)' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  // ─── service:* + module:* ─────────────────────────────────────────────────

  server.tool(
    'cli_service_list',
    'List all available optional services that can be added to a LaunchFrame project (e.g., waitlist, docs, customers-portal).',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const output = execSync('launchframe service:list', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || '(no output)' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_service_add',
    'Install an optional service into a LaunchFrame project. Runs non-interactively (skips prompts). Env vars will be empty — configure them manually in infrastructure/.env afterward.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
      name: z.string().describe('Service name to install (e.g., "waitlist", "docs", "customers-portal")'),
    },
    async ({ projectPath, name }) => {
      try {
        const output = execSync(`launchframe service:add ${name} --yes`, { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || `Service "${name}" installed.` }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_module_list',
    'List all available modules that can be added to a LaunchFrame project (e.g., feature-flags, multi-tenancy).',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const output = execSync('launchframe module:list', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || '(no output)' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_module_add',
    'Install a module into a LaunchFrame project. Runs non-interactively (skips confirmation). Rebuilds affected containers and restarts the stack in detached mode.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
      name: z.string().describe('Module name to install (e.g., "feature-flags")'),
    },
    async ({ projectPath, name }) => {
      try {
        const output = execSync(`launchframe module:add ${name} --yes`, { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || `Module "${name}" installed.` }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  // ─── deploy:* ────────────────────────────────────────────────────────────

  server.tool(
    'cli_deploy_build',
    'Build production Docker images and push to GitHub Container Registry. Optionally build a specific service only.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
      service: z.string().optional().describe('Specific service to build and push (e.g., "backend"). Omit to build all.'),
    },
    async ({ projectPath, service }) => {
      try {
        const svc = service ? ` ${service}` : '';
        const output = execSync(`launchframe deploy:build${svc}`, { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Build complete.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_deploy_up',
    'Deploy the latest images to the VPS and restart all production services via SSH.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const output = execSync('launchframe deploy:up', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Deployment complete.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_deploy_sync_features',
    'Sync subscription plan features from the local database to the production database. DESTRUCTIVE: truncates subscription_plan_features on production. Will prompt for confirmation before proceeding.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const confirmed = await confirmDestructive(
          server,
          '⚠️ This will TRUNCATE subscription_plan_features on the PRODUCTION database and replace with local data. Proceed?'
        );
        if (!confirmed) {
          return { content: [{ type: 'text', text: 'Aborted. No changes made to production.' }] };
        }

        const output = execSync('launchframe deploy:sync-features --yes', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Features synced to production.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  // ─── waitlist:* ──────────────────────────────────────────────────────────

  server.tool(
    'cli_waitlist_up',
    'Start the waitlist service locally using Docker Compose.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const output = execSync('launchframe waitlist:up', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Waitlist service started.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_waitlist_down',
    'Stop the locally running waitlist service.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const output = execSync('launchframe waitlist:down', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Waitlist service stopped.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_waitlist_deploy',
    'Build and deploy the waitlist service to the VPS via SSH.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const output = execSync('launchframe waitlist:deploy', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Waitlist deployed.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_waitlist_logs',
    'Fetch a snapshot of waitlist service logs from the VPS (non-streaming). Returns the last N lines.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
      tail: z.number().optional().describe('Number of log lines to return (default: 100)'),
    },
    async ({ projectPath, tail }) => {
      try {
        const lines = tail || 100;
        const output = execSync(`launchframe waitlist:logs --no-follow --tail ${lines}`, { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || '(no output)' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  // ─── dev:* ───────────────────────────────────────────────────────────────

  server.tool(
    'cli_dev_add_user',
    'Create a random test user in the local database. Generates a unique email + bcrypt password hash and inserts via docker exec. Creates a demo project if the project uses multi-tenancy.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
    },
    async ({ projectPath }) => {
      try {
        const output = execSync('launchframe dev:add-user', { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'User created.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_dev_npm_install',
    'Run npm install inside a service directory using a node:20-alpine Docker container (matches the build environment). Use this to add packages or update package-lock.json.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
      service: z.string().describe('Service directory name (e.g., "backend", "admin-portal", "website")'),
      packages: z.array(z.string()).optional().describe('Package names to install (e.g., ["stripe", "zod"]). Omit to run plain npm install.'),
    },
    async ({ projectPath, service, packages }) => {
      try {
        const pkgs = packages && packages.length ? ' ' + packages.join(' ') : '';
        const output = execSync(`launchframe dev:npm-install ${service}${pkgs}`, { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'npm install complete.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_dev_logo',
    'Generate and inject logo/favicon assets across all frontend services from an SVG file. Defaults to <projectRoot>/logo.svg if no path is given.',
    {
      projectPath: z.string().describe('Absolute path to the LaunchFrame project root'),
      svgPath: z.string().optional().describe('Absolute path to the SVG logo file (defaults to <projectRoot>/logo.svg)'),
    },
    async ({ projectPath, svgPath }) => {
      try {
        const svg = svgPath ? ` ${svgPath}` : '';
        const output = execSync(`launchframe dev:logo${svg}`, { cwd: projectPath, encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Logo assets generated.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  // ─── cache:* ─────────────────────────────────────────────────────────────

  server.tool(
    'cli_cache_info',
    'Show information about the local LaunchFrame service cache (location, size, cached services, last update time).',
    {},
    async () => {
      try {
        const output = execSync('launchframe cache:info', { encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || '(no output)' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_cache_update',
    'Force-update the local LaunchFrame service cache by re-downloading cached services.',
    {},
    async () => {
      try {
        const output = execSync('launchframe cache:update', { encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Cache updated.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );

  server.tool(
    'cli_cache_clear',
    'Delete the entire local LaunchFrame service cache. Services will be re-downloaded on next use.',
    {},
    async () => {
      try {
        const output = execSync('launchframe cache:clear --yes', { encoding: 'utf8' });
        return { content: [{ type: 'text', text: output || 'Cache cleared.' }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: error.message }] };
      }
    }
  );
}
