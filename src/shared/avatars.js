// Avatars illustrés (style stickers : aplats de la palette, contour noir).
// Volontairement dessinés : on n'utilise jamais de fausses photos de personnes.
const C = { blue: '#4da2ff', mint: '#55db9c', lav: '#e9ccff', ember: '#fb4903', sun: '#ffd731', violet: '#5c4ade', sky: '#dceeff', white: '#ffffff', ink: '#000000' };
const SKIN = ['#f6d3b8', '#e8b48f', '#c98d63', '#9a6440', '#6e4428'];
const HAIR = ['#000000', '#3b2417', '#7a4a24', '#d9a441', '#b8b8b8'];
const S = `stroke="${C.ink}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

const HAIR_BACK = {
  long: (h) => `<path d="M29 48C27 24 41 17 52 18c15 1 22 13 19 30l2 28c-9 5-37 5-46 0z" fill="${h}" ${S}/>`,
  curly: (h) => [[35, 36], [41, 27], [51, 23], [61, 27], [67, 36], [69, 46], [31, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.5" fill="${h}" ${S}/>`).join(''),
  bun: (h) => `<circle cx="50" cy="19" r="9" fill="${h}" ${S}/>`,
};
const HAIR_FRONT = {
  short: (h) => `<path d="M33 45c-3-18 8-25 18-25 12 0 19 8 16 25-5-8-15-11-25-8-4 2-7 5-9 8z" fill="${h}" ${S}/>`,
  long: (h) => `<path d="M33 43c1-14 12-19 22-17 7 2 11 8 12 17-9-8-22-9-34 0z" fill="${h}" ${S}/>`,
  bun: (h) => `<path d="M33 44c0-15 9-21 18-21s17 6 17 21c-6-7-14-9-20-8-7 1-12 4-15 8z" fill="${h}" ${S}/>`,
  curly: () => '',
  bald: () => '',
};

/**
 * Avatar SVG déterministe.
 * `look` : { bg, shirt, skin (0-4), hair (0-4), style ('short'|'long'|'bun'|'curly'|'bald'), glasses, beard }
 */
export function avatar(look = {}, { size = 64, label = '' } = {}) {
  const { bg = 'sky', shirt = 'violet', skin = 0, hair = 0, style = 'short', glasses = false, beard = false } = look;
  const h = HAIR[hair] || HAIR[0];
  const sk = SKIN[skin] || SKIN[0];
  const id = `av${Math.random().toString(36).slice(2, 8)}`;
  const face = `
    ${(HAIR_BACK[style] || (() => ''))(h)}
    <path d="M16 104c2-22 16-32 34-32s32 10 34 32z" fill="${C[shirt] || shirt}" ${S}/>
    <path d="M44 62h12v12c-3 3-9 3-12 0z" fill="${sk}" ${S}/>
    <ellipse cx="50" cy="47" rx="17" ry="20" fill="${sk}" ${S}/>
    ${beard ? `<path d="M33.5 50c2 14 9 17 16.5 17s14.5-3 16.5-17c-4 6-10 8-16.5 8s-12.5-2-16.5-8z" fill="${h}" ${S}/>` : ''}
    ${(HAIR_FRONT[style] || (() => ''))(h)}
    <circle cx="43.5" cy="48" r="2.2" fill="${C.ink}"/><circle cx="56.5" cy="48" r="2.2" fill="${C.ink}"/>
    ${glasses ? `<circle cx="43.5" cy="48" r="6" fill="none" ${S}/><circle cx="56.5" cy="48" r="6" fill="none" ${S}/><path d="M49.5 48h1" ${S}/>` : ''}
    <path d="M44.5 ${beard ? 58 : 56.5}q5.5 5 11 0" fill="none" ${S}/>`;
  const s = typeof size === 'number' ? `${size}px` : size;
  return `<span class="av" style="--av:${s}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}><svg viewBox="0 0 100 100" width="100%" height="100%" focusable="false">
    <defs><clipPath id="${id}"><circle cx="50" cy="50" r="48"/></clipPath></defs>
    <circle cx="50" cy="50" r="48" fill="${C[bg] || bg}"/>
    <g clip-path="url(#${id})">${face}</g>
    <circle cx="50" cy="50" r="48" fill="none" stroke="${C.ink}" stroke-width="2"/></svg></span>`;
}
