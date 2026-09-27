import { icon } from './icons.js';
import { smoothPath, toPoints, sparkline } from './utils.js';
import { CONFIG } from '../config.js';

// Données d'illustration de l'interface (maquette produit, pas des résultats clients).
const revenue = [42, 46, 44, 51, 49, 57, 55, 62, 60, 68, 72, 70, 79, 84, 82, 91];
const forecast = [91, 95, 99, 104];
const prev = [38, 40, 41, 43, 44, 47, 46, 50, 51, 54, 55, 57, 59, 61, 62, 66];

const CW = 760;
const CH = 210;

function mainChart() {
  const all = [...revenue, ...forecast.slice(1)];
  const max = 110;
  const min = 30;
  const n = all.length;
  const pts = revenue.map((v, i) => [(i / (n - 1)) * CW, 8 + (1 - (v - min) / (max - min)) * (CH - 16)]);
  const fpts = forecast.map((v, i) => [((revenue.length - 1 + i) / (n - 1)) * CW, 8 + (1 - (v - min) / (max - min)) * (CH - 16)]);
  const ppts = prev.map((v, i) => [(i / (n - 1)) * CW, 8 + (1 - (v - min) / (max - min)) * (CH - 16)]);
  const line = smoothPath(pts);
  const area = `${line} L${pts.at(-1)[0]},${CH} L0,${CH} Z`;
  const last = pts.at(-1);
  const grid = [0, 1, 2, 3].map((i) => `<line x1="0" x2="${CW}" y1="${(i * CH) / 3}" y2="${(i * CH) / 3}"/>`).join('');
  return `
  <svg class="db-chart" viewBox="0 0 ${CW} ${CH}" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="dbArea" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="var(--signal)" stop-opacity=".22"/>
        <stop offset="1" stop-color="var(--signal)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g class="db-grid">${grid}</g>
    <path class="db-prev" d="${smoothPath(ppts)}"/>
    <path class="db-area" d="${area}" fill="url(#dbArea)"/>
    <path class="db-line" pathLength="1" d="${line}"/>
    <path class="db-forecast" d="${smoothPath(fpts)}"/>
    <line class="db-cursor" x1="${last[0]}" x2="${last[0]}" y1="0" y2="${CH}"/>
    <circle class="db-dot-halo" cx="${last[0]}" cy="${last[1]}" r="10"/>
    <circle class="db-dot" cx="${last[0]}" cy="${last[1]}" r="4"/>
  </svg>`;
}

const kpis = [
  { label: 'Chiffre d’affaires', value: '128 450 €', delta: '+12,4 %', data: [4, 5, 5, 6, 5, 7, 8, 8, 9, 11], icon: 'chart' },
  { label: 'Clients actifs', value: '1 284', delta: '+3,1 %', data: [6, 6, 7, 7, 7, 8, 8, 8, 9, 9], icon: 'users' },
  { label: 'Tâches automatisées', value: '3 912', delta: '+28 %', data: [2, 3, 3, 4, 5, 6, 6, 8, 9, 11], icon: 'bolt' },
  { label: 'Temps libéré', value: '146 h', delta: 'ce mois', data: [3, 4, 4, 5, 6, 6, 7, 7, 8, 9], icon: 'clock' },
];

const automations = [
  { name: 'Relance devis J+3', meta: '12 exécutions aujourd’hui', on: true },
  { name: 'Rapport hebdo direction', meta: 'Lundi · 08:00', on: true },
  { name: 'Alerte trésorerie', meta: 'Seuil < 20 000 €', on: true },
  { name: 'Onboarding client', meta: 'En pause', on: false },
];

const activity = [
  { t: '09:42', txt: '<b>Facture #2291</b> payée — 4 800 €', kind: 'ok' },
  { t: '09:18', txt: 'IA : <b>anomalie</b> détectée sur les délais de livraison', kind: 'ai' },
  { t: '08:57', txt: '<b>12 relances</b> envoyées automatiquement', kind: 'auto' },
  { t: '08:30', txt: 'Rapport hebdomadaire généré', kind: 'doc' },
];

