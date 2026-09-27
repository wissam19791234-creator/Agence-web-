// Analyses : filtres (indicateur, période, comparaison), vues enregistrées, courbe,
// tableau de données et export CSV.
import { api } from '../../shared/api.js';
import { areaChart } from '../../shared/charts.js';
import { METRICS } from '../../shared/demo-data.js';
import { icon } from '../../shared/icons.js';
import { countTo, esc, fmt, trendBadge } from '../../shared/ui.js';
import { pageHead, aiMenu, bindAiMenus } from '../widgets.js';

const PERIODS = { '7d': 7, '30d': 30, '90d': 90 };
const DAY = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

export async function render(el, app) {
  await api.metrics('30d');
  const st = { metric: 'revenue', period: '30d', compare: true, table: false };
  el.innerHTML = `
    ${pageHead({ title: 'Analyses', sub: 'Explorez chaque indicateur, comparez les périodes, exportez les données.', actions: `<button type="button" class="btn btn--secondary btn--sm" data-save-view>${icon('bookmark', 15)}Enregistrer la vue</button><button type="button" class="btn btn--secondary btn--sm" data-export>${icon('download', 15)}Exporter CSV</button>` })}
    <div class="filters" role="toolbar" aria-label="Filtres">
      <label class="filter"><span class="sr-only">Indicateur</span><select class="select select--sm" data-metric>${Object.values(METRICS).map((m) => `<option value="${m.id}">${esc(m.label)}</option>`).join('')}</select></label>
      <div class="seg" role="tablist" aria-label="Période">${Object.keys(PERIODS).map((p) => `<button type="button" role="tab" aria-selected="${p === st.period}" data-period="${p}">${p.replace('d', ' jours')}</button>`).join('')}</div>
      <label class="filter-toggle"><button type="button" class="switch" role="switch" aria-checked="true" data-compare aria-label="Comparer à la période précédente"></button>Comparer à la période précédente</label>
      <div class="views" data-views></div>
    </div>
    <section class="card widget w--l">
      <header class="w-h"><h2 data-title></h2><span class="w-period mono" data-period-label></span>${aiMenu('revenue').replace(/data-metric="revenue"/g, 'data-metric="revenue" data-dyn-metric')}</header>
      <div class="w-b">
        <div class="kpi kpi--xl"><b class="num" data-value></b><span data-delta></span><span class="w-sub" data-prev></span></div>
        <div class="chart-wrap" data-chart></div>
      </div>
    </section>
    <section class="card widget w--l">
      <header class="w-h"><h2>Données</h2><button type="button" class="btn btn--ghost btn--sm" data-toggle-table aria-expanded="false">${icon('list', 14)}Afficher le tableau</button></header>
      <div class="w-b" data-table-wrap hidden><div class="table-scroll"><table class="table"><thead><tr><th scope="col">Date</th><th scope="col" class="r">Valeur</th><th scope="col" class="r">Période préc.</th><th scope="col" class="r">Écart</th></tr></thead><tbody data-tbody></tbody></table></div></div>
    </section>`;

  const $ = (s) => el.querySelector(s);
  function draw() {
    const days = PERIODS[st.period];
    const s = api.metricSync(st.metric, days);
    const dates = api.dates(days);
    $('[data-title]').textContent = s.label;
    $('[data-period-label]').textContent = `${days} derniers jours`;
    countTo($('[data-value]'), s.value, s.format, 700);
    $('[data-delta]').innerHTML = trendBadge(s.delta);
    $('[data-prev]').textContent = `Période précédente : ${fmt.by(s.format, s.previous)}`;
    el.querySelectorAll('[data-dyn-metric]').forEach((b) => { b.dataset.metric = st.metric; });
    areaChart($('[data-chart]'), { points: s.points, prev: st.compare ? s.prevPoints : null, dates, format: s.format, label: s.label, height: 300 });
    $('[data-tbody]').innerHTML = s.points.map((v, i) => {
      const p = s.prevPoints[i];
      const d = p ? (v - p) / p : 0;
      return `<tr><td>${DAY.format(dates[i])}</td><td class="r num">${fmt.by(s.format, v)}</td><td class="r num">${p != null ? fmt.by(s.format, p) : '—'}</td><td class="r"><span class="trend ${d >= 0 ? 'is-good' : 'is-bad'}">${fmt.delta(d)}</span></td></tr>`;
    }).reverse().join('');
    drawViews();
  }
  function drawViews() {
    const views = api.savedViews();
    $('[data-views]').innerHTML = views.length ? `<span class="views-l">Vues :</span>${views.slice(-4).map((v, i) => `<button type="button" class="pill views-b" data-view="${i}">${esc(v.name)}</button>`).join('')}` : '';
  }

  $('[data-metric]').addEventListener('change', (e) => { st.metric = e.target.value; draw(); });
  el.querySelectorAll('[data-period]').forEach((b) => b.addEventListener('click', () => {
    st.period = b.dataset.period;
    el.querySelectorAll('[data-period]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    draw();
  }));
  $('[data-compare]').addEventListener('click', (e) => { st.compare = !st.compare; e.currentTarget.setAttribute('aria-checked', String(st.compare)); draw(); });
  $('[data-toggle-table]').addEventListener('click', (e) => {
    const w = $('[data-table-wrap]');
    w.hidden = !w.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!w.hidden));
    e.currentTarget.innerHTML = `${icon('list', 14)}${w.hidden ? 'Afficher le tableau' : 'Masquer le tableau'}`;
  });
  $('[data-save-view]').addEventListener('click', () => {
    const name = `${METRICS[st.metric].label} · ${PERIODS[st.period]} j`;
    api.saveView({ name, ...st });
    drawViews();
    app.toast(`Vue « ${name} » enregistrée.`, { tone: 'success' });
  });
  $('[data-views]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-view]');
    if (!b) return;
    const v = api.savedViews().slice(-4)[+b.dataset.view];
    Object.assign(st, { metric: v.metric, period: v.period, compare: v.compare });
    $('[data-metric]').value = st.metric;
    el.querySelectorAll('[data-period]').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.period === st.period)));
    $('[data-compare]').setAttribute('aria-checked', String(st.compare));
    draw();
  });
  $('[data-export]').addEventListener('click', () => {
    const days = PERIODS[st.period];
    const s = api.metricSync(st.metric, days);
    const dates = api.dates(days);
    const csv = ['date;valeur;periode_precedente', ...s.points.map((v, i) => `${dates[i].toISOString().slice(0, 10)};${v};${s.prevPoints[i] ?? ''}`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `scalify-${st.metric}-${days}j.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    app.toast('Export CSV téléchargé.', { tone: 'success' });
  });
  bindAiMenus(el, app);
  draw();

  let rw = 0;
  const ro = new ResizeObserver(() => { const w = el.clientWidth; if (rw && Math.abs(w - rw) > 60) draw(); rw = w; });
  ro.observe(el);
  return {
    setMetric(m) { st.metric = m; $('[data-metric]').value = m; draw(); },
    destroy: () => ro.disconnect(),
  };
}
