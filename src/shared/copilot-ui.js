// Interface du Copilot IA : fil de discussion, suggestions, réponses structurées
// (analyse, explication, données utilisées, recommandations) et actions.
import { api } from './api.js';
import { SUGGESTIONS } from './copilot.js';
import { icon } from './icons.js';
import { esc, reduced, toast } from './ui.js';

const FOLLOW = ['Montre-moi la tendance sur 90 jours.', 'Crée un rapport à partir de cette analyse.', 'Quel impact sur mon objectif du mois ?'];

function answerCard(a) {
  return `
    <div class="ai-answer">
      <p class="ai-title">${esc(a.title)}</p>
      <p class="ai-analysis">${esc(a.analysis)}</p>
      <div class="ai-detail" hidden>
        <p class="ai-h">Explication</p>
        <p>${esc(a.explanation)}</p>
      </div>
      <p class="ai-h">Données utilisées</p>
      <dl class="ai-data">${a.data.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="num">${esc(v)}</dd></div>`).join('')}</dl>
      <p class="ai-h">Recommandations</p>
      <ul class="ai-recos">${a.recos.map((r) => `<li>${icon('check', 14)}<span>${esc(r)}</span></li>`).join('')}</ul>
      <div class="ai-actions">
        <button type="button" class="btn btn--primary btn--sm" data-ai-apply="${esc(a.actions[0] || 'Appliquer')}">${icon('check', 14)}Appliquer</button>
        <button type="button" class="btn btn--secondary btn--sm" data-ai-detail>Voir le détail</button>
        <button type="button" class="btn btn--ghost btn--sm" data-ai-follow>${icon('spark', 14)}Question de suivi</button>
      </div>
    </div>`;
}

/**
 * Monte un Copilot dans `el`.
 * @param {{ context?: () => object, compact?: boolean, intro?: string, autoAsk?: string }} opts
 */
export function mountCopilot(el, opts = {}) {
  const ctx = opts.context || (() => ({}));
  el.classList.add('copilot');
  el.innerHTML = `
    <div class="cp-log" data-cp-log aria-live="polite">
      <div class="cp-msg cp-msg--ai cp-hello">
        <span class="cp-av">${icon('spark', 14)}</span>
        <div><p>${esc(opts.intro || 'Je lis les données de ce workspace. Posez une question, je réponds avec l’analyse et les actions possibles.')}</p></div>
      </div>
    </div>
    <div class="cp-sugg" data-cp-sugg>${SUGGESTIONS.slice(0, opts.compact ? 3 : 5).map((s) => `<button type="button" class="cp-chip">${esc(s)}</button>`).join('')}</div>
    <form class="cp-form" data-cp-form>
      <label class="sr-only" for="cp-${el.id || 'x'}">Question pour l’IA</label>
      <span class="cp-form-ic">${icon('spark', 16)}</span>
      <input id="cp-${el.id || 'x'}" class="cp-input" autocomplete="off" placeholder="Demandez n’importe quoi sur vos données…" />
      <button class="btn btn--primary btn--sm btn--icon" type="submit" aria-label="Envoyer">${icon('arrowUp', 16)}</button>
    </form>`;
  const log = el.querySelector('[data-cp-log]');
  const input = el.querySelector('.cp-input');
  const sugg = el.querySelector('[data-cp-sugg]');
  let busy = false;

  const scroll = () => log.scrollTo({ top: log.scrollHeight, behavior: reduced() ? 'auto' : 'smooth' });
  const push = (html, who) => {
    const m = document.createElement('div');
    m.className = `cp-msg cp-msg--${who}`;
    m.innerHTML = who === 'ai' ? `<span class="cp-av">${icon('spark', 14)}</span><div>${html}</div>` : `<div>${html}</div>`;
    log.appendChild(m);
    scroll();
    return m;
  };

  async function ask(q, extra = {}) {
    if (busy || !q.trim()) return;
    busy = true;
    sugg.hidden = true;
    push(esc(q), 'me');
    const c = { ...ctx(), ...extra };
    const pending = push(`<div class="cp-thinking"><span>${c.metric ? 'Lecture de l’indicateur' : 'Analyse de vos données'}</span><i></i><i></i><i></i></div>`, 'ai');
    try {
      const a = await api.askCopilot(q, c);
      pending.querySelector('div').innerHTML = answerCard(a);
      scroll();
    } catch {
      pending.querySelector('div').innerHTML = `<p class="cp-error">${icon('alert', 14)} L’analyse n’a pas abouti. <button type="button" class="link-btn" data-retry>Réessayer</button></p>`;
      pending.querySelector('[data-retry]').addEventListener('click', () => { pending.remove(); busy = false; ask(q, extra); });
    }
    busy = false;
  }

  el.querySelector('[data-cp-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value;
    input.value = '';
    ask(q);
  });
  sugg.addEventListener('click', (e) => { const b = e.target.closest('.cp-chip'); if (b) ask(b.textContent); });

  log.addEventListener('click', async (e) => {
    const card = e.target.closest('.ai-answer');
    if (!card) return;
    const apply = e.target.closest('[data-ai-apply]');
    if (apply) {
      apply.classList.add('is-loading');
      await new Promise((r) => setTimeout(r, 900));
      apply.classList.remove('is-loading');
      apply.disabled = true;
      apply.innerHTML = `${icon('check', 14)}Appliqué`;
      toast(`${apply.dataset.aiApply} : c’est fait.`, { tone: 'success', action: { label: 'Annuler', run: () => { apply.disabled = false; apply.innerHTML = `${icon('check', 14)}Appliquer`; toast('Action annulée.'); } } });
    }
    if (e.target.closest('[data-ai-detail]')) {
      const d = card.querySelector('.ai-detail');
      d.hidden = !d.hidden;
      e.target.closest('[data-ai-detail]').textContent = d.hidden ? 'Voir le détail' : 'Masquer le détail';
    }
    if (e.target.closest('[data-ai-follow]')) {
      input.value = FOLLOW[Math.floor(Math.random() * FOLLOW.length)];
      input.focus();
    }
  });

  if (opts.autoAsk) ask(opts.autoAsk);
  return { ask, focus: () => input.focus() };
}
