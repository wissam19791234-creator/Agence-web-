import { gsap } from './motion.js';
import { isFinePointer, prefersReducedMotion } from './utils.js';

export function initHero() {
  const hero = document.getElementById('top');
  const rig = hero.querySelector('[data-hero-rig]');
  const stage = hero.querySelector('.hero-stage');
  const light = hero.querySelector('.hero-light');
  const reduced = prefersReducedMotion();

  if (reduced) {
    rig.style.transform = 'none';
    return;
  }

  // Séquence d'entrée
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.05 });
  tl.from(hero.querySelector('.hero-badge'), { y: 16, opacity: 0, duration: 1 })
    .from(hero.querySelectorAll('[data-hero-line]'), { yPercent: 35, opacity: 0, duration: 1.3, stagger: 0.12 }, '-=0.75')
    .from(hero.querySelectorAll('.hero-sub, .hero-ctas, .hero-proof'), { y: 18, opacity: 0, duration: 1, stagger: 0.07 }, '-=0.95')
    .from(hero.querySelectorAll('.hc'), { y: 40, opacity: 0, duration: 1.1, stagger: 0.1 }, 0.35)
    .from(stage, { y: 120, opacity: 0, duration: 1.6 }, 0.6);

  // Au scroll, le dashboard se redresse et s'agrandit (sans épinglage : le scroll reste natif)
  const state = { p: 0, mx: 0, my: 0 };
  const cur = { mx: 0, my: 0 };
  gsap.to(state, {
    p: 1, ease: 'none',
    scrollTrigger: { trigger: stage, start: 'top 95%', end: 'top 15%', scrub: true },
  });

  if (isFinePointer()) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      state.mx = (e.clientX - r.left) / r.width - 0.5;
      state.my = (e.clientY - r.top) / r.height - 0.5;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { state.mx = 0; state.my = 0; });
  }

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  let last = '';
  gsap.ticker.add(() => {
    if (!visible) return;
    cur.mx += (state.mx - cur.mx) * 0.07;
    cur.my += (state.my - cur.my) * 0.07;
    const e = state.p * state.p * (3 - 2 * state.p);
    const rx = 24 * (1 - e) - cur.my * 4;
    const ry = cur.mx * 5;
    const s = 0.92 + e * 0.08;
    const t = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${s.toFixed(4)})`;
    if (t !== last) { rig.style.transform = t; last = t; }
    light.style.setProperty('--lx', `${50 + cur.mx * 90}%`);
    light.style.setProperty('--ly', `${25 + cur.my * 90}%`);
  });
}
