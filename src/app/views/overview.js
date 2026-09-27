// Vue d'ensemble : widgets réorganisables (glisser-déposer), personnalisables,
// avec actions IA contextuelles sur chaque indicateur.
import { api } from '../../shared/api.js';
import { areaChart, sparkline, shareBars, ring } from '../../shared/charts.js';
import { INSIGHT_TYPES } from '../../shared/demo-data.js';
import { icon } from '../../shared/icons.js';
import { countTo, esc, fmt, trendBadge, initMenus } from '../../shared/ui.js';
import { pageHead, aiMenu, bindAiMenus } from '../widgets.js';

const PERIODS = { '7d': 7, '30d': 30, '90d': 90 };

const WIDGETS = [
  { id: 'kpi-revenue', title: 'Chiffre d’affaires', size: 's', metric: 'revenue' },
  { id: 'kpi-visitors', title: 'Visiteurs', size: 's', metric: 'visitors' },
  { id: 'kpi-conversion', title: 'Taux de conversion', size: 's', metric: 'conversion' },
  { id: 'kpi-returning', title: 'Clients récurrents', size: 's', metric: 'returning' },
  { id: 'chart', title: 'Évolution du chiffre d’affaires', size: 'l', metric: 'revenue' },
  { id: 'health', title: 'Score de santé', size: 'm' },
  { id: 'insights', title: 'Insights IA', size: 'm' },
  { id: 'goal', title: 'Objectif du mois', size: 'm' },
  { id: 'channels', title: 'Répartition par canal', size: 'h' },
  { id: 'activity', title: 'Activité récente', size: 'h' },
  { id: 'kpi-orders', title: 'Commandes', size: 's', metric: 'orders', hidden: true },
  { id: 'kpi-aov', title: 'Panier moyen', size: 's', metric: 'aov', hidden: true },
];

function defaultLayout() {
  return { order: WIDGETS.map((w) => w.id), hidden: WIDGETS.filter((w) => w.hidden).map((w) => w.id) };
}

