import '../styles/tokens.css';
import '../styles/product.css';
import '../styles/app.css';

import { api } from '../shared/api.js';
import { logoMark } from '../shared/brand.js';
import { mountCopilot } from '../shared/copilot-ui.js';
import { hydrateStickers } from '../shared/stickers.js';
import { icon } from '../shared/icons.js';
import { IS_ARTIFACT, rewriteLinks, href } from '../shared/paths.js';
import { esc, initMenus, shortcuts, skeleton, toast, reduced } from '../shared/ui.js';
import { ROUTES } from './routes.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const view = $('#view');

// ───────── Icônes et marque dans le HTML statique ─────────
function hydrateIcons(root = document) {
  $$('[data-ic]', root).forEach((el) => { if (!el.innerHTML.trim()) el.innerHTML = icon(el.dataset.ic, 16); });
  $$('[data-logo-mark-sm]', root).forEach((el) => { el.innerHTML = logoMark(26); });
  hydrateStickers(root);
}

// ───────── Navigation latérale ─────────
function renderNav() {
  $('[data-nav]').innerHTML = `
    ${ROUTES.filter((r) => r.nav).map((r) => `
      <a class="side-link" href="${href(`/app/${r.id}/`)}" data-route="${r.id}">${icon(r.icon, 16)}<span>${r.title}</span>${r.badge ? `<em data-badge="${r.id}">${r.badge}</em>` : ''}${r.key ? `<kbd class="side-kbd">G ${r.key.toUpperCase()}</kbd>` : ''}</a>`).join('')}`;
}

