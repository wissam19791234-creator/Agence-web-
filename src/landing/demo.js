// Démo produit interactive du hero : un vrai morceau d'interface (indicateurs cliquables,
// périodes, courbe survolable, insight IA, notification contextuelle, panneau « Demander à l'IA »).
import { api } from '../shared/api.js';
import { logoMark } from '../shared/brand.js';
import { areaChart, sparkline, shareBars } from '../shared/charts.js';
import { CHANNELS } from '../shared/demo-data.js';
import { mountCopilot } from '../shared/copilot-ui.js';
import { icon } from '../shared/icons.js';
import { href } from '../shared/paths.js';
import { countTo, fmt, reduced, toast, trendBadge } from '../shared/ui.js';

const KPIS = ['revenue', 'visitors', 'conversion', 'returning'];
const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

export function mountDemo(el) {
  if (!el) return;
  const state = { metric: 'revenue', period: '30d' };
  el.innerHTML = `
    <div class="dm-chrome" aria-hidden="true"><i></i><i></i><i></i><span class="dm-url mono">app.scalify.fr/overview</span></div>
    <div class="dm">
      <aside class="dm-side">
        <div class="dm-ws">${logoMark(22)}<span><b>Maison Demo</b><small>Workspace</small></span>${icon('chevronDown', 14)}</div>
        <nav class="dm-nav" aria-label="Navigation de la démo">
          ${[['home', 'Vue d’ensemble', 1], ['chart', 'Analyses'], ['spark', 'Copilot IA'], ['bulb', 'Insights', 0, 3], ['flow', 'Automatisations'], ['doc', 'Rapports'], ['target', 'Objectifs']]
            .map(([ic, l, on, n]) => `<a href="${href(`/app/${['home', 'chart', 'spark', 'bulb', 'flow', 'doc', 'target'].indexOf(ic) === 0 ? 'overview' : { chart: 'analytics', spark: 'ai', bulb: 'insights', flow: 'automations', doc: 'reports', target: 'goals' }[ic]}/`)}" class="${on ? 'is-on' : ''}">${icon(ic, 16)}<span>${l}</span>${n ? `<em>${n}</em>` : ''}</a>`).join('')}
        </nav>
        <div class="dm-side-foot"><a href="${href('/app/settings/')}">${icon('settings', 16)}<span>Paramètres</span></a></div>
      </aside>
      <div class="dm-main">
        <div class="dm-top">
          <div class="dm-crumb"><span>Maison Demo</span>${icon('chevron', 12)}<b>Vue d’ensemble</b></div>
          <button type="button" class="dm-search" data-tip="Recherche globale" data-tip-pos="bottom">${icon('search', 15)}<span>Rechercher…</span><kbd>⌘K</kbd></button>
          <div class="seg" role="tablist" aria-label="Période">${Object.keys(PERIOD_DAYS).map((p) => `<button type="button" role="tab" aria-selected="${p === state.period}" data-period="${p}">${p.replace('d', ' j')}</button>`).join('')}</div>
          <button type="button" class="dm-bell btn btn--ghost btn--icon btn--sm" aria-label="Notifications" data-tip="Notifications" data-tip-pos="bottom">${icon('bell', 16)}<i class="dm-badge"></i></button>
          <button type="button" class="btn btn--ai btn--sm" data-ask>${icon('spark', 15)}Demander à l’IA</button>
        </div>
        <div class="dm-body">
          <div class="dm-hello"><h3>Bonjour. Voici ce qui a changé.</h3><span class="pill"><i class="dot dot--live"></i>Mis à jour il y a 2 min</span></div>
          <div class="dm-kpis" role="tablist" aria-label="Indicateurs">${KPIS.map((k) => `<button type="button" role="tab" class="dm-kpi" data-kpi="${k}"></button>`).join('')}</div>
          <div class="dm-grid">
            <div class="dm-card dm-chart-card">
              <div class="dm-card-h"><div><small data-chart-label></small><b class="num" data-chart-value></b></div><span class="dm-legend"><i></i>Période actuelle <i class="is-prev"></i>Précédente</span></div>
              <div class="chart-wrap" data-chart></div>
              <div class="dm-split"><small>Répartition par canal</small><div data-shares></div></div>
            </div>
            <div class="dm-col">
              <div class="dm-card dm-insight">
                <div class="dm-insight-h"><span class="pill pill--ai">${icon('spark', 12)}Insight IA</span><small>il y a 4 min</small></div>
                <p><b>Le chiffre d’affaires progresse de 18,4 % ce mois-ci.</b> La plus forte hausse vient des clients récurrents.</p>
                <div class="dm-insight-a"><button type="button" class="btn btn--secondary btn--sm" data-why>Pourquoi ?</button><button type="button" class="btn btn--ghost btn--sm" data-dismiss>Ignorer</button></div>
              </div>
              <div class="dm-card dm-goal">
                <div class="dm-card-h"><div><small>Objectif du mois</small><b class="num">42 800 € <span>/ 50 000 €</span></b></div><b class="dm-goal-p num">85,6 %</b></div>
                <div class="bar"><i style="--p:85.6%"></i></div>
                <p class="dm-muted">${icon('spark', 12)} L’IA estime l’objectif atteignable d’ici 9 jours.</p>
              </div>
              <div class="dm-card dm-act">
                <small>Activité récente</small>
                <ul>
                  <li><i class="t-ai"></i><span><b>IA</b> a détecté une baisse du trafic mobile</span><time>12 min</time></li>
                  <li><i class="t-auto"></i><span><b>Automatisation</b> · briefing envoyé</span><time>8:00</time></li>
                  <li><i class="t-me"></i><span><b>Vous</b> avez créé un objectif</span><time>hier</time></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="dm-notif" data-notif hidden role="alert">
          <span class="dm-notif-ic">${icon('radar', 16)}</span>
          <div><b>L’IA a détecté quelque chose d’inhabituel</b><p>Le trafic mobile se comporte différemment de d’habitude.</p>
            <div class="dm-notif-a"><button type="button" class="btn btn--primary btn--sm" data-investigate>Examiner</button><button type="button" class="btn btn--ghost btn--sm" data-ignore>Ignorer</button><button type="button" class="btn btn--ghost btn--sm" data-tellwhy>Pourquoi ?</button></div>
          </div>
        </div>
        <aside class="dm-drawer" data-drawer aria-label="Copilot IA" hidden>
          <div class="dm-drawer-h"><b>${icon('spark', 15)} Copilot</b><span class="pill" data-ctx>Contexte : Vue d’ensemble</span><button type="button" class="btn btn--ghost btn--icon btn--sm" data-close aria-label="Fermer">${icon('x', 15)}</button></div>
          <div class="dm-cp" id="demo-cp"></div>
        </aside>
      </div>
    </div>`;

  const $ = (s) => el.querySelector(s);
  const chart = $('[data-chart]');

  const renderKpis = () => {
    const days = PERIOD_DAYS[state.period];
    el.querySelectorAll('[data-kpi]').forEach((b) => {
      const s = api.metricSync(b.dataset.kpi, days);
      b.setAttribute('aria-selected', String(b.dataset.kpi === state.metric));
      b.innerHTML = `<small>${s.label}</small><b class="num" data-v>${fmt.by(s.format, s.value)}</b>${trendBadge(s.delta)}${sparkline(s.points, { cls: s.delta < 0 ? 'is-bad' : '' })}`;
    });
  };
  const renderChart = () => {
    const days = PERIOD_DAYS[state.period];
    const s = api.metricSync(state.metric, days);
    $('[data-chart-label]').textContent = `${s.label} · ${days} derniers jours`;
    const v = $('[data-chart-value]');
    countTo(v, s.value, s.format, 700);
    areaChart(chart, { points: s.points, prev: s.prevPoints, dates: api.dates(days), format: s.format, label: s.label, height: 210 });
  };
  const render = () => { renderKpis(); renderChart(); $('[data-shares]').innerHTML = shareBars(CHANNELS); };

  el.querySelector('.dm-kpis').addEventListener('click', (e) => {
    const b = e.target.closest('[data-kpi]');
    if (!b) return;
    state.metric = b.dataset.kpi;
    render();
  });
  el.querySelectorAll('[data-period]').forEach((b) => b.addEventListener('click', () => {
    state.period = b.dataset.period;
    el.querySelectorAll('[data-period]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    render();
  }));

  // Panneau Copilot
  const drawer = $('[data-drawer]');
  let cp = null;
  const openAI = (q, extra) => {
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    $('[data-ctx]').textContent = extra?.metric ? `Contexte : ${api.metricSync(extra.metric).label}` : 'Contexte : Vue d’ensemble';
    if (!cp) cp = mountCopilot($('#demo-cp'), { compact: true, context: () => ({ page: 'overview' }) });
    if (q) cp.ask(q, extra); else cp.focus();
  };
  const closeAI = () => { drawer.classList.remove('is-open'); setTimeout(() => { drawer.hidden = true; }, 250); };
  $('[data-ask]').addEventListener('click', () => openAI());
  $('[data-close]').addEventListener('click', closeAI);
  $('[data-why]').addEventListener('click', () => openAI('Pourquoi le chiffre d’affaires progresse-t-il ?', { metric: 'revenue', intent: 'why' }));
  $('[data-dismiss]').addEventListener('click', (e) => {
    const card = e.target.closest('.dm-insight');
    card.classList.add('is-gone');
    toast('Insight masqué.', { action: { label: 'Annuler', run: () => card.classList.remove('is-gone') } });
  });
  $('.dm-search').addEventListener('click', () => { location.href = href('/app/'); });

  // Notification contextuelle
  const notif = $('[data-notif]');
  const hideNotif = () => { notif.classList.remove('is-in'); setTimeout(() => { notif.hidden = true; }, 250); };
  $('[data-investigate]').addEventListener('click', () => { hideNotif(); state.metric = 'visitors'; render(); openAI('Trouve une activité inhabituelle.'); });
  $('[data-ignore]').addEventListener('click', () => { hideNotif(); toast('Notification ignorée. L’IA continue de surveiller.', { action: { label: 'Annuler', run: () => { notif.hidden = false; notif.classList.add('is-in'); } } }); });
  $('[data-tellwhy]').addEventListener('click', () => { hideNotif(); openAI('Quel indicateur demande mon attention ?'); });
  $('.dm-bell').addEventListener('click', () => { notif.hidden = false; requestAnimationFrame(() => notif.classList.add('is-in')); });

  // Premier rendu quand la démo devient visible (courbes qui se construisent sous les yeux)
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    render();
    setTimeout(() => {
      if (!drawer.hidden) return;
      notif.hidden = false;
      requestAnimationFrame(() => notif.classList.add('is-in'));
    }, reduced() ? 0 : 4500);
  }, { threshold: 0.25 });
  io.observe(el);
  let rw = 0;
  new ResizeObserver(() => { const w = chart.clientWidth; if (Math.abs(w - rw) > 40 && rw) renderChart(); rw = w; }).observe(chart);
}
