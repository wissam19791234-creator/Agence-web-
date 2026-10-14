// Rend les visuels 3D de démonstration dans src/assets/demo3d/ (Chromium sans affichage + three.js).
// Usage : node scripts/render3d/render.cjs [--preview] [nom-de-prise …]
// Playwright est pris dans node_modules ou dans les modules globaux (NODE_PATH=$(npm root -g)).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const esbuild = require('esbuild');
const sharp = require('sharp');

function loadPlaywright() {
  try { return require('playwright'); } catch { return require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
}

(async () => {
  const args = process.argv.slice(2);
  const preview = args.includes('--preview');
  const names = args.filter((a) => !a.startsWith('--'));
  const root = path.resolve(__dirname, '../..');
  const out = preview ? path.join(root, '.render-preview') : path.join(root, 'src/assets/demo3d');
  fs.mkdirSync(out, { recursive: true });

  const bundle = esbuild.buildSync({
    stdin: { contents: "import { render, SHOTS } from './scenes.js'; window.R3D = { render, SHOTS };", resolveDir: __dirname },
    bundle: true, format: 'iife', write: false, minify: true, nodePaths: [path.join(root, 'node_modules')],
  }).outputFiles[0].text;

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let page = await browser.newPage();
  await page.setContent('<!doctype html><body style="margin:0;background:#000"></body>');
  await page.addScriptTag({ content: bundle });
  const all = await page.evaluate(() => Object.keys(window.R3D.SHOTS));
  const list = names.length ? names : all;

  for (const name of list) {
    const portrait = name.endsWith('@m');
    const [W, H] = portrait ? [720, 1200] : [1280, 800];
    const scale = preview ? 0.625 : 1.5;
    const w = Math.round(W * scale), h = Math.round(H * scale);
    const t0 = Date.now();
    await page.close(); page = await browser.newPage({ viewport: { width: 400, height: 300 } });
    page.on('pageerror', (e) => console.error('  erreur page :', e.message));
    page.on('console', (m) => { if (m.type() === 'error') console.error('  console :', m.text()); });
    await page.setContent('<!doctype html><body style="margin:0;background:#000"></body>');
    await page.addScriptTag({ content: bundle });
    const url = await page.evaluate(([n, a, b]) => window.R3D.render(n, a, b), [name, w, h]);
    const png = Buffer.from(url.split(',')[1], 'base64');
    // WebP : environ trois fois plus léger que le JPEG, pour que la page unique s'ouvre vite sur téléphone.
    const file = path.join(out, `${name}.${preview ? 'jpg' : 'webp'}`);
    const img = sharp(png).resize(preview ? w : W, preview ? h : H, { kernel: 'lanczos3' });
    await (preview ? img.jpeg({ quality: 80 }) : img.webp({ quality: 62, effort: 6 })).toFile(file);
    console.log(`${name} → ${path.relative(root, file)} (${Math.round(fs.statSync(file).size / 1024)} Ko, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
