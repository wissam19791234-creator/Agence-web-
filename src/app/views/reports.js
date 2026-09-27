// Rapports : génération (chargement → prêt), aperçu, export PDF (impression), partage, planification.
import { api } from '../../shared/api.js';
import { HEALTH, BRIEFING } from '../../shared/demo-data.js';
import { icon } from '../../shared/icons.js';
import { esc, fmt, initMenus, skeleton } from '../../shared/ui.js';
import { pageHead } from '../widgets.js';

const SCHEDULES = ['Chaque jour · 8 h', 'Chaque lundi · 8 h', 'Le 1er du mois · 8 h'];

function reportHtml(r) {
  const rev = api.metricSync('revenue', 30);
  const vis = api.metricSync('visitors', 30);
  const conv = api.metricSync('conversion', 30);
  return `
    <article class="rdoc">
      <header><span class="mono">SCALIFY · ${esc(r.name.toUpperCase())}</span><span class="mono">${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date())}</span></header>
      <h2>Synthèse · Maison Demo</h2>
      <p class="rdoc-lead">Le chiffre d’affaires progresse (${fmt.delta(rev.delta)}), porté par les clients récurrents. Point d’attention : le trafic (${fmt.delta(vis.delta)}).</p>
      <div class="rdoc-kpis">
        <div><small>Chiffre d’affaires</small><b>${fmt.money(rev.value)}</b><span>${fmt.delta(rev.delta)}</span></div>
        <div><small>Visiteurs</small><b>${fmt.int(vis.value)}</b><span>${fmt.delta(vis.delta)}</span></div>
        <div><small>Conversion</small><b>${fmt.pct(conv.value)}</b><span>${fmt.delta(conv.delta)}</span></div>
        <div><small>Score de santé</small><b>${HEALTH.score}/100</b><span>+${HEALTH.delta} pts</span></div>
      </div>
      <h3>Ce qui a changé</h3>
      <ul>${BRIEFING.changes.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      <h3>Recommandations</h3>
      <ul>${BRIEFING.opportunities.map((c) => `<li>${esc(c)}</li>`).join('')}<li>${esc(BRIEFING.issue)}</li></ul>
      <footer>Données de démonstration · généré par Scalify</footer>
    </article>`;
}

