// Identité Scalify : monogramme « S » en paliers (croissance) + point IA.
import { CONFIG } from '../config.js';

export const BRAND = CONFIG.brand;

/** Monogramme seul. `tone` : 'accent' (tuile citron) ou 'mono' (contour). */
export function logoMark(size = 28, tone = 'accent') {
  const tile = tone === 'accent'
    ? '<rect width="32" height="32" rx="9" fill="var(--accent, #c6f432)"/>'
    : '<rect x=".75" y=".75" width="30.5" height="30.5" rx="8.5" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="1.5"/>';
  const ink = tone === 'accent' ? 'var(--accent-ink, #0a0b0d)' : 'currentColor';
  return `<svg class="logo-mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    ${tile}
    <path d="M21.5 10.5H13.6a3 3 0 0 0 0 6h4.8a3 3 0 0 1 0 6H10.5" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="23.2" cy="21.9" r="1.9" fill="${ink}"/>
  </svg>`;
}

/** Logo complet (monogramme + nom). */
export function logo(size = 28) {
  return `<span class="logo">${logoMark(size)}<span class="logo-word">${BRAND}</span></span>`;
}