// ───────── Routeur ─────────
function currentRoute() {
  const hash = location.hash.match(/^#\/([a-z]+)/);
  if (hash) return hash[1];
  const m = location.pathname.match(/\/app\/([a-z]+)/);
  return m && ROUTES.some((r) => r.id === m[1]) ? m[1] : 'overview';
}
let active = null;
const ctx = { route: 'overview', metric: null };

export async function go(id, { push = true, anchor = null } = {}) {
  const r = ROUTES.find((x) => x.id === id) || ROUTES[0];
  if (push) {
    if (IS_ARTIFACT) history.pushState({ id: r.id }, '', `#/${r.id}${anchor ? `/${anchor}` : ''}`);
    else history.pushState({ id: r.id }, '', `/app/${r.id}/${anchor ? `#${anchor}` : ''}`);
  }
  ctx.route = r.id;
  ctx.metric = null;
  document.title = `${r.title} · Scalify`;
  $$('.side-link[data-route]').forEach((a) => { if (a.dataset.route === r.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('[data-crumbs]').innerHTML = `<a href="${href('/app/overview/')}" data-route="overview">Maison Demo</a>${icon('chevron', 12)}<span aria-current="page">${r.title}</span>`;
  $('[data-ask-ctx]').textContent = `Contexte : ${r.title}`;
  closeSide();
  active?.destroy?.();
  view.innerHTML = `<div class="view-in">${skeleton(2, 'skel--title')}<div class="grid-skel">${skeleton(3, 'skel--block')}${skeleton(3, 'skel--block')}${skeleton(3, 'skel--block')}</div></div>`;
  const token = Symbol('nav');
  go.token = token;
  try {
    const mod = r.view;
    const el = document.createElement('div');
    el.className = `view-in view--${r.id}`;
    const instance = await mod.render(el, appCtx);
    if (go.token !== token) return;
    view.replaceChildren(el);
    hydrateIcons(el);
    rewriteLinks(el);
    initMenus(el);
    active = instance;
    if (anchor) el.querySelector(`#${anchor}`)?.scrollIntoView({ block: 'start' });
    else view.scrollTo?.(0, 0), window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
  } catch (err) {
    console.error(err);
    view.innerHTML = `<div class="view-in"><div class="empty"><span class="empty-ic">${icon('alert', 22)}</span><h2>Cette page n’a pas pu se charger.</h2><p>Vérifiez votre connexion puis réessayez.</p><button type="button" class="btn btn--secondary" data-retry>Réessayer</button></div></div>`;
    $('[data-retry]', view).addEventListener('click', () => go(r.id, { push: false }));
  }
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-route]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  const anchor = (a.getAttribute('href') || '').split('#')[1] || null;
  go(a.dataset.route, { anchor: anchor && !anchor.startsWith('/') ? anchor : null });
});
window.addEventListener('popstate', () => go(currentRoute(), { push: false }));

// ───────── Barre latérale mobile ─────────
const side = $('[data-side]');
const scrim = $('[data-scrim]');
function openSide() { side.classList.add('is-open'); scrim.hidden = false; }
function closeSide() { side.classList.remove('is-open'); scrim.hidden = true; }
$('[data-side-toggle]').addEventListener('click', openSide);
scrim.addEventListener('click', closeSide);

// ───────── Copilot global ─────────
const ask = $('[data-ask]');
let cp = null;
function openAsk(q = null, extra = {}) {
  ask.hidden = false;
  requestAnimationFrame(() => ask.classList.add('is-open'));
  document.body.classList.add('has-ask');
  if (extra.metric) $('[data-ask-ctx]').textContent = `Contexte : ${api.metricSync(extra.metric).label}`;
  if (!cp) {
    cp = mountCopilot($('[data-ask-cp]'), {
      compact: true,
      intro: 'Je vois la page ouverte et ses données. Posez votre question, ou sélectionnez un chiffre à l’écran.',
      context: () => ({ page: ctx.route }),
    });
  }
  if (q) cp.ask(q, extra); else setTimeout(() => cp.focus(), 60);
}
function closeAsk() {
  ask.classList.remove('is-open');
  document.body.classList.remove('has-ask');
  setTimeout(() => { ask.hidden = true; }, 250);
}
$$('[data-ask-open]').forEach((b) => b.addEventListener('click', () => (ask.hidden ? openAsk() : closeAsk())));
$('[data-ask-close]').addEventListener('click', closeAsk);

// Sélection d'une donnée → « Expliquer ceci »
const selBtn = $('[data-sel-ask]');
document.addEventListener('mouseup', () => {
  setTimeout(() => {
    const s = window.getSelection();
    const text = s?.toString().trim();
    if (!text || text.length > 80 || !view.contains(s.anchorNode)) { selBtn.hidden = true; return; }
    const r = s.getRangeAt(0).getBoundingClientRect();
    selBtn.style.left = `${Math.max(8, r.left + r.width / 2 - 60)}px`;
    selBtn.style.top = `${Math.max(8, r.top - 44)}px`;
    selBtn.dataset.text = text;
    selBtn.hidden = false;
  }, 10);
});
selBtn.addEventListener('mousedown', (e) => e.preventDefault());
selBtn.addEventListener('click', () => {
  selBtn.hidden = true;
  openAsk(`Explique : « ${selBtn.dataset.text} »`);
  window.getSelection()?.removeAllRanges();
});
document.addEventListener('scroll', () => { selBtn.hidden = true; }, { passive: true, capture: true });

// ───────── Fenêtre modale générique ─────────
const modal = $('[data-modal]');
const modalBox = $('[data-modal-box]');
let lastFocus = null;
export function openModal(html, { label = 'Fenêtre', wide = false, onMount } = {}) {
  lastFocus = document.activeElement;
  modalBox.className = `modal ${wide ? 'modal--wide' : ''}`;
  modalBox.setAttribute('aria-label', label);
  modalBox.innerHTML = `<button type="button" class="modal-x btn btn--ghost btn--icon btn--sm" data-modal-close aria-label="Fermer">${icon('x', 16)}</button>${html}`;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  hydrateIcons(modalBox);
  rewriteLinks(modalBox);
  onMount?.(modalBox);
  (modalBox.querySelector('[autofocus], input, button:not(.modal-x)') || modalBox.querySelector('.modal-x')).focus();
}
export function closeModal() {
  modal.classList.remove('is-open');
  setTimeout(() => { modal.hidden = true; modalBox.innerHTML = ''; }, 180);
  lastFocus?.focus?.();
}
modal.addEventListener('click', (e) => { if (e.target.closest('[data-modal-close]')) closeModal(); });
modal.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const f = $$('a[href], button:not([disabled]), input, select, textarea', modalBox).filter((x) => !x.closest('[hidden]'));
  if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
  else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
});

// ───────── Briefing du jour ─────────
async function openBriefing() {
  const b = await api.briefing();
  const d = new Date();
  const hour = d.getHours();
  const hello = hour < 12 ? 'Bonjour.' : hour < 18 ? 'Bon après-midi.' : 'Bonsoir.';
  openModal(`
    <div class="brief">
      <p class="brief-date mono">${new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)}</p>
      <h2>${hello}</h2>
      <p class="brief-lead">Voici ce qui a changé pendant votre absence.</p>
      <div class="brief-cols">
        <section><h3><span class="brief-n">3</span>Changements importants</h3><ul>${b.changes.map((c) => `<li>${icon('activity', 14)}${esc(c)}</li>`).join('')}</ul></section>
        <section><h3><span class="brief-n is-opp">2</span>Opportunités</h3><ul>${b.opportunities.map((c) => `<li>${icon('bolt', 14)}${esc(c)}</li>`).join('')}</ul></section>
        <section><h3><span class="brief-n is-warn">1</span>Point d’attention</h3><ul><li class="is-warn">${icon('alert', 14)}${esc(b.issue)}</li></ul></section>
      </div>
      <div class="brief-a">
        <button type="button" class="btn btn--primary" data-brief-ai>${icon('spark', 15)}Que dois-je faire en premier ?</button>
        <button type="button" class="btn btn--ghost" data-modal-close>Plus tard</button>
      </div>
      <p class="brief-foot">${icon('calendar', 13)} Envoyé aussi par email chaque matin à 8 h · <a href="/app/automations/" data-route="automations" data-modal-close>Modifier</a></p>
    </div>`, {
    label: 'Briefing du jour',
    wide: true,
    onMount: (box) => box.querySelector('[data-brief-ai]').addEventListener('click', () => { closeModal(); openAsk('Sur quoi dois-je me concentrer aujourd’hui ?'); }),
  });
  try { localStorage.setItem('scalify-brief', new Date().toDateString()); } catch { /* ignore */ }
}
$$('[data-briefing-open]').forEach((b) => b.addEventListener('click', openBriefing));

// ───────── Raccourcis ─────────
function openShortcuts() {
  const rows = [
    ['⌘ K', 'Recherche globale'], ['⌘ J', 'Demander à l’IA'], ['?', 'Afficher les raccourcis'],
    ...ROUTES.filter((r) => r.key).map((r) => [`G puis ${r.key.toUpperCase()}`, `Aller à ${r.title}`]),
    ['B', 'Briefing du jour'], ['Échap', 'Fermer'],
  ];
  openModal(`<h2 class="modal-t">Raccourcis clavier</h2><ul class="keys">${rows.map(([k, l]) => `<li><span>${l}</span><span>${k.split(' ').map((x) => (x === 'puis' ? '<small>puis</small>' : `<kbd>${x}</kbd>`)).join('')}</span></li>`).join('')}</ul>`, { label: 'Raccourcis clavier' });
}
$$('[data-shortcuts-open]').forEach((b) => b.addEventListener('click', openShortcuts));

// ───────── Palette de commandes ─────────
const pal = $('[data-palette]');
const palIn = $('[data-palette-input]');
const palList = $('[data-palette-list]');
let palSel = 0;
let palItems = [];
function paletteItems(q) {
  const base = [
    ...ROUTES.map((r) => ({ label: r.title, kind: 'Page', ic: r.icon, run: () => go(r.id) })),
    ...['revenue', 'visitors', 'conversion', 'orders', 'returning', 'aov'].map((m) => ({ label: api.metricSync(m).label, kind: 'Indicateur', ic: 'chart', run: () => { go('analytics').then(() => active?.setMetric?.(m)); } })),
    { label: 'Créer une automatisation', kind: 'Action', ic: 'plus', run: () => go('automations').then(() => active?.create?.()) },
    { label: 'Générer le rapport hebdomadaire', kind: 'Action', ic: 'doc', run: () => go('reports').then(() => active?.generate?.('weekly')) },
    { label: 'Créer un objectif', kind: 'Action', ic: 'target', run: () => go('goals').then(() => active?.create?.()) },
    { label: 'Personnaliser le dashboard', kind: 'Action', ic: 'layout', run: () => go('overview').then(() => active?.customize?.()) },
    { label: 'Briefing du jour', kind: 'Action', ic: 'sun', run: openBriefing },
    { label: 'Connecter une source de données', kind: 'Action', ic: 'database', run: () => go('settings', { anchor: 'sources' }) },
    { label: 'Raccourcis clavier', kind: 'Aide', ic: 'layout', run: openShortcuts },
  ];
  const s = q.trim().toLowerCase();
  const hits = s ? base.filter((i) => i.label.toLowerCase().includes(s) || i.kind.toLowerCase().includes(s)) : base.slice(0, 9);
  if (s) hits.push({ label: `Demander à l’IA : « ${q.trim()} »`, kind: 'IA', ic: 'spark', run: () => openAsk(q.trim()) });
  return hits.slice(0, 10);
}
function drawPalette() {
  palItems = paletteItems(palIn.value);
  palSel = Math.min(palSel, palItems.length - 1);
  let lastKind = null;
  palList.innerHTML = palItems.map((it, i) => {
    const head = it.kind !== lastKind ? `<li class="palette-group" role="presentation">${it.kind}</li>` : '';
    lastKind = it.kind;
    return `${head}<li role="option" aria-selected="${i === palSel}" class="${i === palSel ? 'is-sel' : ''}" data-i="${i}">${icon(it.ic, 15)}<span>${esc(it.label)}</span>${i === palSel ? '<kbd>↵</kbd>' : ''}</li>`;
  }).join('');
}
function openPalette() {
  pal.hidden = false;
  requestAnimationFrame(() => pal.classList.add('is-open'));
  palIn.value = '';
  palSel = 0;
  drawPalette();
  palIn.focus();
}
function closePalette() { pal.classList.remove('is-open'); setTimeout(() => { pal.hidden = true; }, 150); }
$$('[data-palette-open]').forEach((b) => b.addEventListener('click', openPalette));
$('[data-palette-close]').addEventListener('click', closePalette);
palIn.addEventListener('input', () => { palSel = 0; drawPalette(); });
palIn.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); palSel = (palSel + 1) % palItems.length; drawPalette(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel - 1 + palItems.length) % palItems.length; drawPalette(); }
  if (e.key === 'Enter') { e.preventDefault(); const it = palItems[palSel]; closePalette(); it?.run(); }
  if (e.key === 'Escape') closePalette();
});
palList.addEventListener('click', (e) => { const li = e.target.closest('[data-i]'); if (!li) return; closePalette(); palItems[+li.dataset.i].run(); });
palList.addEventListener('pointermove', (e) => { const li = e.target.closest('[data-i]'); if (li && +li.dataset.i !== palSel) { palSel = +li.dataset.i; drawPalette(); } });

