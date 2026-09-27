// Plugin Vite : injecte les fragments partagés (<head>, en-tête, CTA final, pied de page, logo)
// dans chaque page HTML, au développement comme au build.
import { readFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logo } from '../src/shared/brand.js';
import { splitDisplayTitles } from '../src/shared/display.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const part = (n) => readFileSync(resolve(root, `src/partials/${n}.html`), 'utf8');

export const APP_ROUTES = ['overview', 'analytics', 'ai', 'insights', 'automations', 'reports', 'goals', 'settings'];
// Pages « à plat » servies en /nom.html (légal, merci, 404) ; les autres ont leur dossier (/pricing/…)
export const FLAT_PAGES = ['mentions-legales', 'confidentialite', 'conditions', 'merci', '404'];
export const PAGES = ['index', 'product', 'features', 'pricing', 'security', 'resources', 'login', 'signup', 'app', ...FLAT_PAGES];
/** Fichier HTML source d'une page, relatif à la racine du projet. */
export const pageFile = (p) => (p === 'index' ? 'index.html' : FLAT_PAGES.includes(p) ? `${p}.html` : `${p}/index.html`);

export function partialsPlugin() {
  return {
    name: 'scalify-partials',
    enforce: 'pre',
    transformIndexHtml(html) {
      return splitDisplayTitles(html
        .replace('<!--@head-->', part('head'))
        .replace('<!--@header-->', part('header'))
        .replace('<!--@footer-->', part('footer'))
        .replace('<!--@final-->', part('final'))
        .replaceAll('<!--@logo-ink-->', logo(40, 'ink'))
        .replaceAll('<!--@logo-->', logo(36)));
    },
  };
}

// Application : toutes les URL /app/* servent app/index.html (développement)
// et reçoivent une copie statique au build (hébergement sans réécriture d'URL).
export function appRoutesPlugin() {
  return {
    name: 'scalify-app-routes',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const m = req.url.match(/^\/app\/([a-z-]+)\/?(\?.*)?$/);
        if (m && APP_ROUTES.includes(m[1])) req.url = `/app/index.html${m[2] || ''}`;
        next();
      });
    },
    writeBundle(opts) {
      const src = resolve(opts.dir, 'app/index.html');
      if (!existsSync(src)) return;
      for (const r of APP_ROUTES) {
        mkdirSync(resolve(opts.dir, `app/${r}`), { recursive: true });
        copyFileSync(src, resolve(opts.dir, `app/${r}/index.html`));
      }
    },
  };
}
