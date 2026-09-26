// Construit une version « un seul fichier » de la page (CSS et JS inclus,
// bibliothèques chargées depuis jsDelivr) : dist-artifact/ordra.html
import { build } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = (name) => JSON.parse(readFileSync(resolve(root, `node_modules/${name}/package.json`), 'utf8')).version;
const CDN = {
  gsap: `https://cdn.jsdelivr.net/npm/gsap@${pkg('gsap')}/index.js`,
  'gsap/ScrollTrigger': `https://cdn.jsdelivr.net/npm/gsap@${pkg('gsap')}/ScrollTrigger.js`,
  lenis: `https://cdn.jsdelivr.net/npm/lenis@${pkg('lenis')}/dist/lenis.mjs`,
  three: `https://cdn.jsdelivr.net/npm/three@${pkg('three')}/build/three.module.js`,
};

const outDir = resolve(root, 'dist-artifact/.tmp');
rmSync(outDir, { recursive: true, force: true });
// En fichier unique, core3d.js est inclus dans le bundle : on transforme son import
// statique de three en import dynamique pour que la bibliothèque reste chargée à la demande.
const lazyThree = {
  name: 'lazy-three',
  transform(code, id) {
    if (!id.endsWith('core3d.js')) return null;
    return code
      .replace("import * as THREE from 'three';", 'let THREE;')
      .replace(/export function startCore\(([^)]*)\) \{/, "export async function startCore($1) {\n  THREE = await import('three');");
  },
};

await build({
  root,
  configFile: false,
  plugins: [lazyThree],
  logLevel: 'warn',
  base: './',
  build: {
    outDir,
    emptyOutDir: true,
    cssCodeSplit: false,
    modulePreload: false,
    target: 'es2020',
    rollupOptions: {
      external: Object.keys(CDN),
      output: { paths: CDN, codeSplitting: false, format: 'es' },
    },
  },
});

const assets = resolve(outDir, 'assets');
const files = readdirSync(assets);
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(resolve(assets, f), 'utf8')).join('\n');
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(resolve(assets, f), 'utf8')).join('\n');

const src = readFileSync(resolve(root, 'index.html'), 'utf8');
const body = src
  .slice(src.indexOf('<body>') + 6, src.indexOf('</body>'))
  .replace(/<script type="module" src="[^"]*"><\/script>/, '')
  .trim();
const fonts = src.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/)[0];

const html = `<title>Ordra Dashboard IA</title>
<meta name="description" content="Ordra réunit vos données, vos tâches et vos opérations dans un dashboard piloté par l'IA." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
${fonts}
<style>
${css.replace(/<\/style/gi, '<\\/style')}
</style>
${body}
<script type="module">
${js.replace(/<\/script/gi, '<\\/script')}
</script>
`;
mkdirSync(resolve(root, 'dist-artifact'), { recursive: true });
writeFileSync(resolve(root, 'dist-artifact/ordra.html'), html);
rmSync(outDir, { recursive: true, force: true });
console.log(`dist-artifact/ordra.html — ${(html.length / 1024).toFixed(0)} Ko`);