// ───────── Notifications ─────────
async function renderNotifs() {
  const list = await api.notifications();
  const unread = list.filter((n) => n.unread);
  $('[data-notif-dot]').hidden = !unread.length;
  $('[data-notif-panel]').innerHTML = `
    <div class="np-h"><b>Notifications</b>${unread.length ? '<button type="button" class="link-btn" data-read-all>Tout marquer comme lu</button>' : ''}</div>
    <ul class="np-list">${list.map((n) => `
      <li class="np ${n.unread ? 'is-unread' : ''}" data-n="${n.id}">
        <span class="np-ic np-ic--${n.kind}">${icon(n.kind === 'anomaly' ? 'radar' : n.kind === 'goal' ? 'target' : 'flow', 15)}</span>
        <div><b>${esc(n.title)}</b><p>${esc(n.text)}</p><time>${esc(n.time)}</time>
          ${n.metric ? `<div class="np-a"><button type="button" class="btn btn--primary btn--sm" data-n-inv="${n.metric}">Examiner</button><button type="button" class="btn btn--ghost btn--sm" data-n-ign="${n.id}">Ignorer</button><button type="button" class="btn btn--ghost btn--sm" data-n-why="${n.metric}">Pourquoi ?</button></div>` : ''}
        </div>
      </li>`).join('')}</ul>`;
}
$('[data-notif-panel]').addEventListener('click', async (e) => {
  const t = e.target;
  if (t.closest('[data-read-all]')) { await api.markRead(['n1', 'n2', 'n3']); renderNotifs(); toast('Tout est lu.', { tone: 'success' }); return; }
  const inv = t.closest('[data-n-inv]');
  if (inv) { $('.notif-wrap [data-menu-btn]').click(); await go('analytics'); active?.setMetric?.(inv.dataset.nInv); return; }
  const why = t.closest('[data-n-why]');
  if (why) { $('.notif-wrap [data-menu-btn]').click(); openAsk('Pourquoi ?', { metric: why.dataset.nWhy, intent: 'why' }); return; }
  const ign = t.closest('[data-n-ign]');
  if (ign) {
    const id = ign.dataset.nIgn;
    await api.markRead([id]);
    const li = t.closest('.np');
    li.classList.add('is-gone');
    toast('Notification ignorée.', { action: { label: 'Annuler', run: () => li.classList.remove('is-gone') } });
    $('[data-notif-dot]').hidden = !$$('.np.is-unread:not(.is-gone)').length;
  }
});