const tasks = [
  { txt: 'Valider le devis Lefort & Fils', done: true },
  { txt: 'Revoir les objectifs T4', done: false },
  { txt: 'Préparer le comité mensuel', done: false },
];

const clients = [
  { n: 'Atelier Brume', v: '24 k€', s: 92 },
  { n: 'Nordwise', v: '18 k€', s: 78 },
  { n: 'Maison Ciel', v: '11 k€', s: 64 },
];

const nav = [
  ['grid', 'Vue d’ensemble'],
  ['chart', 'Analytics'],
  ['bolt', 'Automatisations'],
  ['users', 'Clients'],
  ['doc', 'Rapports'],
  ['spark', 'Assistant IA'],
];

// Monogramme Scalify (identique à src/shared/brand.js)
export function logoMark(size = 22) {
  return `<svg class="logo-mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="9" fill="#c6f432"/>
    <path d="M21.5 10.5H13.6a3 3 0 0 0 0 6h4.8a3 3 0 0 1 0 6H10.5" fill="none" stroke="#0a0b0d" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="23.2" cy="21.9" r="1.9" fill="#0a0b0d"/>
  </svg>`;
}

export function renderDashboard({ story = false } = {}) {
  return `
  <div class="db${story ? ' db--story' : ''}" ${story ? 'data-stage="0"' : ''} aria-hidden="true">
    <aside class="db-side">
      <div class="db-brand">${logoMark(20)}<span>${CONFIG.brand}</span></div>
      <nav class="db-nav">
        ${nav.map(([ic, l], i) => `<span class="db-nav-item${i === 0 ? ' is-active' : ''}">${icon(ic, 15)}${l}${i === 2 ? '<em>24</em>' : ''}</span>`).join('')}
      </nav>
      <div class="db-side-card">
        <div class="db-side-label">${icon('spark', 13)} IA active</div>
        <p>Analyse de 14 sources en continu</p>
        <div class="db-side-bar"><i></i></div>
      </div>
      <div class="db-user"><span class="db-avatar">AL</span><div><b>Alex Laurent</b><small>Direction</small></div></div>
    </aside>

    <div class="db-main">
      <header class="db-top">
        <div class="db-search">${icon('search', 14)}<span>Rechercher ou demander à l’IA…</span><kbd>⌘K</kbd></div>
        <div class="db-top-right">
          <span class="db-live"><i></i>Temps réel</span>
          <span class="db-icon-btn">${icon('bell', 15)}<i class="db-badge"></i></span>
          <span class="db-avatar db-avatar--sm">AL</span>
        </div>
      </header>

      <div class="db-body">
        <div class="db-head">
          <div>
            <h4>Bonjour Alex</h4>
            <p>Voici l’état de votre entreprise ce matin.</p>
          </div>
          <div class="db-head-actions">
            <div class="db-seg"><span>7 j</span><span class="is-on">30 j</span><span>90 j</span></div>
            <span class="db-btn">${icon('download', 13)}Exporter</span>
          </div>
        </div>

        <div class="db-kpis" data-part="kpis">
          ${kpis.map((k) => `
            <div class="db-card db-kpi">
              <div class="db-kpi-top"><span>${icon(k.icon, 13)}${k.label}</span><em>${k.delta}</em></div>
              <strong>${k.value}</strong>
              ${sparkline(k.data, 200, 34)}
            </div>`).join('')}
        </div>

        <div class="db-row2">
          <div class="db-card db-chart-card" data-part="chart">
            <div class="db-card-head">
              <div><h5>Revenus &amp; prévision IA</h5><span class="db-legend"><i class="l1"></i>Réel<i class="l2"></i>Prévision<i class="l3"></i>N-1</span></div>
              <span class="db-chip">${icon('spark', 12)} Prévision fiable à 94 %</span>
            </div>
            <div class="db-chart-wrap">
              ${mainChart()}
              <div class="db-tooltip"><small>Semaine 42</small><b>91 240 €</b><em>+8,2 %</em></div>
            </div>
            <div class="db-xaxis"><span>Juil.</span><span>Août</span><span>Sept.</span><span>Oct.</span><span>Nov.</span></div>
          </div>

          <div class="db-col">
            <div class="db-card db-insight" data-part="insight">
              <div class="db-insight-head">${icon('spark', 14)}<span>Insight IA</span><small>il y a 2 min</small></div>
              <p>Le segment <b>PME</b> progresse de <b>18 %</b>. 12 devis sont en attente depuis plus de 5 jours.</p>
              <div class="db-insight-actions"><span class="db-btn db-btn--signal">Lancer les relances</span><span class="db-btn">Détails</span></div>
              <div class="db-scan" aria-hidden="true"></div>
            </div>
            <div class="db-card db-auto" data-part="auto">
              <div class="db-card-head"><h5>Automatisations</h5><span class="db-count">24 actives</span></div>
              <ul>
                ${automations.map((a) => `<li class="${a.on ? 'on' : ''}"><span class="db-auto-ic">${icon('bolt', 12)}</span><div><b>${a.name}</b><small>${a.meta}</small></div><span class="db-toggle"><i></i></span></li>`).join('')}
              </ul>
            </div>
          </div>
        </div>

        <div class="db-row3">
          <div class="db-card db-activity" data-part="activity">
            <div class="db-card-head"><h5>Activité récente</h5><span class="db-link">Tout voir</span></div>
            <ul>${activity.map((a) => `<li class="k-${a.kind}"><time>${a.t}</time><i></i><span>${a.txt}</span></li>`).join('')}</ul>
          </div>
          <div class="db-card db-tasks" data-part="tasks">
            <div class="db-card-head"><h5>Priorités du jour</h5><span class="db-count">3</span></div>
            <ul>${tasks.map((t) => `<li class="${t.done ? 'done' : ''}"><span class="db-check">${icon('check', 11)}</span>${t.txt}</li>`).join('')}</ul>
            <div class="db-progress"><span>Objectif hebdo</span><b>68 %</b><div><i style="width:68%"></i></div></div>
          </div>
          <div class="db-card db-clients" data-part="clients">
            <div class="db-card-head"><h5>Meilleurs clients</h5><span class="db-link">Score IA</span></div>
            <ul>${clients.map((c) => `<li><span class="db-avatar db-avatar--xs">${c.n.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span><b>${c.n}</b><em>${c.v}</em><span class="db-score"><i style="width:${c.s}%"></i></span></li>`).join('')}</ul>
          </div>
        </div>
      </div>
    </div>

    ${story ? `
    <div class="db-story-scan"></div>
    <div class="db-story-marks">
      <div class="db-story-mark" style="left:748px;top:130px;width:255px;height:112px"><span>Tendance +28 %</span></div>
      <div class="db-story-mark" style="left:720px;top:292px;width:196px;height:180px"><span>Pic inhabituel</span></div>
      <div class="db-story-mark" style="left:230px;top:562px;width:373px;height:220px"><span>Anomalie : délais</span></div>
    </div>
    <div class="db-toasts">
      <div class="db-toast"><span class="db-toast-ic">${icon('bolt', 13)}</span><div><b>Relances envoyées</b><small>12 devis · il y a 1 s</small></div></div>
      <div class="db-toast"><span class="db-toast-ic">${icon('doc', 13)}</span><div><b>Rapport prêt</b><small>Envoyé à la direction</small></div></div>
      <div class="db-toast"><span class="db-toast-ic">${icon('bell', 13)}</span><div><b>Alerte stock</b><small>Réassort programmé</small></div></div>
    </div>` : ''}
  </div>`;
}

/**
 * Monte un dashboard dans un conteneur `.dash-frame` et le met à l'échelle
 * (conçu en 1280×800, rendu net à toutes les tailles).
 */
export function mountDashboard(frame, opts) {
  frame.innerHTML = renderDashboard(opts);
  const db = frame.querySelector('.db');
  const fit = () => {
    const w = frame.clientWidth;
    if (!w) return;
    const s = w / 1280;
    frame.style.setProperty('--db-scale', s);
    frame.style.height = `${800 * s}px`;
  };
  fit();
  new ResizeObserver(fit).observe(frame);
  return db;
}
