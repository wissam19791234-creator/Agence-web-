// Copie la version légère (dist-artifact) dans docs/maison-el-events/ à la racine du dépôt,
// pour GitHub Pages : page + photos dans le même dossier, exclue des moteurs de recherche (démonstration).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
const src = new URL('../dist-artifact/', import.meta.url);
const docs = new URL('../../../docs/', import.meta.url);
const out = new URL('maison-el-events/', docs);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const html = readFileSync(new URL('index.html', src), 'utf8')
  .replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow" />');
writeFileSync(new URL('index.html', out), html);
let n = 0;
for (const f of readdirSync(new URL('assets/', src))) { copyFileSync(new URL(`assets/${f}`, src), new URL(f, out)); n++; }
writeFileSync(new URL('.nojekyll', docs), '');
console.log(`docs/maison-el-events/index.html (${(html.length / 1024).toFixed(0)} Ko) + ${n} photos`);
