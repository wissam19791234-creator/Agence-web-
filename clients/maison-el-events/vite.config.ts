import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build` : un seul fichier HTML (JS, CSS, polices et photos inline).
// `vite build --mode artifact` : JS, CSS et polices inline, photos à part (dist-artifact/assets),
// pour une page hébergée légère dont les photos se chargent au fil du défilement.
export default defineConfig(({ mode }) => mode === 'artifact'
  ? {
    base: './',
    plugins: [react(), viteSingleFile({ useRecommendedBuildConfig: false })],
    build: {
      outDir: 'dist-artifact', target: 'es2019', cssCodeSplit: false,
      assetsInlineLimit: (file: string) => !/\.(webp|jpe?g|png)$/i.test(file),
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  }
  : {
    plugins: [react(), viteSingleFile()],
    build: { assetsInlineLimit: 100_000_000, cssCodeSplit: false, target: 'es2019' },
  });
