// Construit la version « aperçu publié » : une page HTML autonome par page du site
// (CSS et JS inclus, Three.js chargé depuis jsDelivr à la demande) dans dist-artifact/.
// La page d'accueil garde le nom ordra.html (URL de l'aperçu déjà publiée).
import { build } from 'vite';
import { seoPlugin } from './seo-plugin.mjs';
import { partialsPlugin, PAGES } from './partials-plugin.mjs';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = (name) => JSON.parse(readFileSync(resolve(root, `node_modules/${name}/package.json`), 'utf8')).version;
const CDN = { three: `https://cdn.jsdelivr.net/npm/three@${pkg('three')}/build/three.module.js` };
const lazyThree = {
  name: 'lazy-three',
  transform(code, id) {
    if (!id.endsWith('core3d.js')) return null;
    return code
      .replace("import * as THREE from 'three';", 'let THREE;')
      .replace(/export function startCore\(([^)]*)\) \{/, "export async function startCore($1) {\n  THREE = await import('three');");
  },
};

const OUT = resolve(root, 'dist-artifact');
mkdirSync(OUT, { recursive: true });
const name = (p) => (p === 'index' ? 'ordra.html' : `${p}.html`);

for (const page of PAGES) {
  const tmp = resolve(OUT, `.tmp-${page}`);
  rmSync(tmp, { recursive: true, force: true });
  const input = resolve(root, page === 'index' ? 'index.html' : `${page}/index.html`);
  await build({
    root, configFile: false, logLevel: 'warn', base: './',
    plugins: [lazyThree, partialsPlugin(), seoPlugin()],
    define: { __ARTIFACT__: 'true' },
    build: {
      outDir: tmp, emptyOutDir: true, cssCodeSplit: false, modulePreload: false, target: 'es2020',
      rollupOptions: { input, external: Object.keys(CDN), output: { paths: CDN, codeSplitting: false, format: 'es' } },
    },
  });
  const htmlPath = resolve(tmp, page === 'index' ? 'index.html' : `${page}/index.html`);
  let html = readFileSync(htmlPath, 'utf8');
  const asset = (ref) => readFileSync(resolve(tmp, 'assets', basename(ref)), 'utf8');
  let js = '';
  html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>\s*/g, (_, src) => { js += asset(src); return ''; });
  html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (_, href) => `<style>\n${asset(href).replace(/<\/style/gi, '<\\/style')}\n</style>`);
  html = html.replace('</body>', `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>\n</body>`);
  // La page principale est enveloppée par l'hébergeur : on ne garde que le contenu de <head> et <body>
  if (page === 'index') {
    const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'))
      .replace(/<meta charset[^>]*>\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '');
    const body = html.slice(html.indexOf('>', html.indexOf('<body')) + 1, html.lastIndexOf('</body>'));
    html = `${head.trim()}\n${body.trim()}\n`;
  }
  writeFileSync(resolve(OUT, name(page)), html);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`dist-artifact/${name(page)} — ${(html.length / 1024).toFixed(0)} Ko`);
}
if (!existsSync(resolve(OUT, 'ordra.html'))) process.exit(1);
