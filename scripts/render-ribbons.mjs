// Génère les rubans 3D gonflables (signature visuelle) en images transparentes :
// public/media/ribbon-*.png puis .webp. Usage : node scripts/render-ribbons.mjs [variante…]
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'public/media');
mkdirSync(OUT, { recursive: true });

const JOBS = [['hero', 'full'], ['arc', 'full'], ['s', 'full'], ['wave', 'full'], ['loop', 'full']];
// --front=a,b : portion du ruban du hero rendue « devant » le titre (fractions du tracé)
const frontArg = process.argv.find((a) => a.startsWith('--front='));
const FRONT = frontArg ? frontArg.slice(8).split(',').map(Number) : null;
const OUTNAME = (process.argv.find((a) => a.startsWith('--out=')) || '').slice(6);
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));

const server = await createServer({ root, logLevel: 'error', server: { port: 5189, strictPort: false, hmr: false, watch: null } });
await server.listen();
const exe = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
page.on('pageerror', (e) => console.error('page:', e.message));
await page.goto(`http://localhost:${server.config.server.port}/tools/ribbons.html`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.ribbonsReady === true, null, { timeout: 60000 });

for (const [name, part] of JOBS) {
  if (only.length && !only.includes(name)) continue;
  const t0 = Date.now();
  const url = await page.evaluate(([n, p, f]) => window.renderRibbon(n, p, f), [name, part, FRONT]);
  const file = resolve(OUT, OUTNAME && part === 'front' ? OUTNAME : `ribbon-${name}${part === 'front' ? '-front' : ''}`);
  writeFileSync(`${file}.png`, Buffer.from(url.split(',')[1], 'base64'));
  const r = spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', '-i', `${file}.png`, '-c:v', 'libwebp', '-quality', '82', '-pix_fmt', 'yuva420p', `${file}.webp`]);
  if (r.status === 0) unlinkSync(`${file}.png`);
  console.log(`ribbon-${name}${part === 'front' ? '-front' : ''} (${((Date.now() - t0) / 1000).toFixed(1)} s)${r.status === 0 ? ' → webp' : ' (png)'}`);
}
await browser.close();
await server.close();
