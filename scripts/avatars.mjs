// Génère les avatars illustrés (DiceBear « Notionists », licence CC0) en data URI.
// Usage : node scripts/avatars.mjs  →  src/data/avatars.js
import { createAvatar } from '@dicebear/core';
import { notionists } from '@dicebear/collection';
import { writeFileSync } from 'node:fs';

const people = {
  claire: 'd4ff3a', thomas: 'b9a7ff', ines: 'eaff8f', karim: 'ffd6a5', julie: 'c7f9cc', hugo: 'e0d4ff',
  sarah: 'd4ff3a', nicolas: 'ffe29a', lea: 'b9a7ff', mehdi: 'c7f9cc', emma: 'eaff8f', lucas: 'e0d4ff',
};
const out = Object.fromEntries(Object.entries(people).map(([seed, bg]) => [
  seed,
  'data:image/svg+xml;utf8,' + encodeURIComponent(createAvatar(notionists, { seed: seed + '-ordra', backgroundColor: [bg] }).toString()),
]));
writeFileSync('src/data/avatars.js', `// Généré par scripts/avatars.mjs — illustrations DiceBear Notionists (CC0 1.0)\nexport const AVATARS = ${JSON.stringify(out, null, 0)};\n`);
console.log(Object.keys(out).length, 'avatars');
