// Convertit dist/index.html (document complet) en fragment pour l'aperçu hébergé :
// l'hébergeur ajoute lui-même doctype, <head> et <body>.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]).join('\n');
const title = (html.match(/<title>[\s\S]*?<\/title>/) || [''])[0];
const desc = (html.match(/<meta name="description"[^>]*>/) || [''])[0];
const styles = pick(/<style[\s\S]*?<\/style>/g);
const scripts = pick(/<script[\s\S]*?<\/script>/g);
const body = (html.match(/<body>([\s\S]*?)<\/body>/) || ['', ''])[1].replace(/<script[\s\S]*?<\/script>/g, '');
const out = [title, desc, styles, body.trim(), scripts].join('\n');
mkdirSync(new URL('../artifact/', import.meta.url), { recursive: true });
writeFileSync(new URL('../artifact/index.html', import.meta.url), out);
console.log('artifact/index.html', (out.length / 1024).toFixed(0) + ' Ko');
