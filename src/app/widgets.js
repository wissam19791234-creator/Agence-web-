// Éléments réutilisés par les vues : en-tête de page, carte-widget avec menu d'actions IA,
// état vide.
import { icon } from '../shared/icons.js';
import { esc } from '../shared/ui.js';

export function pageHead({ title, sub = '', actions = '' }) {
  return `<header class="ph"><div><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${actions ? `<div class="ph-a">${actions}</div>` : ''}</header>`;
}

/** Menu d'actions IA d'un widget (Expliquer, Pourquoi ?, Que faire ?, Tendance, Rapport). */
export function aiMenu(metric) {
  return `<div data-menu class="w-menu">
    <button type="button" class="btn btn--ghost btn--icon btn--sm" data-menu-btn aria-expanded="false" aria-label="Actions">${icon('dots', 16)}</button>
    <div class="menu menu--right" data-menu-panel hidden role="menu">
      <p class="menu-label">Demander à l’IA</p>
      <button type="button" class="menu-item" data-menu-close data-ai="explain" data-metric="${metric}">${icon('spark', 15)}Expliquer ceci</button>
      <button type="button" class="menu-item" data-menu-close data-ai="why" data-metric="${metric}">${icon('info', 15)}Pourquoi ?</button>
      <button type="button" class="menu-item" data-menu-close data-ai="todo" data-metric="${metric}">${icon('check', 15)}Que dois-je faire ?</button>
      <button type="button" class="menu-item" data-menu-close data-ai="trend" data-metric="${metric}">${icon('trend', 15)}Voir la tendance</button>
      <button type="button" class="menu-item" data-menu-close data-ai="report" data-metric="${metric}">${icon('doc', 15)}Créer un rapport</button>
    </div>
  </div>`;
}

const Q = { explain: 'Explique cet indicateur.', why: 'Pourquoi cette évolution ?', todo: 'Que dois-je faire ?', trend: 'Montre-moi la tendance.', report: 'Crée un rapport.' };

/** Relie les menus IA d'un conteneur au Copilot global. */
export function bindAiMenus(root, app) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ai]');
    if (!b) return;
    app.openAsk(Q[b.dataset.ai], { metric: b.dataset.metric, intent: b.dataset.ai });
  });
}

export function empty({ ic = 'database', title, text, action = '' }) {
  return `<div class="empty">
    <span class="empty-ic">${icon(ic, 22)}</span>
    <h2>${esc(title)}</h2>
    <p>${esc(text)}</p>
    ${action}
  </div>`;
}
