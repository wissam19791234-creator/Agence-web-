// Graphiques SVG légers : courbe avec zone + réticule et info-bulle, sparkline, barres de parts,
// jauge circulaire. Traits fins (2 px), grille discrète, une seule échelle, texte en couleurs de texte.
import { fmt, reduced } from './ui.js';

const DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

function smooth(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] || pts[i];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[i + 2] || pts[i + 1];
    const t = 0.18;
    d += ` C${x1 + (x2 - x0) * t},${y1 + (y2 - y0) * t} ${x2 - (x3 - x1) * t},${y2 - (y3 - y1) * t} ${x2},${y2}`;
  }
  return d;
}

/**
 * Courbe principale (+ période précédente en pointillés).
 * @param {HTMLElement} el conteneur (sa largeur est utilisée)
 * @param {{points:number[], prev?:number[], dates:Date[], format:string, label:string}} o
 */
export function areaChart(el, o, tries = 0) {
  // Conteneur pas encore dans la page (vue en cours de montage) : on attend sa largeur réelle
  if ((!el.isConnected || !el.clientWidth) && tries < 60) { requestAnimationFrame(() => areaChart(el, o, tries + 1)); return; }
  const W = Math.max(280, el.clientWidth || 600);
  const H = o.height || 220;
  const pad = { t: 12, r: 8, b: 26, l: 62 };
  const all = [...o.points, ...(o.prev || [])];
  const max = Math.max(...all) * 1.08;
  const min = Math.min(0, Math.min(...all));
  const x = (i, n) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const pts = o.points.map((v, i) => [x(i, o.points.length), y(v)]);
  const prev = o.prev?.length === o.points.length ? o.prev.map((v, i) => [x(i, o.prev.length), y(v)]) : null;
  const line = smooth(pts);
  const area = `${line} L${pts.at(-1)[0]},${H - pad.b} L${pts[0][0]},${H - pad.b} Z`;
  const ticks = [0, 0.5, 1].map((f) => min + (max - min) * f);
  const n = o.points.length;
  const labelIdx = [0, Math.floor(n / 2), n - 1];
  const gid = `g${Math.random().toString(36).slice(2, 8)}`;
  el.innerHTML = `
    <svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${o.label} : ${fmt.by(o.format, o.points.at(-1))} le dernier jour">
      <defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map((t) => `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/><text class="axis" x="${pad.l - 8}" y="${y(t) + 4}" text-anchor="end">${compact(t, o.format)}</text>`).join('')}
      ${labelIdx.map((i) => `<text class="axis" x="${x(i, n)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${o.dates ? DAY.format(o.dates[i]) : ''}</text>`).join('')}
      ${prev ? `<path class="line-prev" d="${smooth(prev)}"/>` : ''}
      <path class="area" d="${area}" fill="url(#${gid})"/>
      <path class="line" d="${line}" pathLength="1"/>
      <g class="cross" opacity="0"><line class="cross-x" y1="${pad.t}" y2="${H - pad.b}"/><circle class="cross-dot" r="4.5"/></g>
      <rect class="hit" x="${pad.l}" y="0" width="${W - pad.l - pad.r}" height="${H}" fill="transparent"/>
    </svg>
    <div class="tip" hidden></div>`;
  const svg = el.querySelector('svg');
  if (!reduced()) {
    const ln = svg.querySelector('.line');
    ln.style.strokeDasharray = '1';
    ln.style.strokeDashoffset = '1';
    ln.getBoundingClientRect();
    ln.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.3,.7,.2,1)';
    requestAnimationFrame(() => { ln.style.strokeDashoffset = '0'; });
    svg.querySelector('.area').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 250, fill: 'backwards' });
  }
  // Réticule + info-bulle
  const cross = svg.querySelector('.cross');
  const tip = el.querySelector('.tip');
  const move = (clientX) => {
    const r = svg.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (n - 1))));
    const [cx, cy] = pts[i];
    cross.setAttribute('opacity', '1');
    cross.querySelector('.cross-x').setAttribute('x1', cx);
    cross.querySelector('.cross-x').setAttribute('x2', cx);
    cross.querySelector('.cross-dot').setAttribute('cx', cx);
    cross.querySelector('.cross-dot').setAttribute('cy', cy);
    tip.hidden = false;
    tip.innerHTML = `<small>${o.dates ? DAY.format(o.dates[i]) : ''}</small><b>${fmt.by(o.format, o.points[i])}</b>${o.prev ? `<small class="tip-prev">Période préc. ${fmt.by(o.format, o.prev[i])}</small>` : ''}`;
    const left = (cx / W) * r.width;
    tip.style.left = `${Math.min(r.width - 150, Math.max(0, left + 12))}px`;
    tip.style.top = `${(cy / H) * r.height - 20}px`;
  };
  const hit = svg.querySelector('.hit');
  hit.addEventListener('pointermove', (e) => move(e.clientX));
  hit.addEventListener('pointerleave', () => { cross.setAttribute('opacity', '0'); tip.hidden = true; });
}

const CMP = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });
function compact(v, format) {
  const s = CMP.format(v);
  return format === 'money' ? `${s} €` : format === 'pct' ? `${s} %` : s;
}

/** Mini-courbe pour les tuiles d'indicateurs. */
export function sparkline(values, { w = 120, h = 34, cls = '' } = {}) {
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / (max - min || 1)) * (h - 6)]);
  return `<svg class="spark ${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${smooth(pts)}" pathLength="1"/></svg>`;
}

/** Barres horizontales de répartition (une couleur, valeur en texte). */
export function shareBars(items) {
  return `<ul class="shares">${items.map((c) => `
    <li><span class="shares-l">${c.label}</span><span class="shares-bar"><i style="--w:${(c.share * 100).toFixed(1)}%"></i></span><b>${Math.round(c.share * 100)} %</b><span class="trend ${c.delta >= 0 ? 'is-good' : 'is-bad'}">${c.delta >= 0 ? '+' : '−'}${Math.abs(Math.round(c.delta * 100))} %</span></li>`).join('')}</ul>`;
}

/** Jauge circulaire (score sur 100). */
export function ring(score, { size = 132, stroke = 9 } = {}) {
  const r = (size - stroke) / 2;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-trk" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-val" stroke-width="${stroke}" pathLength="100" style="--v:${score}"/>
  </svg>`;
}
