import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { seoPlugin } from './scripts/seo-plugin.mjs';
import { partialsPlugin, appRoutesPlugin, PAGES } from './scripts/partials-plugin.mjs';

// Site multi-pages : chaque page a son dossier (/pricing/, /app/…).
// base '/' : le site est prévu pour être servi à la racine du domaine.
export default defineConfig({
  base: '/',
  plugins: [partialsPlugin(), seoPlugin(), appRoutesPlugin()],
  define: { __ARTIFACT__: 'false' },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: Object.fromEntries(PAGES.map((p) => [p, resolve(import.meta.dirname, p === 'index' ? 'index.html' : `${p}/index.html`)])),
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
        },
      },
    },
  },
});
