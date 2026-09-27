// Plugin Vite : injecte les fragments partagés (<head>, en-tête, pied de page, logo)
// dans chaque page HTML, au développement comme au build.
import { readFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logo } from '../src/shared/brand.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const part = (n) => readFileSync(resolve(root, `src/partials/${n}.html`), 'utf8');

export const APP_ROUTES = ['overview', 'analytics', 'ai', 'insights', 'automations', 'reports', 'goals', 'settings'];
export const PAGES = ['index', 'product', 'features', 'pricing', 'security', 'resources', 'login', 'signup', 'app'];

export function partialsPlugin() {
  return {
    name: 'scalify-partials',
    enforce: 'pre',
    transformIndexHtml(html) {
      return html
        .replace('<!--@head-->', part('head'))
        .replace('<!--@header-->', part('header'))
        .replace('<!--@footer-->', part('footer'))
        .replaceAll('<!--@logo-->', logo(26));
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
