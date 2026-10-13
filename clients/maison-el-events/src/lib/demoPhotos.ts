// Photos de démonstration intégrées au site.
// Déposez un fichier dans src/assets/demo/ en le nommant comme l'emplacement
// (cover.jpg, coin-maries.jpg, menu-sucre.jpg, svc-buffets.jpg…) : il est repris automatiquement
// et affiché avec la mention « Photo de démonstration ». Une photo importée dans l'espace pro passe devant.
const files = import.meta.glob('../assets/demo/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const DEMO_PHOTOS: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace(/\.(jpe?g|png|webp)$/i, ''), url]),
);
