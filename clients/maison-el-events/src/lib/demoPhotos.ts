// Images de démonstration intégrées au site.
// - src/assets/demo/<emplacement>.jpg : vraies photos (prioritaires), mention « Photo de démonstration ».
// - src/assets/demo3d/<emplacement>.jpg : visuels 3D rendus par scripts/render3d, mention « Visuel 3D de démonstration ».
// Une variante <emplacement>@m.jpg (format portrait) est servie aux écrans étroits.
// Une photo importée dans l'espace pro passe toujours devant.
const photoFiles = import.meta.glob('../assets/demo/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const renderFiles = import.meta.glob('../assets/demo3d/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const byKey = (files: Record<string, string>) => Object.fromEntries(Object.entries(files).map(([p, url]) => [p.split('/').pop()!.replace(/\.(jpe?g|png|webp)$/i, ''), url]));
const PHOTOS = byKey(photoFiles);
const RENDERS = byKey(renderFiles);

// Emplacements sans visuel propre : ils reprennent la scène la plus proche.
const ALIAS: Record<string, string> = {
  'gal-table': 'svc-deco-tables', 'gal-coin-maries': 'coin-maries', 'gal-buffet': 'svc-buffets', 'gal-mocktails': 'menu-mocktail',
  'gal-bouchees': 'menu-sale', 'svc-traiteur': 'menu-sale', 'gal-anniversaire': 'faq', 'svc-mignardises': 'menu-sucre',
};

export interface DemoImage { url: string; mobile?: string; kind: 'photo' | '3d' }

export function demoImage(key?: string): DemoImage | undefined {
  if (!key) return undefined;
  for (const k of [key, ALIAS[key]].filter(Boolean) as string[]) {
    if (PHOTOS[k]) return { url: PHOTOS[k], mobile: PHOTOS[`${k}@m`], kind: 'photo' };
    if (RENDERS[k]) return { url: RENDERS[k], mobile: RENDERS[`${k}@m`], kind: '3d' };
  }
  return undefined;
}

export const demoLabel = (d: DemoImage) => (d.kind === '3d' ? 'Visuel 3D de démonstration' : 'Photo de démonstration');
