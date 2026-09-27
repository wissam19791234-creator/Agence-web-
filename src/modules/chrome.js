// Navigation, curseur, boutons magnétiques, CTA collant.
import { gsap, ScrollTrigger, scrollToTarget, getLenis } from './motion.js';
import { isFinePointer, prefersReducedMotion } from './utils.js';

export function initNav() {
  const nav = document.getElementById('nav');
  const progress = nav.querySelector('.nav-progress');
  const burger = nav.querySelector('.nav-burger');
  const menu = document.getElementById('mobile-menu');
  const links = [...nav.querySelectorAll('.nav-links a')];

  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 20);
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    const menuOpen = burger.getAttribute('aria-expanded') === 'true';
    nav.classList.toggle('is-hidden', !menuOpen && y > 600 && y > lastY + 4 && !nav.contains(document.activeElement));
    if (y < lastY - 4 || y < 600) nav.classList.remove('is-hidden');
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Lien actif selon la section visible
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  map.forEach((a, id) => {
    const sec = document.getElementById(id);
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => a.classList.toggle('is-active', self.isActive),
    });
  });

  // Menu mobile
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.hidden = !open;
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    const lenis = getLenis();
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) menu.querySelector('a')?.focus();
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      setMenu(false);
      burger.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 980 && !menu.hidden) setMenu(false);
  });

  // Ancres internes : défilement fluide
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2 || id === '#inscription') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false);
    scrollToTarget(target);
    if (id !== '#top') {
      try { history.replaceState(null, '', id); } catch { /* cadre restreint */ }
    }
  });
}

export function initCursor() {
  if (!isFinePointer() || prefersReducedMotion()) return;
  const ring = document.querySelector('.cursor');
  const dot = document.querySelector('.cursor-dot');
  if (!ring || !dot) return;
  const xRing = gsap.quickTo(ring, 'x', { duration: 0.22, ease: 'power3.out' });
  const yRing = gsap.quickTo(ring, 'y', { duration: 0.22, ease: 'power3.out' });
  const xDot = gsap.quickTo(dot, 'x', { duration: 0.08 });
  const yDot = gsap.quickTo(dot, 'y', { duration: 0.08 });

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    document.documentElement.classList.add('has-cursor');
    xRing(e.clientX); yRing(e.clientY); xDot(e.clientX); yDot(e.clientY);
  }, { passive: true });
  document.addEventListener('mouseleave', () => document.documentElement.classList.remove('has-cursor'));

  const interactive = 'a, button, [role="slider"], [role="tab"], summary, label';
  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    const isText = t.closest('input[type="text"], textarea');
    ring.classList.toggle('is-text', !!isText);
    ring.classList.toggle('is-hover', !isText && !!t.closest(interactive));
    dot.classList.toggle('is-hidden', !!isText);
  });
}

export function initMagnetic() {
  if (!isFinePointer() || prefersReducedMotion()) return;
  document.querySelectorAll('.magnetic').forEach((el) => {
    const strength = 0.28;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
  // Lumière qui suit le pointeur sur les boutons principaux
  document.querySelectorAll('.btn--primary').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

export function initStickyCta() {
  const bar = document.querySelector('[data-sticky-cta]');
  if (!bar) return;
  const hero = document.getElementById('top');
  const pricing = document.getElementById('tarifs');
  const final = document.getElementById('commencer');
  const update = () => {
    const y = window.scrollY;
    const heroEnd = hero.offsetTop + hero.offsetHeight * 0.6;
    const vh = window.innerHeight;
    const inPricing = pricing.getBoundingClientRect().top < vh && pricing.getBoundingClientRect().bottom > 0;
    const inFinal = final.getBoundingClientRect().top < vh;
    bar.classList.toggle('is-visible', y > heroEnd && !inPricing && !inFinal);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/** Révélation des titres mot à mot + éléments [data-reveal]. */
export function initReveals(splitWords) {
  if (prefersReducedMotion()) return;
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (el.matches('.h2, .final-title')) {
      const words = splitWords(el);
      gsap.from(words, {
        yPercent: 110,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    } else {
      gsap.from(el, {
        y: 24,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    }
  });
}