// ───────── Contexte partagé avec les vues ─────────
export const appCtx = {
  go, openAsk, openModal, closeModal, openBriefing, toast,
  async goMetric(m) { await go('analytics'); active?.setMetric?.(m); },
  setMetric(m) { ctx.metric = m; },
  get route() { return ctx.route; },
};

// ───────── Démarrage ─────────
(async function boot() {
  hydrateIcons();
  renderNav();
  hydrateIcons($('[data-nav]'));
  rewriteLinks();
  initMenus();
  // Prénom transmis par l'onboarding (le stockage du navigateur peut être bloqué)
  const params = new URLSearchParams(location.search);
  if (params.get('name')) await api.saveOnboarding({ name: params.get('name') });
  const s = await api.session();
  $('[data-user-name]').textContent = s.user.name;
  $('[data-user-email]').textContent = s.user.email;
  $('[data-user-initials]').textContent = s.user.initials || 'VO';
  renderNotifs();
  await go(currentRoute(), { push: false, anchor: (location.hash.match(/^#([a-z-]+)$/) || [])[1] || null });

  shortcuts({
    '?': openShortcuts,
    b: openBriefing,
    ...Object.fromEntries(ROUTES.filter((r) => r.key).map((r) => [`g ${r.key}`, () => go(r.id)])),
  });
  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.hidden ? openPalette() : closePalette(); }
    if (mod && e.key.toLowerCase() === 'j') { e.preventDefault(); ask.hidden ? openAsk() : closeAsk(); }
    if (e.key === 'Escape') {
      if (!modal.hidden) closeModal();
      else if (!pal.hidden) closePalette();
      else if (!ask.hidden) closeAsk();
      else if (side.classList.contains('is-open')) closeSide();
    }
  });

  // Briefing automatique à la première visite du jour
  // (stockage bloqué, ex. aperçu intégré : simple notification pour ne pas l'ouvrir à chaque chargement)
  let seen = null;
  let canStore = true;
  try { seen = localStorage.getItem('scalify-brief'); } catch { canStore = false; }
  const fromOnboarding = params.has('welcome');
  if (fromOnboarding) { try { history.replaceState(history.state, '', location.pathname + location.hash); } catch { /* ignore */ } }
  if (!fromOnboarding && seen !== new Date().toDateString()) {
    if (canStore) setTimeout(openBriefing, reduced() ? 0 : 900);
    else toast('Votre briefing du jour est prêt.', { tone: 'ai', timeout: 9000, action: { label: 'Ouvrir', run: openBriefing } });
  }
  if (fromOnboarding) toast('Votre centre de commande est prêt.', { tone: 'success' });
}());
