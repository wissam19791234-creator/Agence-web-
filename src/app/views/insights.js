// Insights : filtres par type, actions Examiner / Ignorer (annulable) / Pourquoi ?, état vide.
import { api } from '../../shared/api.js';
import { INSIGHT_TYPES } from '../../shared/demo-data.js';
import { icon } from '../../shared/icons.js';
import { esc } from '../../shared/ui.js';
import { pageHead, empty } from '../widgets.js';

export async function render(el, app) {
  let list = await api.insights();
  let filter = 'all';
  el.innerHTML = `
    ${pageHead({ title: 'Insights', sub: 'Ce que l’IA a remarqué dans vos données, classé par impact.' })}
    <div class="filters" role="toolbar" aria-label="Filtrer les insights">
      <div class="chips" data-chips>
        <button type="button" class="chip" aria-pressed="true" data-f="all">Tous <em data-n="all"></em></button>
        ${Object.entries(INSIGHT_TYPES).map(([k, t]) => `<button type="button" class="chip" aria-pressed="false" data-f="${k}">${icon(t.icon, 13)}${t.label} <em data-n="${k}"></em></button>`).join('')}
      </div>
    </div>
    <div class="ilist" data-list></div>`;
  const $ = (s) => el.querySelector(s);
  const rank = { Élevé: 0, Moyen: 1, Faible: 2 };

  function draw() {
    $('[data-n="all"]').textContent = list.length;
    Object.keys(INSIGHT_TYPES).forEach((k) => { $(`[data-n="${k}"]`).textContent = list.filter((i) => i.type === k).length; });
    const items = list.filter((i) => filter === 'all' || i.type === filter).sort((a, b) => rank[a.impact] - rank[b.impact]);
    $('[data-list]').innerHTML = items.length ? items.map((i) => `
      <article class="card irow irow--${i.type}" data-id="${i.id}">
        <span class="irow-ic">${icon(INSIGHT_TYPES[i.type].icon, 16)}</span>
        <div class="irow-b">
          <p class="irow-k">${INSIGHT_TYPES[i.type].label}</p>
          <h2>${esc(i.title)}</h2>
          <p>${esc(i.text)}</p>
        </div>
        <span class="irow-impact impact--${rank[i.impact]}">Impact ${esc(i.impact.toLowerCase())}</span>
        <div class="irow-a">
          <button type="button" class="btn btn--secondary btn--sm" data-inv="${i.metric}">Examiner</button>
          <button type="button" class="btn btn--ghost btn--sm" data-why="${i.metric}">Pourquoi ?</button>
          <button type="button" class="btn btn--ghost btn--sm" data-ign="${i.id}">Ignorer</button>
        </div>
      </article>`).join('')
      : empty({ ic: 'check', title: filter === 'all' ? 'Tout est traité.' : 'Rien dans cette catégorie.', text: 'L’IA continue de surveiller vos indicateurs et vous préviendra dès qu’un changement le mérite.', action: filter !== 'all' ? '<button type="button" class="btn btn--secondary" data-f-all>Voir tous les insights</button>' : '' });
  }

  el.addEventListener('click', async (e) => {
    const c = e.target.closest('[data-f]');
    if (c) { filter = c.dataset.f; el.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === c))); draw(); return; }
    if (e.target.closest('[data-f-all]')) { el.querySelector('[data-f="all"]').click(); return; }
    const inv = e.target.closest('[data-inv]');
    if (inv) { await app.goMetric(inv.dataset.inv); return; }
    const why = e.target.closest('[data-why]');
    if (why) { app.openAsk('Pourquoi ?', { metric: why.dataset.why, intent: 'why' }); return; }
    const ign = e.target.closest('[data-ign]');
    if (ign) {
      const id = ign.dataset.ign;
      const item = list.find((i) => i.id === id);
      const card = ign.closest('.irow');
      card.classList.add('is-leaving');
      await new Promise((r) => setTimeout(r, 200));
      list = list.filter((i) => i.id !== id);
      await api.hideInsight(id);
      draw();
      app.toast('Insight ignoré.', { action: { label: 'Annuler', run: async () => { await api.restoreInsight(id); list.push(item); draw(); } } });
    }
  });
  draw();
  return {};
}
