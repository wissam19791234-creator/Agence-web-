// Liens entre les pages. En production : URL propres (/pricing/, /app/analytics/…).
// Dans l'aperçu publié (fichiers HTML uniques), les pages sont des fichiers à plat
// et les vues de l'application passent par le fragment (#/analytics).
/* global __ARTIFACT__ */
export const IS_ARTIFACT = typeof __ARTIFACT__ !== 'undefined' && __ARTIFACT__;

const FLAT = {
  '/': 'index.html', '/product/': 'product.html', '/features/': 'features.html', '/pricing/': 'pricing.html',
  '/security/': 'security.html', '/resources/': 'resources.html', '/login/': 'login.html', '/signup/': 'signup.html',
  '/app/': 'app.html',
};

/** Convertit un chemin de production en lien valable dans le contexte courant. */
export function href(path) {
  if (!IS_ARTIFACT) return path;
  const [pathQ, hash = ''] = path.split('#');
  const [base, query = ''] = pathQ.split('?');
  const q = query ? `?${query}` : '';
  const h = hash ? `#${hash}` : '';
  if (base.startsWith('/app/') && base !== '/app/') return `app.html#/${base.slice(5).replace(/\/$/, '')}`;
  if (base.endsWith('.html')) return `${base.replace(/^\//, '')}${q}${h}`;
  const flat = FLAT[base] ?? FLAT[`${base}/`];
  if (flat == null) return path;
  return `${flat}${q}${h}`;
}

/** Réécrit tous les liens internes de la page (href commençant par « / ») et les images /media/. */
export function rewriteLinks(root = document) {
  if (!IS_ARTIFACT) return;
  root.querySelectorAll('a[href^="/"]').forEach((a) => { a.setAttribute('href', href(a.getAttribute('href'))); });
  root.querySelectorAll('img[src^="/media/"], source[src^="/media/"], video[poster^="/media/"]').forEach((el) => {
    if (el.getAttribute('src')) el.setAttribute('src', el.getAttribute('src').slice(1));
    if (el.getAttribute('poster')) el.setAttribute('poster', el.getAttribute('poster').slice(1));
  });
}

/** Chemin d'un fichier média selon le contexte (production ou aperçu publié). */
export const media = (file) => (IS_ARTIFACT ? `media/${file}` : `/media/${file}`);
