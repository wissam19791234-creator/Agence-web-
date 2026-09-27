// Composants animés inspirés de Magic UI (magicui.design, licence MIT, aussi publiés sur 21st.dev) :
// MagicCard (projecteur qui suit la souris), BorderBeam (faisceau sur la bordure), NumberTicker,
// Meteors, AnimatedBeam, bouton « shine ». Réécrits en JavaScript natif, sans React.
import { gsap } from './motion.js';
import { isFinePointer, prefersReducedMotion } from './utils.js';

const reduced = prefersReducedMotion();

/* ── MagicCard : halo + bordure lumineuse sous le pointeur ── */
function initSpotlight() {
  if (!isFinePointer()) return;
  const cards = document.querySelectorAll('[data-spot], .feat, .plan, .review, .study, .proof-stat, .case, .member, .roi-inputs, .faq-item');
  cards.forEach((card) => {
    if (card.querySelector(':scope > .spot')) return;
    const s = document.createElement('i');
    s.className = 'spot';
    s.setAttribute('aria-hidden', 'true');
    card.prepend(s);
    card.classList.add('has-spot');
    let raf = 0;
    card.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    }, { passive: true });
  });
}

/* ── BorderBeam : un faisceau parcourt la bordure (offset-path) ── */
function initBeams() {
  const targets = [
    ['.plan--pro', { from: '#0b0b0b', to: '#7c5cff', dur: 7 }],
    ['[data-custom]', { from: '#d4ff3a', to: '#b9a7ff', dur: 9 }],
    ['.demo-app', { from: '#d4ff3a', to: '#b9a7ff', dur: 10 }],
    ['.player-screen', { from: '#d4ff3a', to: '#ffffff', dur: 11 }],
    ['.sp-panel', { from: '#d4ff3a', to: '#b9a7ff', dur: 8 }],
  ];
  targets.forEach(([sel, o]) => document.querySelectorAll(sel).forEach((el) => {
    let b = el.querySelector(':scope > .beam');
    if (!b) { b = document.createElement('span'); b.className = 'beam'; b.setAttribute('aria-hidden', 'true'); el.appendChild(b); }
    b.innerHTML = '<i></i>';
    b.style.setProperty('--beam-from', o.from);
    b.style.setProperty('--beam-to', o.to);
    b.style.setProperty('--beam-dur', `${o.dur}s`);
  }));
}

/* ── Bouton « shine » : un reflet traverse les CTA principaux ── */
function initShine() {
  document.querySelectorAll('.btn--primary.btn--lg, .nav .btn--primary, .plan-cta.btn--primary').forEach((b, i) => {
    if (b.querySelector('.btn-shine')) return;
    const s = document.createElement('span');
    s.className = 'btn-shine';
    s.setAttribute('aria-hidden', 'true');
    s.style.animationDelay = `${(i % 5) * 0.7}s`;
    b.appendChild(s);
  });
}

/* ── NumberTicker : les chiffres comptent jusqu'à leur valeur à l'apparition ── */
const NUM = /([+−-]?)(\d{1,3}(?:[\s  ]\d{3})+|\d+)([.,]\d+)?/;
function initTickers() {
  const els = document.querySelectorAll('.hc strong, .proof-stat b, .study-metric, [data-ticker]');
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target;
    const node = [...el.childNodes].find((n) => n.nodeType === 3 && NUM.test(n.textContent));
    if (!node) return;
    const txt = node.textContent;
    const m = txt.match(NUM);
    const intPart = m[2].replace(/[\s  ]/g, '');
    const dec = m[3] ? m[3].length - 1 : 0;
    const to = parseFloat(intPart + (m[3] ? `.${m[3].slice(1)}` : ''));
    const grouped = /[\s  ]/.test(m[2]);
    const before = txt.slice(0, m.index) + m[1];
    const after = txt.slice(m.index + m[0].length);
    const format = (v) => {
      let s = dec ? v.toFixed(dec).replace('.', m[3][0]) : String(Math.round(v));
      if (grouped) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return before + s + after;
    };
    const o = { v: 0 };
    el.style.minWidth = `${el.offsetWidth}px`;
    gsap.to(o, { v: to, duration: 1.8, ease: 'expo.out', onUpdate: () => { node.textContent = format(o.v); }, onComplete: () => { node.textContent = txt; el.style.minWidth = ''; } });
  }), { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}

/* ── Meteors : traînées lumineuses dans le fond du hero ── */
function initMeteors() {
  const host = document.querySelector('.hero-bg');
  if (!host || window.innerWidth < 700) return;
  const box = document.createElement('div');
  box.className = 'meteors';
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = Array.from({ length: 14 }, () => {
    const left = Math.round(Math.random() * 110);
    const delay = (Math.random() * 6).toFixed(2);
    const dur = (3 + Math.random() * 6).toFixed(2);
    return `<span style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s"></span>`;
  }).join('');
  host.appendChild(box);
}

/* ── AnimatedBeam : faisceaux animés entre les canaux et le service client ── */
function initAnimatedBeam() {
  document.querySelectorAll('[data-beam]').forEach((wrap) => {
    const svg = wrap.querySelector('[data-beam-svg]');
    const hub = wrap.querySelector('[data-beam-hub]');
    const to = wrap.querySelector('[data-beam-to]');
    const froms = [...wrap.querySelectorAll('[data-beam-from]')];
    const draw = () => {
      const W = wrap.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${W.width} ${W.height}`);
      const c = (el, side) => {
        const r = el.getBoundingClientRect();
        return { x: (side === 'r' ? r.right : side === 'l' ? r.left : r.left + r.width / 2) - W.left, y: r.top + r.height / 2 - W.top };
      };
      const h = c(hub, 'l');
      const hr = c(hub, 'r');
      const t = c(to, 'l');
      const curve = (a, b, bend) => `M${a.x},${a.y} C${a.x + (b.x - a.x) * 0.5},${a.y + bend} ${a.x + (b.x - a.x) * 0.5},${b.y} ${b.x},${b.y}`;
      const paths = froms.map((f, i) => curve(c(f, 'r'), h, (i - 1) * -20)).concat(curve(hr, t, 0));
      svg.innerHTML = `<defs><linearGradient id="beamG" gradientUnits="userSpaceOnUse" x1="0" x2="${W.width}" y1="0" y2="0"><stop offset="0" stop-color="#d4ff3a" stop-opacity="0"/><stop offset=".5" stop-color="#d4ff3a"/><stop offset="1" stop-color="#b9a7ff"/></linearGradient></defs>`
        + paths.map((d, i) => `<path class="bm-base" d="${d}"/><path class="bm-flow" d="${d}" pathLength="100" style="animation-delay:${i * 0.45}s"/>`).join('');
    };
    draw();
    new ResizeObserver(draw).observe(wrap);
  });
}

export function initMagic() {
  initBeams();
  initAnimatedBeam();
  if (reduced) return;
  initSpotlight();
  initShine();
  initTickers();
  initMeteors();
}
