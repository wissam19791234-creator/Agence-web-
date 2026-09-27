import { defineConfig } from 'vite';
import { seoPlugin } from './scripts/seo-plugin.mjs';

export default defineConfig({
  base: './',
  plugins: [seoPlugin()],
  define: { __ARTIFACT__: 'false' },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'gsap';
        },
      },
    },
  },
});
