// Images de démonstration intégrées au site : src/assets/demo/<emplacement>.webp
// (visuels générés pour la démonstration, signalés comme tels). Une photo importée dans l'espace pro passe toujours devant.
// Une variante <emplacement>@m (portrait) est servie aux écrans étroits si elle existe.
const photoFiles = import.meta.glob('../assets/demo/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const PHOTOS = Object.fromEntries(Object.entries(photoFiles).map(([p, url]) => [p.split('/').pop()!.replace(/\.(jpe?g|png|webp)$/i, ''), url]));

// Emplacements qui reprennent le visuel le plus proche.
const ALIAS: Record<string, string> = {
  'gal-table': 'cover', 'gal-coin-maries': 'coin-maries', 'gal-buffet': 'svc-buffets', 'gal-mocktails': 'menu-mocktail',
  'gal-bouchees': 'menu-sale', 'gal-verrines': 'menu-sucre', 'gal-anniversaire': 'evt-anniversaire',
  'svc-traiteur': 'menu-sale', 'svc-mignardises': 'menu-sucre', faq: 'about',
};

export interface DemoImage { url: string; mobile?: string }

export function demoImage(key?: string): DemoImage | undefined {
  if (!key) return undefined;
  for (const k of [key, ALIAS[key]].filter(Boolean) as string[]) {
    if (PHOTOS[k]) return { url: PHOTOS[k], mobile: PHOTOS[`${k}@m`] };
  }
  return undefined;
}

export const demoLabel = (_d?: DemoImage) => 'Visuel de démonstration';
