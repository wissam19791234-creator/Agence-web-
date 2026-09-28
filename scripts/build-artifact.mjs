// Construit la version « aperçu publié » : une page HTML autonome par page du site
// (CSS et JS inclus) dans dist-artifact/. La page d'accueil garde le nom ordra.html
// (fichier source de l'aperçu déjà publié).
import { build } from 'vite';
import { seoPlugin } from './seo-plugin.mjs';
import { partialsPlugin, PAGES, pageFile } from './partials-plugin.mjs';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'dist-artifact');
mkdirSync(OUT, { recursive: true });
const name = (p) => (p === 'index' ? 'ordra.html' : `${p}.html`);

for (const page of PAGES) {
  const tmp = resolve(OUT, `.tmp-${page}`);
  rmSync(tmp, { recursive: true, force: true });
  const input = resolve(root, pageFile(page));
  await build({
    root, configFile: false, logLevel: 'warn', base: './',
    plugins: [partialsPlugin(), seoPlugin()],
    define: { __ARTIFACT__: 'true' },
    build: {
      outDir: tmp, emptyOutDir: true, cssCodeSplit: false, modulePreload: false, target: 'es2020',
      rollupOptions: { input, output: { codeSplitting: false, format: 'es' } },
    },
  });
  const htmlPath = resolve(tmp, pageFile(page));
  let html = readFileSync(htmlPath, 'utf8');
  const asset = (ref) => readFileSync(resolve(tmp, 'assets', basename(ref)), 'utf8');
  let js = '';
  html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>\s*/g, (_, src) => { js += asset(src); return ''; });
  html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (_, href) => `<style>\n${asset(href).replace(/<\/style/gi, '<\\/style')}\n</style>`);
  html = html.replace('</body>', `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>\n</body>`);
  // Médias : chemins relatifs dès le HTML (évite des requêtes vers /media/… avant la réécriture en JS)
  html = html.replace(/(src|href|poster)="\/media\//g, '$1="media/');
  // Polices intégrées en data URI : l'aperçu tourne dans un cadre à origine opaque,
  // où des fichiers de police séparés seraient refusés (CORS). Les préchargements deviennent inutiles.
  html = html.replace(/<link rel="preload" href="[^"]*fonts\/[^"]*"[^>]*>\s*/g, '')
    .replace(/url\((?:\.{0,2}\/)*fonts\/([a-z0-9-]+\.woff2)\)/g, (_, f) => `url(data:font/woff2;base64,${readFileSync(resolve(root, 'public/fonts', f)).toString('base64')})`);
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
