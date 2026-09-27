// Stickers plats à contour noir (esprit « album de stickers ») : aplats de la palette,
// placés en collage autour des grands titres. Purement décoratifs (aria-hidden).
const C = { blue: '#4da2ff', mint: '#55db9c', lav: '#e9ccff', ember: '#fb4903', sun: '#ffd731', violet: '#5c4ade', white: '#ffffff', ink: '#000000' };
const S = `stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;

const ART = {
  coin: `<circle cx="50" cy="50" r="40" fill="${C.sun}" ${S}/><circle cx="50" cy="50" r="30" fill="none" ${S}/>
    <path d="M61 37a16 16 0 1 0 0 26" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><path d="M32 46h22M32 55h19" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`,
  rocket: `<path d="M50 8c15 10 21 27 18 48l-8 12H40l-8-12C29 35 35 18 50 8z" fill="${C.ember}" ${S}/>
    <circle cx="50" cy="38" r="9" fill="${C.white}" ${S}/>
    <path d="M32 56l-12 13 14 3 6-4M68 56l12 13-14 3-6-4" fill="${C.violet}" ${S}/>
    <path d="M42 70c0 10 4 16 8 22 4-6 8-12 8-22z" fill="${C.sun}" ${S}/>`,
  spark: `<path d="M44 10c3 20 12 30 34 33-22 3-31 13-34 33-3-20-12-30-34-33 22-3 31-13 34-33z" fill="${C.violet}" ${S}/>
    <path d="M78 58c1.6 8 5 12 13 13-8 1-11.4 5-13 13-1.6-8-5-12-13-13 8-1 11.4-5 13-13z" fill="${C.lav}" ${S}/>`,
  check: `<rect x="12" y="12" width="76" height="76" rx="24" fill="${C.mint}" ${S}/><path d="M31 51l13 13 26-28" fill="none" stroke="${C.ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  bolt: `<path d="M58 6L20 56h24l-6 38 42-54H54z" fill="${C.sun}" ${S}/>`,
  bell: `<path d="M26 66V46a24 24 0 0 1 48 0v20l8 10H18z" fill="${C.ember}" ${S}/><path d="M41 82a9 9 0 0 0 18 0" fill="${C.white}" ${S}/><circle cx="50" cy="16" r="5" fill="${C.ember}" ${S}/>`,
  chart: `<rect x="10" y="14" width="80" height="72" rx="18" fill="${C.white}" ${S}/>
    <rect x="24" y="52" width="12" height="22" rx="4" fill="${C.lav}" ${S}/><rect x="44" y="38" width="12" height="36" rx="4" fill="${C.blue}" ${S}/><rect x="64" y="26" width="12" height="48" rx="4" fill="${C.ember}" ${S}/>`,
  target: `<circle cx="50" cy="50" r="40" fill="${C.white}" ${S}/><circle cx="50" cy="50" r="28" fill="${C.ember}" ${S}/><circle cx="50" cy="50" r="16" fill="${C.white}" ${S}/><circle cx="50" cy="50" r="6" fill="${C.ink}"/>`,
  chat: `<path d="M16 22a12 12 0 0 1 12-12h44a12 12 0 0 1 12 12v32a12 12 0 0 1-12 12H46L28 82V66a12 12 0 0 1-12-12z" fill="${C.lav}" ${S}/><circle cx="36" cy="38" r="5" fill="${C.ink}"/><circle cx="50" cy="38" r="5" fill="${C.ink}"/><circle cx="64" cy="38" r="5" fill="${C.ink}"/>`,
  doc: `<path d="M22 8h40l18 18v66H22z" fill="${C.white}" ${S}/><path d="M62 8v18h18" fill="${C.lav}" ${S}/><path d="M34 44h32M34 56h32M34 68h20" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>`,
  lock: `<rect x="18" y="42" width="64" height="48" rx="14" fill="${C.sun}" ${S}/><path d="M32 42V32a18 18 0 0 1 36 0v10" fill="none" ${S} stroke-width="6"/><circle cx="50" cy="64" r="6" fill="${C.ink}"/>`,
  trend: `<circle cx="50" cy="50" r="40" fill="${C.mint}" ${S}/><path d="M26 64l16-16 10 10 22-22" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 36h14v14" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  heart: `<path d="M50 84S12 62 12 36a18 18 0 0 1 38-8 18 18 0 0 1 38 8c0 26-38 48-38 48z" fill="${C.ember}" ${S}/>`,
  free: `<path d="${burst(50, 50, 46, 36, 14)}" fill="${C.sun}" ${S}/><text x="50" y="58" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="22" fill="${C.ink}">GRATUIT</text>`,
  new: `<path d="${burst(50, 50, 46, 38, 16)}" fill="${C.mint}" ${S}/><text x="50" y="58" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="22" fill="${C.ink}">NOUVEAU</text>`,
  star: `<path d="${burst(50, 50, 44, 20, 5)}" fill="${C.sun}" ${S}/>`,
};

function burst(cx, cy, R, r, n) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const rad = i % 2 ? r : R;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

/**
 * Un sticker. `rot` en degrés, `size` en px (ou toute valeur CSS), `cls` pour le placement.
 */
export function sticker(name, { size = 72, rot = 0, cls = '', style = '' } = {}) {
  const s = typeof size === 'number' ? `${size}px` : size;
  return `<span class="stk stk--${name} ${cls}" style="--s:${s};--r:${rot}deg;${style}" aria-hidden="true"><svg viewBox="0 0 100 100" width="100%" height="100%" focusable="false">${ART[name] || ART.star}</svg></span>`;
}

/** Remplit les éléments `<span data-stk="coin" data-rot="-12" data-size="80"></span>` du HTML statique. */
export function hydrateStickers(root = document) {
  root.querySelectorAll('[data-stk]').forEach((el) => {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const tmp = document.createElement('div');
    tmp.innerHTML = sticker(el.dataset.stk, { size: el.dataset.size ? +el.dataset.size : 72, rot: +(el.dataset.rot || 0), cls: el.className });
    el.replaceWith(tmp.firstElementChild);
  });
}
