import { gsap } from './motion.js';
import { isFinePointer, prefersReducedMotion } from './utils.js';

export function initHero() {
  const hero = document.getElementById('top');
  const rig = hero.querySelector('[data-hero-rig]');
  const copy = hero.querySelector('.hero-copy');
  const light = hero.querySelector('.hero-light');
  const reduced = prefersReducedMotion();

  // Séquence d'entrée
  if (!reduced) {
    const lines = hero.querySelectorAll('[data-hero-line]');
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 });
    tl.from(hero.querySelector('.hero-badge'), { y: 16, opacity: 0, duration: 1 })
      .from(lines, { yPercent: 40, opacity: 0, filter: 'blur(12px)', duration: 1.4, stagger: 0.12 }, '-=0.7')
      .from(hero.querySelectorAll('.hero-sub, .hero-ctas, .hero-meta'), { y: 20, opacity: 0, duration: 1.1, stagger: 0.08 }, '-=1.0')
      .from(hero.querySelector('.hero-stage'), { opacity: 0, y: 90, scale: 0.9, duration: 2.2, ease: 'expo.out' }, 0.3)
      .from(hero.querySelectorAll('.sat'), { opacity: 0, scale: 0.9, duration: 1, stagger: 0.15 }, 1.2);
  }

  if (reduced) return;

  // Rotation 3D au mouvement de la souris + lumière dynamique
  const state = { mx: 0, my: 0, p: 0 };
  const current = { mx: 0, my: 0 };
  if (isFinePointer()) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      state.mx = (e.clientX - r.left) / r.width - 0.5;
      state.my = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener('pointerleave', () => { state.mx = 0; state.my = 0; });
  }

  // Au scroll : le dashboard se rapproche, pivote et se met à plat
  const desktop = window.matchMedia('(min-width: 1100px)');
  gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.8 },
  });
  gsap.matchMedia().add('(min-width: 1100px)', () => {
    gsap.to(copy, {
      yPercent: -30, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: '24% top', scrub: true },
    });
  });

  const base = () => (desktop.matches ? { rx: 12, ry: -24, rz: 4 } : { rx: 14, ry: -10, rz: 2 });
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

  gsap.ticker.add(() => {
    if (!visible) return;
    current.mx += (state.mx - current.mx) * 0.06;
    current.my += (state.my - current.my) * 0.06;
    const b = base();
    const p = desktop.matches ? state.p : state.p * 0.5;
    const e = p * p * (3 - 2 * p); // smoothstep
    const rx = b.rx * (1 - e) - current.my * 8;
    const ry = b.ry * (1 - e) + current.mx * 10;
    const rz = b.rz * (1 - e);
    const scale = 1 + e * 0.18;
    const tx = desktop.matches ? -e * 28 : 0;
    rig.style.transform = `translate3d(${tx}vw, ${e * -2}vh, 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    light.style.setProperty('--lx', `${50 + current.mx * 80}%`);
    light.style.setProperty('--ly', `${30 + current.my * 80}%`);
  });
}
