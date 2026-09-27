export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isFinePointer = () => window.matchMedia('(pointer: fine)').matches;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/** Courbe lissée (Catmull-Rom → Bézier) à partir de points [x, y]. */
export function smoothPath(points, tension = 0.5) {
  if (points.length < 2) return '';
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const t = tension / 3;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Convertit une série de valeurs en points dans une boîte w×h. */
export function toPoints(values, w, h, pad = 4, min, max) {
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const span = hi - lo || 1;
  return values.map((v, i) => [
    (i / (values.length - 1)) * w,
    pad + (1 - (v - lo) / span) * (h - pad * 2),
  ]);
}

export function sparkline(values, w = 120, h = 36, cls = '') {
  const pts = toPoints(values, w, h, 3);
  const line = smoothPath(pts);
  const area = `${line} L${w},${h} L0,${h} Z`;
  return `<svg class="spark ${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <path class="spark-area" d="${area}"/><path class="spark-line" d="${line}"/></svg>`;
}

const nf = new Intl.NumberFormat('fr-FR');
export const formatNumber = (n, decimals = 0) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
export const fmt = (n) => nf.format(n);

/** Anime un compteur numérique dans un élément. */
export function countUp(el, to, { duration = 1600, decimals = 0, prefix = '', suffix = '' } = {}) {
  if (prefersReducedMotion()) {
    el.textContent = prefix + formatNumber(to, decimals) + suffix;
    return;
  }
  const from = 0;
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 4);
  const tick = (now) => {
    const t = clamp((now - start) / duration, 0, 1);
    el.textContent = prefix + formatNumber(lerp(from, to, ease(t)), decimals) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Déclenche un callback une seule fois lorsque l'élément devient visible. */
export function onceVisible(el, cb, options = { threshold: 0.35 }) {
  if (!('IntersectionObserver' in window)) return cb(el);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        io.unobserve(e.target);
        cb(e.target);
      }
    });
  }, options);
  io.observe(el);
}

/** Découpe un texte en mots enveloppés pour les révélations. */
export function splitWords(el) {
  if (el.dataset.split) return el.querySelectorAll('.w > span');
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/([ \t\n\r]+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
          } else {
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && !child.classList.contains('w')) {
        walk(child);
      }
    });
  };
  walk(el);
  el.dataset.split = '1';
  return el.querySelectorAll('.w > span');
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
