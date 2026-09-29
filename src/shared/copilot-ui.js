// Interface du Copilot IA : fil de discussion, suggestions, réponses structurées
// (analyse, explication, données utilisées, recommandations) et actions.
import { api } from './api.js';
import { SUGGESTIONS } from './copilot.js';
import { icon } from './icons.js';
import { esc, reduced, toast, trendBadge } from './ui.js';
import { sparkline } from './charts.js';

const fmtV = (v, f) => (f === 'money' ? `${Math.round(v).toLocaleString('fr-FR')} €` : Math.round(v).toLocaleString('fr-FR'));
const sign = (d) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d * 100).toFixed(0)} %`;

/** Visuel de la réponse : grand chiffre, courbe, barres, comparaison ou progression. */
function viz(v) {
  if (!v) return '';
  if (v.type === 'big') return `<div class="ai-viz ai-big"><b class="num">${esc(v.value)}</b><span>${esc(v.label)}</span>${v.delta != null ? trendBadge(v.delta) : ''}</div>`;
  if (v.type === 'spark') return `<div class="ai-viz ai-spark">${sparkline(v.points, { cls: v.bad ? 'is-bad' : '', h: 56 })}</div>`;
  if (v.type === 'progress') return `<div class="ai-viz ai-progress"><div class="bar bar--lg"><i style="--p:${(v.value * 100).toFixed(1)}%"></i></div><span>${esc(v.label)}</span></div>`;
  if (v.type === 'compare') {
    const max = Math.max(v.a[1], v.b[1]);
    return `<div class="ai-viz ai-bars">${[v.a, v.b].map(([l, n], i) => `<div class="ai-bar"><span>${esc(l)}</span><i><em style="--w:${((n / max) * 100).toFixed(1)}%" class="${i ? 'is-now' : ''}"></em></i><b class="num">${fmtV(n, v.fmt)}</b></div>`).join('')}</div>`;
  }
  if (v.type === 'bars') {
    const max = Math.max(...v.items.map(([, n]) => Math.abs(n))) || 1;
    return `<div class="ai-viz ai-bars">${v.items.map(([l, n]) => `<div class="ai-bar"><span>${esc(l)}</span><i><em style="--w:${((Math.abs(n) / (v.share || v.score ? 1 : max)) * 100).toFixed(1)}%" class="${!v.share && !v.score && n < 0 ? 'is-bad' : ''}"></em></i><b class="num">${v.score ? Math.round(n * 100) : v.share ? `${Math.round(n * 100)} %` : sign(n)}</b></div>`).join('')}</div>`;
  }
  return '';
}

function answerCard(a) {
  const act = a.actions?.[0];
  return `
    <div class="ai-answer">
      <p class="ai-title">${esc(a.title)}</p>
      ${a.analysis ? `<p class="ai-analysis">${esc(a.analysis)}</p>` : ''}
      ${viz(a.viz)}
      ${a.data?.length ? `<dl class="ai-data">${a.data.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="num">${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${a.recos?.length ? `<ul class="ai-recos">${a.recos.slice(0, 2).map((r) => `<li>${icon('check', 14)}<span>${esc(r)}</span></li>`).join('')}</ul>` : ''}
      ${a.explanation ? `<div class="ai-detail" hidden><p>${esc(a.explanation)}</p></div>` : ''}
      ${act || a.explanation ? `<div class="ai-actions">
        ${act ? `<button type="button" class="btn btn--primary btn--sm" data-ai-apply="${esc(act)}">${icon('check', 14)}${esc(act)}</button>` : ''}
        ${a.explanation ? '<button type="button" class="btn btn--secondary btn--sm" data-ai-detail>Pourquoi ?</button>' : ''}
      </div>` : ''}
      ${a.follow?.length ? `<div class="ai-follow">${a.follow.map((f) => `<button type="button" class="cp-chip" data-ai-ask>${esc(f)}</button>`).join('')}</div>` : ''}
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
    if (apply && !apply.disabled) {
      const label = apply.dataset.aiApply;
      apply.classList.add('is-loading');
      await new Promise((r) => setTimeout(r, 700));
      apply.classList.remove('is-loading');
      apply.disabled = true;
      apply.innerHTML = `${icon('check', 14)}Fait`;
      toast(`${label} : c’est fait.`, { tone: 'success', action: { label: 'Annuler', run: () => { apply.disabled = false; apply.innerHTML = `${icon('check', 14)}${esc(label)}`; toast('Action annulée.'); } } });
    }
    const det = e.target.closest('[data-ai-detail]');
    if (det) {
      const d = card.querySelector('.ai-detail');
      d.hidden = !d.hidden;
      det.textContent = d.hidden ? 'Pourquoi ?' : 'Masquer';
    }
    const f = e.target.closest('[data-ai-ask]');
    if (f) ask(f.textContent);
  });

  if (opts.autoAsk) ask(opts.autoAsk);
  return { ask, focus: () => input.focus() };
}
