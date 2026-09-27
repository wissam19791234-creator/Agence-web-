// Identité Scalify : pastille ronde contour noir, « S » en paliers (croissance) + point bleu (IA).
import { CONFIG } from '../config.js';

export const BRAND = CONFIG.brand;

/** Monogramme seul (pastille). `tone` : 'paper' (fond blanc) ou 'ink' (fond noir, pour les bandes sombres). */
export function logoMark(size = 32, tone = 'paper') {
  const bg = tone === 'ink' ? '#000' : '#fff';
  const fg = tone === 'ink' ? '#fff' : '#000';
  const ring = tone === 'ink' ? '#fff' : '#000';
  return `<svg class="logo-mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <circle cx="16" cy="16" r="15.2" fill="${bg}" stroke="${ring}" stroke-width="1.4"/>
    <path d="M21 10.8H13.9a2.85 2.85 0 0 0 0 5.7h4.3a2.85 2.85 0 0 1 0 5.7H11" fill="none" stroke="${fg}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="22.4" cy="21.8" r="2" fill="#4da2ff" stroke="${ring}" stroke-width=".8"/>
  </svg>`;
}

/** Logo complet (pastille + nom en capitales). */
export function logo(size = 34, tone = 'paper') {
  return `<span class="logo">${logoMark(size, tone)}<span class="logo-word">${BRAND}</span></span>`;
}
