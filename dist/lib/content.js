import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
/**
 * Load a Markdown file from src/content/ (dist/content/ at runtime).
 * @param relativePath e.g. 'auth/overview.md'
 */
export function loadContent(relativePath) {
    return readFileSync(join(__dirname, '../content', relativePath), 'utf-8');
}
