// Convertit dist-artifact/index.html (document complet) en fragment pour la page hébergée :
// l'hébergeur ajoute lui-même doctype, <head> et <body>. Les photos restent des fichiers publiés à côté de la page :
// le code les cherche relativement à l'adresse de la page (new URL(nom, import.meta.url)), donc à la racine.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
const src = new URL('../dist-artifact/', import.meta.url);
const out = new URL('../artifact/', import.meta.url);
const html = readFileSync(new URL('index.html', src), 'utf8');
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]).join('\n');
const title = (html.match(/<title>[\s\S]*?<\/title>/) || [''])[0];
const desc = (html.match(/<meta name="description"[^>]*>/) || [''])[0];
const styles = pick(/<style[\s\S]*?<\/style>/g);
const scripts = pick(/<script[\s\S]*?<\/script>/g);
const body = (html.match(/<body>([\s\S]*?)<\/body>/) || ['', ''])[1].replace(/<script[\s\S]*?<\/script>/g, '');
const page = [title, desc, styles, body.trim(), scripts].join('\n');
mkdirSync(new URL('assets/', out), { recursive: true });
writeFileSync(new URL('index.html', out), page);
const files = {};
for (const f of readdirSync(new URL('assets/', src))) {
  copyFileSync(new URL(`assets/${f}`, src), new URL(`assets/${f}`, out));
  files[f] = `artifact/assets/${f}`;
}
writeFileSync(new URL('files.json', out), JSON.stringify(files, null, 2));
console.log('artifact/index.html', (page.length / 1024).toFixed(0) + ' Ko,', Object.keys(files).length, 'fichiers à côté');