export async function render(el, app) {
  const [session, health, insights, goals, activity] = await Promise.all([api.session(), api.health(), api.insights(), api.goals(), api.activity()]);
  let period = '30d';
  let layout = api.layout() || defaultLayout();
  WIDGETS.forEach((w) => { if (!layout.order.includes(w.id)) layout.order.push(w.id); });

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  el.innerHTML = `
    ${pageHead({
      title: `${hello}${session.user.name && session.user.name !== 'Vous' ? `, ${esc(session.user.name.split(' ')[0])}` : ''}.`,
      sub: 'Voici ce qui mérite votre attention aujourd’hui.',
      actions: `<div class="seg" role="tablist" aria-label="Période">${Object.keys(PERIODS).map((p) => `<button type="button" role="tab" aria-selected="${p === period}" data-period="${p}">${p.replace('d', ' j')}</button>`).join('')}</div>
        <button type="button" class="btn btn--secondary btn--sm" data-briefing>${icon('sun', 15)}Briefing</button>
        <button type="button" class="btn btn--secondary btn--sm" data-customize>${icon('layout', 15)}Personnaliser</button>`,
    })}
    <div class="wgrid" data-grid></div>`;

  const grid = el.querySelector('[data-grid]');

  function widgetBody(w) {
    const days = PERIODS[period];
    if (w.metric && w.size === 's') {
      const s = api.metricSync(w.metric, days);
      return `<div class="kpi"><b class="num" data-count="${s.value}" data-format="${s.format}">${fmt.by(s.format, s.value)}</b>${trendBadge(s.delta)}</div>
        <p class="w-sub">vs ${days} jours précédents</p>${sparkline(s.points, { cls: s.delta < 0 ? 'is-bad' : '', h: 40 })}`;
    }
    switch (w.id) {
      case 'chart': {
        const s = api.metricSync('revenue', days);
        return `<div class="kpi"><b class="num">${fmt.money(s.value)}</b>${trendBadge(s.delta)}<span class="w-legend"><i></i>Actuelle<i class="is-prev"></i>Précédente</span></div><div class="chart-wrap" data-chart></div>`;
      }
      case 'health':
        return `<div class="hs"><div class="score-ring">${ring(health.score, { size: 104, stroke: 8 })}<b class="num">${health.score}<small>/100</small></b></div>
          <div><p class="hs-d">${icon('arrowUp', 12)} +${health.delta} points cette semaine</p><p class="w-sub">Votre score progresse grâce aux clients récurrents.</p></div></div>
          <ul class="hs-parts">${health.parts.map((p) => `<li data-tip="${esc(p.note)}"><span>${p.label}</span><span class="score-bar"><i style="--p:${p.score}%"></i></span><b class="num">${p.score}</b></li>`).join('')}</ul>`;
      case 'insights':
        return insights.length
          ? `<ul class="wi">${insights.slice(0, 3).map((i) => `<li class="wi-${i.type}"><span class="wi-ic">${icon(INSIGHT_TYPES[i.type].icon, 14)}</span><div><b>${esc(i.title)}</b><small>Impact ${i.impact.toLowerCase()}</small></div><button type="button" class="btn btn--ghost btn--sm" data-ai="why" data-metric="${i.metric}">Pourquoi ?</button></li>`).join('')}</ul>
             <a class="w-link" href="/app/insights/" data-route="insights">Voir les ${insights.length} insights →</a>`
          : `<p class="w-sub">Aucun insight en attente. L’IA vous préviendra dès qu’un changement le mérite.</p>`;
      case 'goal': {
        const g = goals[0];
        const p = (g.current / g.target) * 100;
        return `<div class="kpi"><b class="num">${fmt.money(g.current)}</b><span class="w-sub">sur ${fmt.money(g.target)}</span></div>
          <div class="bar bar--lg"><i style="--p:${p.toFixed(1)}%"></i></div>
          <p class="w-row"><span>${p.toFixed(1).replace('.', ',')} % atteint</span><span>${esc(g.due)}</span></p>
          <p class="w-ai">${icon('spark', 13)} Atteignable en 9 jours au rythme actuel. <a href="/app/goals/" data-route="goals">Voir le plan →</a></p>`;
      }
      case 'channels':
        return shareBars([
          { label: 'Organique', share: 0.38, delta: -0.09 }, { label: 'Payant', share: 0.27, delta: 0.14 },
          { label: 'Email', share: 0.21, delta: 0.31 }, { label: 'Direct', share: 0.14, delta: 0.02 },
        ]);
      case 'activity':
        return `<ul class="act">${activity.map((a) => `<li><i class="t-${a.tone}"></i><span><b>${esc(a.who)}</b> ${esc(a.text)}</span><time>${esc(a.time)}</time></li>`).join('')}</ul>`;
      default: return '';
    }
  }

  function draw() {
    const visible = layout.order.map((id) => WIDGETS.find((w) => w.id === id)).filter((w) => w && !layout.hidden.includes(w.id));
    grid.innerHTML = visible.map((w) => `
      <section class="card widget w--${w.size}" data-w="${w.id}" draggable="false" aria-label="${esc(w.title)}">
        <header class="w-h">
          <span class="w-grip" data-grip title="Glisser pour déplacer" aria-hidden="true">${icon('grip', 14)}</span>
          <h2>${esc(w.title)}</h2>
          <span class="w-period mono">${w.metric || w.id === 'chart' ? `${PERIODS[period]} j` : ''}</span>
          ${w.metric ? aiMenu(w.metric) : ''}
        </header>
        <div class="w-b">${widgetBody(w)}</div>
      </section>`).join('') || `<div class="empty"><h2>Aucun widget affiché</h2><p>Choisissez les widgets à afficher.</p><button type="button" class="btn btn--primary" data-customize>Personnaliser</button></div>`;
    grid.querySelectorAll('[data-count]').forEach((b) => countTo(b, +b.dataset.count, b.dataset.format, 800));
    const c = grid.querySelector('[data-chart]');
    if (c) {
      const s = api.metricSync('revenue', PERIODS[period]);
      requestAnimationFrame(() => areaChart(c, { points: s.points, prev: s.prevPoints, dates: api.dates(PERIODS[period]), format: 'money', label: 'Chiffre d’affaires', height: 240 }));
    }
    initMenus(grid);
  }

  // Glisser-déposer (poignée) pour réorganiser
  let dragId = null;
  grid.addEventListener('pointerdown', (e) => { const g = e.target.closest('[data-grip]'); if (g) g.closest('[data-w]').draggable = true; });
  grid.addEventListener('dragstart', (e) => { const w = e.target.closest('[data-w]'); dragId = w.dataset.w; w.classList.add('is-drag'); e.dataTransfer.effectAllowed = 'move'; });
  grid.addEventListener('dragover', (e) => {
    e.preventDefault();
    const over = e.target.closest('[data-w]');
    if (!over || over.dataset.w === dragId) return;
    const src = grid.querySelector(`[data-w="${dragId}"]`);
    const r = over.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2 || e.clientX > r.left + r.width / 2;
    over.parentNode.insertBefore(src, after ? over.nextSibling : over);
  });
  grid.addEventListener('dragend', (e) => {
    const w = e.target.closest('[data-w]');
    w?.classList.remove('is-drag');
    if (w) w.draggable = false;
    const newOrder = [...grid.querySelectorAll('[data-w]')].map((x) => x.dataset.w);
    layout.order = [...newOrder, ...layout.order.filter((id) => !newOrder.includes(id))];
    api.saveLayout(layout);
    app.toast('Disposition enregistrée.', { tone: 'success' });
  });

  function customize() {
    app.openModal(`
      <h2 class="modal-t">Personnaliser le dashboard</h2>
      <p class="modal-s">Choisissez les widgets visibles. Glissez-les ensuite par leur poignée pour les réorganiser.</p>
      <ul class="cust">${WIDGETS.map((w) => `<li><label><span>${esc(w.title)}</span><button type="button" class="switch" role="switch" aria-checked="${!layout.hidden.includes(w.id)}" data-cw="${w.id}" aria-label="${esc(w.title)}"></button></label></li>`).join('')}</ul>
      <div class="modal-a"><button type="button" class="btn btn--ghost" data-reset>Rétablir par défaut</button><button type="button" class="btn btn--primary" data-modal-close>Terminé</button></div>`, {
      label: 'Personnaliser le dashboard',
      onMount: (box) => {
        box.addEventListener('click', (e) => {
          const s = e.target.closest('[data-cw]');
          if (s) {
            const on = s.getAttribute('aria-checked') !== 'true';
            s.setAttribute('aria-checked', String(on));
            layout.hidden = on ? layout.hidden.filter((x) => x !== s.dataset.cw) : [...layout.hidden, s.dataset.cw];
            api.saveLayout(layout);
            draw();
          }
          if (e.target.closest('[data-reset]')) {
            layout = defaultLayout();
            api.saveLayout(layout);
            box.querySelectorAll('[data-cw]').forEach((x) => x.setAttribute('aria-checked', String(!layout.hidden.includes(x.dataset.cw))));
            draw();
          }
        });
      },
    });
  }

  el.querySelectorAll('[data-period]').forEach((b) => b.addEventListener('click', () => {
    period = b.dataset.period;
    el.querySelectorAll('[data-period]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    draw();
  }));
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-customize]')) customize();
    if (e.target.closest('[data-briefing]')) app.openBriefing();
  });
  bindAiMenus(el, app);
  draw();

  let rw = 0;
  const ro = new ResizeObserver(() => { const w = grid.clientWidth; if (rw && Math.abs(w - rw) > 60) draw(); rw = w; });
  ro.observe(grid);
  return { customize, destroy: () => ro.disconnect() };
}
