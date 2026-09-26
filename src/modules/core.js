// Section « L'IA travaille pour vous » : noyau 3D (Three.js chargé à la demande),
// connexions animées et activité cyclique des modules.
import { prefersReducedMotion } from './utils.js';

const TICKS = [
  'Analyse de 14 sources…',
  'Workflow « Relance devis » exécuté',
  'Signal détecté : délais fournisseur',
  'Recommandation : relancer 12 devis',
  'Rapport hebdo prêt pour lundi 08:00',
  'Alerte : trésorerie à surveiller',
];

export function initCore() {
  const sec = document.getElementById('ia');
  const stage = sec.querySelector('[data-core]');
  const canvas = sec.querySelector('[data-core-canvas]');
  const svg = sec.querySelector('[data-core-links]');
  const nodes = [...sec.querySelectorAll('.core-node')];
  const ticker = sec.querySelector('[data-core-ticker]');
  const reduced = prefersReducedMotion();

  // Connexions noyau → modules
  const NS = 'http://www.w3.org/2000/svg';
  const drawLinks = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.innerHTML = '';
    const sr = stage.getBoundingClientRect();
    const cx = w / 2;
    const cy = h / 2;
    nodes.forEach((n) => {
      const dot = n.querySelector('.core-node-dot').getBoundingClientRect();
      const x = dot.left + dot.width / 2 - sr.left;
      const y = dot.top + dot.height / 2 - sr.top;
      const mx = (cx + x) / 2 + (y - cy) * 0.15;
      const my = (cy + y) / 2 - (x - cx) * 0.15;
      const d = `M${cx},${cy} Q${mx},${my} ${x},${y}`;
      const base = document.createElementNS(NS, 'path');
      base.setAttribute('d', d);
      const pulse = document.createElementNS(NS, 'path');
      pulse.setAttribute('d', d);
      pulse.setAttribute('pathLength', '1');
      pulse.setAttribute('class', 'pulse');
      pulse.style.animationDelay = `${Math.random() * -3.6}s`;
      svg.append(base, pulse);
    });
  };
  if (window.innerWidth > 760) {
    drawLinks();
    new ResizeObserver(() => window.innerWidth > 760 && drawLinks()).observe(stage);
  }

  // Activité cyclique
  let i = 0;
  const cycle = () => {
    nodes.forEach((n, k) => n.classList.toggle('is-active', k === i));
    ticker.textContent = TICKS[i];
    i = (i + 1) % nodes.length;
  };
  cycle();
  let timer = null;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !timer) timer = setInterval(cycle, 2400);
    if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
  }).observe(sec);

  // WebGL : chargé quand la section approche
  const hasWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch { return false; }
  })();
  if (!hasWebGL) {
    sec.classList.add('no-webgl');
    return;
  }
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    try {
      const mod = await import('./core3d.js');
      await mod.startCore(canvas, stage, { reduced });
    } catch (err) {
      console.warn('Noyau 3D indisponible', err);
      sec.classList.add('no-webgl');
    }
  }, { rootMargin: '600px 0px' });
  io.observe(sec);
}
