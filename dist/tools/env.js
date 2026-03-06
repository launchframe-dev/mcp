import { loadContent } from '../lib/content.js';
export function registerEnvTools(server) {
    server.tool('env_get_conventions', 'Get environment variable conventions for LaunchFrame: single centralized .env location, variable naming rules, full key variable reference, and how to add new variables.', {}, async () => ({
        content: [{ type: 'text', text: loadContent('env/conventions.md') }],
    }));
}
