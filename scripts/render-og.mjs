// Génère l'image de partage (Open Graph) public/og.png à partir de tools/og.html.
// Usage : node scripts/render-og.mjs
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({ root, logLevel: 'error', server: { port: 5190, strictPort: false, hmr: false, watch: null } });
await server.listen();
const exe = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
page.on('pageerror', (e) => console.error('page:', e.message));
await page.goto(`http://localhost:${server.config.server.port}/tools/og.html`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.ogReady === true, null, { timeout: 30000 });
await page.locator('#og').screenshot({ path: resolve(root, 'public/og.png') });
console.log('public/og.png');
await browser.close();
await server.close();
