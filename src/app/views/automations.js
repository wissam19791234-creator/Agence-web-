// Automatisations : liste (activer / dupliquer / supprimer avec annulation) et constructeur
// visuel QUAND → ALORS → ET, avec modèles prédéfinis.
import { api } from '../../shared/api.js';
import { icon } from '../../shared/icons.js';
import { esc, initMenus, wait } from '../../shared/ui.js';
import { pageHead, empty } from '../widgets.js';

export async function render(el, app) {
  let list = await api.automations();
  const opt = api.automationOptions();
  el.innerHTML = `
    ${pageHead({ title: 'Automatisations', sub: 'Le répétitif, pris en charge. L’IA surveille, analyse et vous prévient.', actions: `<button type="button" class="btn btn--primary btn--sm" data-new>${icon('plus', 15)}Créer une automatisation</button>` })}
    <div class="auto-grid">
      <div class="alist" data-list></div>
      <aside class="card tpl">
        <h2>Modèles</h2>
        <p class="w-sub">Partez d’un modèle, ajustez en 10 secondes.</p>
        <ul>${opt.templates.map((t, i) => `<li><button type="button" class="tpl-b" data-tpl="${i}"><b>${esc(t.name)}</b><small>${esc(t.when)} → ${esc(t.then.toLowerCase())}</small>${icon('plus', 14)}</button></li>`).join('')}</ul>
      </aside>
    </div>`;
  const $ = (s) => el.querySelector(s);

  function draw() {
    $('[data-list]').innerHTML = list.length ? list.map((a) => `
      <article class="card arow ${a.on ? 'is-on' : ''}" data-id="${a.id}">
        <div class="arow-h">
          <h2>${esc(a.name)}</h2>
          <span class="pill ${a.on ? 'pill--good' : ''}">${a.on ? '<i class="dot dot--live"></i>Active' : 'En pause'}</span>
          <button type="button" class="switch" role="switch" aria-checked="${a.on}" data-toggle aria-label="Activer ${esc(a.name)}"></button>
          <div data-menu>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-menu-btn aria-expanded="false" aria-label="Actions">${icon('dots', 16)}</button>
            <div class="menu menu--right" data-menu-panel hidden role="menu">
              <button type="button" class="menu-item" data-menu-close data-edit>${icon('settings', 15)}Modifier</button>
              <button type="button" class="menu-item" data-menu-close data-dup>${icon('copy', 15)}Dupliquer</button>
              <div class="menu-sep"></div>
              <button type="button" class="menu-item menu-item--danger" data-menu-close data-del>${icon('x', 15)}Supprimer</button>
            </div>
          </div>
        </div>
        <ol class="flowline">
          <li><span>Quand</span>${esc(a.when)}</li>
          <li><span>Alors</span>${esc(a.then)}</li>
          <li><span>Et</span>${esc(a.and)}</li>
        </ol>
        <p class="arow-f">${icon('activity', 13)} ${a.runs ? `Exécutée ${a.runs} fois` : 'Pas encore exécutée'}</p>
      </article>`).join('')
      : empty({ ic: 'flow', title: 'Aucune automatisation.', text: 'Créez la première à partir d’un modèle : elle tourne dès que vous l’activez.', action: '<button type="button" class="btn btn--primary" data-new>Créer une automatisation</button>' });
    initMenus($('[data-list]'));
  }
  const save = () => api.saveAutomations(list);

  function builder(preset = {}, editId = null) {
    const sel = (name, items, val) => `<select class="select" name="${name}">${[...new Set([val, ...items].filter(Boolean))].map((t) => `<option ${t === val ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
    app.openModal(`
      <h2 class="modal-t">${editId ? 'Modifier l’automatisation' : 'Créer une automatisation'}</h2>
      <form class="builder" data-builder novalidate>
        <div class="field"><label for="b-name">Nom</label><input id="b-name" class="input" name="name" value="${esc(preset.name || '')}" placeholder="ex. Alerte baisse de revenu" required /></div>
        <div class="builder-flow">
          <div class="bstep"><span class="bstep-k">Quand</span>${sel('when', opt.triggers, preset.when)}</div>
          <div class="bstep"><span class="bstep-k">Alors</span>${sel('then', opt.actions, preset.then)}</div>
          <div class="bstep"><span class="bstep-k">Et</span>${sel('and', opt.notify, preset.and)}</div>
        </div>
        <p class="field-err" data-err hidden>${icon('alert', 13)} Donnez un nom à l’automatisation.</p>
        <div class="modal-a"><button type="button" class="btn btn--ghost" data-modal-close>Annuler</button><button type="submit" class="btn btn--primary">${editId ? 'Enregistrer' : 'Créer et activer'}</button></div>
      </form>`, {
      label: 'Créer une automatisation',
      onMount: (box) => {
        const f = box.querySelector('[data-builder]');
        f.addEventListener('submit', async (e) => {
          e.preventDefault();
          const name = f.elements.name.value.trim();
          if (!name) { f.elements.name.setAttribute('aria-invalid', 'true'); box.querySelector('[data-err]').hidden = false; f.elements.name.focus(); return; }
          const btn = f.querySelector('[type="submit"]');
          btn.classList.add('is-loading');
          await wait(500);
          const data = { name, when: f.elements.when.value, then: f.elements.then.value, and: f.elements.and.value };
          if (editId) list = list.map((a) => (a.id === editId ? { ...a, ...data } : a));
          else list = [{ id: `a${Date.now()}`, ...data, on: true, runs: 0 }, ...list];
          await save();
          app.closeModal();
          draw();
          app.toast(editId ? 'Automatisation mise à jour.' : 'Automatisation créée et active.', { tone: 'success' });
        });
        f.elements.name.addEventListener('input', () => { f.elements.name.removeAttribute('aria-invalid'); box.querySelector('[data-err]').hidden = true; });
      },
    });
  }

  el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-new]')) return builder();
    const tpl = e.target.closest('[data-tpl]');
    if (tpl) return builder(opt.templates[+tpl.dataset.tpl]);
    const row = e.target.closest('[data-id]');
    if (!row) return;
    const id = row.dataset.id;
    const a = list.find((x) => x.id === id);
    if (e.target.closest('[data-toggle]')) {
      a.on = !a.on;
      await save();
      draw();
      app.toast(a.on ? `« ${a.name} » activée.` : `« ${a.name} » en pause.`, { tone: a.on ? 'success' : 'default' });
    }
    if (e.target.closest('[data-edit]')) builder(a, id);
    if (e.target.closest('[data-dup]')) { list.splice(list.indexOf(a) + 1, 0, { ...a, id: `a${Date.now()}`, name: `${a.name} (copie)`, on: false, runs: 0 }); await save(); draw(); app.toast('Automatisation dupliquée.', { tone: 'success' }); }
    if (e.target.closest('[data-del]')) {
      const idx = list.indexOf(a);
      list = list.filter((x) => x.id !== id);
      await save();
      draw();
      app.toast(`« ${a.name} » supprimée.`, { action: { label: 'Annuler', run: async () => { list.splice(idx, 0, a); await save(); draw(); } } });
    }
  });
  draw();
  return { create: () => builder() };
}
