// Mouvement du site public : défilement doux (Lenis) synchronisé avec GSAP ScrollTrigger,
// apparitions au défilement et compteurs. Tout est désactivé si l'utilisateur préfère réduire les animations.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useEffect, useLayoutEffect, type RefObject } from 'react';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

/** Défilement doux pour la durée de vie du composant appelant. */
export function useSmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return;
    const l = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 3.2), smoothWheel: true });
    lenis = l;
    l.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); l.destroy(); lenis = null; };
  }, []);
}

export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { duration: 1.4 });
  else window.scrollTo({ top: y, behavior: reducedMotion() ? 'auto' : 'smooth' });
}

/** Apparition en fondu montant des éléments [data-reveal] contenus dans `root`. */
export function useReveal(root: RefObject<HTMLElement>, deps: unknown[] = []) {
  useLayoutEffect(() => {
    if (!root.current || reducedMotion()) return;
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      gsap.set(els, { opacity: 0, y: 36 });
      ScrollTrigger.batch(els, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.09, overwrite: true }),
      });
      // Légère parallaxe des images marquées [data-parallax]
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        gsap.fromTo(el, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }, root);
    const r = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => { clearTimeout(r); ctx.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Compteur animé à l'entrée dans l'écran. */
export function countUp(el: HTMLElement, to: number, format: (n: number) => string) {
  if (reducedMotion()) { el.textContent = format(to); return () => {}; }
  const o = { v: 0 };
  el.textContent = format(0);
  const st = ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(o, { v: to, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = format(o.v); } }),
  });
  return () => st.kill();
}
