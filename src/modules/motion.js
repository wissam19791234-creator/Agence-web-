import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './utils.js';

gsap.registerPlugin(ScrollTrigger);
// Évite les recalculs quand la barre d'adresse mobile apparaît/disparaît
ScrollTrigger.config({ ignoreMobileResize: true });

// Défilement natif : le plus fluide sur trackpad, molette et écran tactile.
export function initSmoothScroll() {
  return null;
}

export function scrollToTarget(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - (el.id === 'top' ? 0 : 56);
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

export const getLenis = () => null;
export { gsap, ScrollTrigger };