export async function render(el, app) {
  const list = await api.reports();
  el.innerHTML = `
    ${pageHead({ title: 'Rapports', sub: 'Générés par l’IA à partir de vos données. Exportez, partagez ou planifiez-les.' })}
    <div class="rgrid">${list.map((r) => `
      <article class="card rcard" data-r="${r.id}">
        <div class="rcard-h"><span class="ic-tile">${icon('doc', 18)}</span><div><h2>${esc(r.name)}</h2><p>${esc(r.desc)}</p></div></div>
        <p class="rcard-s" data-sched>${icon('calendar', 13)} ${r.schedule ? esc(r.schedule) : 'Non planifié'}</p>
        <div class="rcard-out" data-out></div>
        <div class="rcard-a">
          <button type="button" class="btn btn--primary btn--sm" data-gen>${icon('spark', 14)}Générer le rapport</button>
          <button type="button" class="btn btn--secondary btn--sm" data-pdf disabled>${icon('download', 14)}Exporter PDF</button>
          <button type="button" class="btn btn--ghost btn--sm" data-share disabled>${icon('share', 14)}Partager</button>
          <div data-menu>
            <button type="button" class="btn btn--ghost btn--sm" data-menu-btn aria-expanded="false">${icon('calendar', 14)}Planifier</button>
            <div class="menu" data-menu-panel hidden role="menu">
              ${SCHEDULES.map((s) => `<button type="button" class="menu-item" data-menu-close data-plan="${esc(s)}">${esc(s)}</button>`).join('')}
              <div class="menu-sep"></div>
              <button type="button" class="menu-item" data-menu-close data-plan="">Ne pas planifier</button>
            </div>
          </div>
        </div>
      </article>`).join('')}</div>`;
  initMenus(el);

  async function generate(id) {
    const card = el.querySelector(`[data-r="${id}"]`);
    const r = list.find((x) => x.id === id);
    const btn = card.querySelector('[data-gen]');
    const out = card.querySelector('[data-out]');
    btn.classList.add('is-loading');
    out.innerHTML = `<div class="rcard-load">${skeleton(3)}<small>${icon('spark', 12)} Lecture des données et rédaction…</small></div>`;
    try {
      await api.generateReport(id);
      out.innerHTML = `<div class="rcard-ready">${icon('check', 14)}<span>Prêt · généré à ${new Intl.DateTimeFormat('fr-FR', { timeStyle: 'short' }).format(new Date())}</span><button type="button" class="link-btn" data-preview>Aperçu</button></div>`;
      card.querySelectorAll('[data-pdf], [data-share]').forEach((b) => { b.disabled = false; });
      btn.innerHTML = `${icon('refresh', 14)}Régénérer`;
      app.toast(`${r.name} prêt.`, { tone: 'success', action: { label: 'Aperçu', run: () => preview(r) } });
    } catch {
      out.innerHTML = `<p class="field-err">${icon('alert', 13)} La génération a échoué. Réessayez.</p>`;
    }
    btn.classList.remove('is-loading');
  }
  function preview(r) {
    app.openModal(`${reportHtml(r)}<div class="modal-a"><button type="button" class="btn btn--secondary" data-print>${icon('download', 15)}Exporter PDF</button><button type="button" class="btn btn--primary" data-modal-close>Fermer</button></div>`, {
      label: r.name, wide: true, onMount: (box) => box.querySelector('[data-print]').addEventListener('click', () => printReport(r)),
    });
  }
  function printReport(r) {
    const w = window.open('', '_blank');
    if (!w) { app.toast('Autorisez les fenêtres pour exporter le PDF.', { tone: 'error' }); return; }
    w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(r.name)} · Scalify</title><style>
      body{font:14px/1.55 -apple-system,Segoe UI,Inter,sans-serif;color:#111;max-width:760px;margin:40px auto;padding:0 24px}
      header{display:flex;justify-content:space-between;font:11px monospace;color:#666;border-bottom:1px solid #ddd;padding-bottom:10px}
      h2{font-size:26px;letter-spacing:-.02em;margin:24px 0 8px}h3{margin:24px 0 8px;font-size:15px}
      .rdoc-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.rdoc-kpis div{border:1px solid #ddd;border-radius:10px;padding:10px;display:grid}
      small{color:#666}b{font-size:18px}footer{margin-top:32px;color:#888;font-size:11px;border-top:1px solid #ddd;padding-top:10px}
    </style></head><body>${reportHtml(r)}<script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }

  el.addEventListener('click', async (e) => {
    const card = e.target.closest('[data-r]');
    if (!card) return;
    const id = card.dataset.r;
    const r = list.find((x) => x.id === id);
    if (e.target.closest('[data-gen]')) generate(id);
    if (e.target.closest('[data-preview]')) preview(r);
    if (e.target.closest('[data-pdf]')) printReport(r);
    if (e.target.closest('[data-share]')) {
      const link = `${location.origin}/r/${id}-${Math.random().toString(36).slice(2, 8)}`;
      try { await navigator.clipboard.writeText(link); app.toast('Lien de partage copié.', { tone: 'success' }); } catch { app.toast(`Lien : ${link}`); }
    }
    const plan = e.target.closest('[data-plan]');
    if (plan) {
      const v = plan.dataset.plan || null;
      await api.scheduleReport(id, v);
      card.querySelector('[data-sched]').innerHTML = `${icon('calendar', 13)} ${v ? esc(v) : 'Non planifié'}`;
      app.toast(v ? `Planifié : ${v.toLowerCase()}.` : 'Planification retirée.', { tone: 'success' });
    }
  });
  return { generate };
}
