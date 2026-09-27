// Briques d'interface partagées : formats, toasts (avec annulation), menus, compteurs animés.
import { icon } from './icons.js';

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const esc = (v = '') => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fmt = {
  int: (v) => nf0.format(Math.round(v)),
  money: (v) => `${nf0.format(Math.round(v))} €`,
  pct: (v) => `${nf1.format(v)} %`,
  delta: (d) => `${d >= 0 ? '+' : '−'}${nf1.format(Math.abs(d * 100))} %`,
  by: (format, v) => (format === 'money' ? fmt.money(v) : format === 'pct' ? fmt.pct(v) : fmt.int(v)),
};

/** Badge de tendance (couleur + flèche + texte : jamais la couleur seule). */
export function trendBadge(delta, { invert = false } = {}) {
  const good = invert ? delta < 0 : delta >= 0;
  return `<span class="trend ${good ? 'is-good' : 'is-bad'}">${icon(delta >= 0 ? 'arrowUp' : 'arrowDown', 12)}${fmt.delta(delta)}</span>`;
}

/** Compteur animé (chiffres qui se construisent à l'affichage). */
export function countTo(el, to, format = 'int', duration = 900) {
  if (reduced()) { el.textContent = fmt.by(format, to); return; }
  const start = performance.now();
  const from = 0;
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const e = 1 - Math.pow(1 - t, 4);
    el.textContent = fmt.by(format, from + (to - from) * e);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ───────── Toasts ─────────
let host;
export function toast(message, { tone = 'default', action = null, timeout = 4200 } = {}) {
  if (!host) {
    host = document.createElement('div');
    host.className = 'toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  const ic = tone === 'success' ? 'check' : tone === 'error' ? 'alert' : tone === 'ai' ? 'spark' : 'info';
  el.innerHTML = `<span class="toast-ic">${icon(ic, 15)}</span><span class="toast-msg">${esc(message)}</span>${action ? `<button type="button" class="toast-act">${esc(action.label)}</button>` : ''}<button type="button" class="toast-x" aria-label="Fermer">${icon('x', 14)}</button>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  const close = () => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 250); };
  el.querySelector('.toast-x').addEventListener('click', close);
  if (action) el.querySelector('.toast-act').addEventListener('click', () => { action.run(); close(); });
  const t = setTimeout(close, timeout);
  el.addEventListener('pointerenter', () => clearTimeout(t), { once: true });
  return close;
}

// ───────── Menus déroulants ─────────
// <div data-menu> <button data-menu-btn aria-expanded="false"> <div data-menu-panel hidden>
export function initMenus(root = document) {
  root.querySelectorAll('[data-menu]').forEach((m) => {
    if (m.dataset.menuReady) return;
    m.dataset.menuReady = '1';
    const btn = m.querySelector('[data-menu-btn]');
    const panel = m.querySelector('[data-menu-panel]');
    const set = (open) => {
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      m.classList.toggle('is-open', open);
      if (open) panel.querySelector('button, a, input')?.focus({ preventScroll: true });
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(panel.hidden); });
    panel.addEventListener('click', (e) => { if (e.target.closest('[data-menu-close]')) set(false); });
    document.addEventListener('click', (e) => { if (!m.contains(e.target)) set(false); });
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
  });
}

/** Squelette de chargement (lignes grises animées). */
export const skeleton = (lines = 3, cls = '') => `<div class="skel ${cls}" aria-hidden="true">${Array.from({ length: lines }, (_, i) => `<i style="width:${[92, 76, 58, 84, 66][i % 5]}%"></i>`).join('')}</div>`;

/** Raccourcis clavier « g puis x » + simples. Ignore la saisie dans un champ. */
export function shortcuts(map) {
  let pending = null;
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (pending) {
      const fn = map[`${pending} ${k}`];
      pending = null;
      if (fn) { e.preventDefault(); fn(); }
      return;
    }
    if (Object.keys(map).some((c) => c.startsWith(`${k} `))) { pending = k; setTimeout(() => { pending = null; }, 900); return; }
    if (map[k]) { e.preventDefault(); map[k](); }
  });
}

/** Envoi de formulaire (FormSubmit ou autre point d'accès JSON). */
export async function sendForm(endpoint, kind, data, artifact = false) {
  if (!endpoint || artifact) { await wait(900); return true; }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ _subject: `Scalify · ${kind}`, form: kind, ...data, page: location.href }),
  });
  return res.ok;
}
