// Objectifs : progression animée, objectif suggéré par l'IA, plan « comment l'atteindre »,
// création et modification.
import { api } from '../../shared/api.js';
import { icon } from '../../shared/icons.js';
import { esc, fmt, wait } from '../../shared/ui.js';
import { pageHead } from '../widgets.js';

const val = (g, v) => (g.unit === '€' ? fmt.money(v) : g.unit === '%' ? fmt.pct(v) : fmt.int(v));

export async function render(el, app) {
  let goals = await api.goals();
  el.innerHTML = `
    ${pageHead({ title: 'Objectifs', sub: 'Fixez un cap. L’IA suit la progression et propose le chemin.', actions: `<button type="button" class="btn btn--primary btn--sm" data-new>${icon('plus', 15)}Nouvel objectif</button>` })}
    <section class="card suggest">
      <span class="pill pill--ai">${icon('spark', 12)}Objectif suggéré par l’IA</span>
      <div class="suggest-b"><h2>Chiffre d’affaires : 55 000 € le mois prochain</h2><p>Basé sur votre tendance (+18,4 %) et la saisonnalité de vos 90 derniers jours. Probabilité estimée : élevée.</p></div>
      <div class="suggest-a"><button type="button" class="btn btn--primary btn--sm" data-accept>Adopter cet objectif</button><button type="button" class="btn btn--ghost btn--sm" data-suggest-why>Pourquoi ce chiffre ?</button></div>
    </section>
    <div class="glist" data-list></div>`;
  const $ = (s) => el.querySelector(s);

  function draw() {
    $('[data-list]').innerHTML = goals.map((g) => {
      const p = Math.min(100, (g.current / g.target) * 100);
      const status = p >= 85 ? ['pill--good', 'En bonne voie'] : p >= 60 ? ['pill--warn', 'À surveiller'] : ['pill--bad', 'En retard'];
      return `<article class="card grow" data-id="${g.id}">
        <div class="grow-h"><h2>${esc(g.label)}</h2><span class="pill ${status[0]}">${status[1]}</span><button type="button" class="btn btn--ghost btn--sm" data-edit>Modifier</button></div>
        <div class="grow-n"><b class="num">${val(g, g.current)}</b><span>sur ${val(g, g.target)} · ${esc(g.due)}</span><em class="num">${p.toFixed(1).replace('.', ',')} %</em></div>
        <div class="bar bar--lg"><i style="--p:${p.toFixed(1)}%"></i></div>
        <details class="grow-how"><summary>${icon('spark', 13)} Comment l’atteindre</summary><ol>${g.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></details>
      </article>`;
    }).join('');
  }

  function form(g = null) {
    app.openModal(`
      <h2 class="modal-t">${g ? 'Modifier l’objectif' : 'Nouvel objectif'}</h2>
      <form class="gform" data-gform novalidate>
        <div class="field"><label for="g-label">Indicateur</label><select id="g-label" class="select" name="label">${['Chiffre d’affaires mensuel', 'Taux de conversion', 'Nouveaux clients', 'Panier moyen'].map((l) => `<option ${g?.label === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="g-target">Cible</label><input id="g-target" class="input" name="target" type="number" min="1" step="any" value="${g?.target ?? ''}" placeholder="ex. 50000" required /></div>
        <div class="field"><label for="g-due">Échéance</label><select id="g-due" class="select" name="due">${['fin du mois', 'fin du trimestre', 'fin de l’année'].map((d) => `<option ${g?.due === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
        <p class="field-err" data-err hidden>${icon('alert', 13)} Indiquez une cible supérieure à 0.</p>
        <div class="modal-a">${g ? '<button type="button" class="btn btn--ghost" data-del>Supprimer</button>' : ''}<button type="button" class="btn btn--ghost" data-modal-close>Annuler</button><button type="submit" class="btn btn--primary">${g ? 'Enregistrer' : 'Créer l’objectif'}</button></div>
      </form>`, {
      label: 'Objectif',
      onMount: (box) => {
        const f = box.querySelector('[data-gform]');
        f.addEventListener('submit', async (e) => {
          e.preventDefault();
          const target = parseFloat(f.elements.target.value);
          if (!(target > 0)) { f.elements.target.setAttribute('aria-invalid', 'true'); box.querySelector('[data-err]').hidden = false; f.elements.target.focus(); return; }
          const b = f.querySelector('[type="submit"]');
          b.classList.add('is-loading');
          await wait(400);
          const label = f.elements.label.value;
          const unit = /conversion/i.test(label) ? '%' : /clients/i.test(label) ? '' : '€';
          if (g) goals = goals.map((x) => (x.id === g.id ? { ...x, label, target, due: f.elements.due.value, unit } : x));
          else goals = [...goals, { id: `g${Date.now()}`, label, target, current: unit === '%' ? 3.8 : unit === '€' ? 42800 : 262, unit, due: f.elements.due.value, steps: ['L’IA prépare un plan dès que les premières données arrivent.'] }];
          await api.saveGoals(goals);
          app.closeModal();
          draw();
          app.toast(g ? 'Objectif mis à jour.' : 'Objectif créé. L’IA suit la progression.', { tone: 'success' });
        });
        box.querySelector('[data-del]')?.addEventListener('click', async () => {
          const idx = goals.findIndex((x) => x.id === g.id);
          goals = goals.filter((x) => x.id !== g.id);
          await api.saveGoals(goals);
          app.closeModal();
          draw();
          app.toast('Objectif supprimé.', { action: { label: 'Annuler', run: async () => { goals.splice(idx, 0, g); await api.saveGoals(goals); draw(); } } });
        });
      },
    });
  }

  el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-new]')) form();
    const ed = e.target.closest('[data-edit]');
    if (ed) form(goals.find((g) => g.id === ed.closest('[data-id]').dataset.id));
    if (e.target.closest('[data-accept]')) {
      if (goals.some((g) => g.id === 'g-ai')) { app.toast('Objectif déjà adopté.'); return; }
      goals = [{ id: 'g-ai', label: 'Chiffre d’affaires (mois prochain)', target: 55000, current: 0, unit: '€', due: 'fin du mois prochain', steps: ['Maintenir la relance des clients récurrents.', 'Corriger la baisse du trafic mobile.', 'Augmenter de 15 % le budget du canal payant.'] }, ...goals];
      await api.saveGoals(goals);
      draw();
      app.toast('Objectif adopté.', { tone: 'success' });
    }
    if (e.target.closest('[data-suggest-why]')) app.openAsk('Pourquoi viser 55 000 € le mois prochain ?', { metric: 'revenue', intent: 'why' });
  });
  draw();
  return { create: () => form() };
}
