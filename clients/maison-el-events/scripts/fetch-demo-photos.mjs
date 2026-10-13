// Télécharge les photos de démonstration générées (Higgsfield), les compresse
// et les place dans src/assets/demo/<emplacement>.jpg pour le build.
// Usage : node scripts/fetch-demo-photos.mjs   (nécessite l'accès réseau au domaine des images)
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const B = 'https://d8j0ntlcm91z4.cloudfront.net/user_3FgecDpn8aytEAgyeQ4JQnQETO9/';
const PHOTOS = {
  'hf_20261013_204120_51efe7b1-2eae-4594-a25f-8401ed4fdd01.png': ['cover', 'gal-centre'],
  'hf_20261013_204121_b4941696-bc97-4716-8906-fce83677a1b8.png': ['coin-maries', 'gal-coin-maries'],
  'hf_20261013_204120_0dd486b8-48eb-4ff0-ac4b-d210b0012bd6.png': ['svc-deco-tables', 'gal-table'],
  'hf_20261013_204120_d2b92368-a477-410a-a692-27b1f9eed116.png': ['menu-sucre', 'gal-verrines'],
  'hf_20261013_204132_b8472ffa-7f2b-4a45-8a75-c74498a9d508.png': ['menu-sale', 'svc-traiteur', 'gal-bouchees'],
  'hf_20261013_204132_ca4de50a-7ffe-4f79-b3d3-698e6ab40608.png': ['menu-mocktail', 'gal-mocktails'],
  'hf_20261013_204347_f15cc01f-611a-41e1-a476-1250b4e7d122.png': ['svc-buffets', 'gal-buffet'],
  'hf_20261013_204347_49bffad9-31ba-4296-8fd1-300431a69e3f.png': ['gal-arche'],
};

const dir = new URL('../src/assets/demo/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [file, keys] of Object.entries(PHOTOS)) {
  let res;
  try { res = await fetch(B + file); } catch (e) { console.error('Réseau indisponible pour', file, '·', e.cause?.code ?? e.message); continue; }
  if (!res.ok) { console.error('Échec', file, res.status); continue; }
  const jpg = await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 1100, withoutEnlargement: true }).jpeg({ quality: 76, mozjpeg: true }).toBuffer();
  for (const k of keys) writeFileSync(new URL(`${k}.jpg`, dir), jpg);
  console.log(keys.join(', '), Math.round(jpg.length / 1024) + ' Ko');
}
