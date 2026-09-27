// Interactions « SaaS premium » : bandeaux défilants, manifeste, cas d'usage horizontaux,
// calculateur, palette ⌘K, rail de progression, cartes inclinables.
import { gsap, ScrollTrigger, scrollToTarget } from './motion.js';
import { CONFIG } from '../config.js';
import { icon } from './icons.js';
import { fmt, isFinePointer, prefersReducedMotion, splitWords, clamp } from './utils.js';

const reduced = () => prefersReducedMotion();

// ───────── Bandeau d'outils (boucle infinie, accélère avec le scroll) ─────────
export function initMarquee() {
  const wrap = document.querySelector('[data-marquee]');
  if (!wrap) return;
  const track = wrap.querySelector('[data-marquee-track]');
  track.querySelectorAll('[data-ic]').forEach((i) => { i.innerHTML = icon(i.dataset.ic, 16); });
  track.innerHTML += track.innerHTML; // copie pour la boucle
  [...track.children].slice(track.children.length / 2).forEach((c) => c.setAttribute('aria-hidden', 'true'));
  if (reduced()) return;
  let x = 0;
  let boost = 0;
  let hover = false;
  wrap.addEventListener('pointerenter', () => { hover = true; });
  wrap.addEventListener('pointerleave', () => { hover = false; });
  ScrollTrigger.create({ onUpdate: (self) => { boost = clamp(Math.abs(self.getVelocity()) / 300, 0, 8); } });
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(wrap);
  gsap.ticker.add((_, dt) => {
    if (!visible) return;
    const half = track.scrollWidth / 2;
    if (!half) return;
    const speed = hover ? 0.15 : 0.6 + boost;
    boost *= 0.94;
    x = (x - speed * (dt / 16.67)) % half;
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
}

// ───────── Bandeau géant (sens et vitesse pilotés par le scroll) ─────────
export function initMega() {
  const rows = [...document.querySelectorAll('[data-mega]')];
  if (!rows.length || reduced()) return;
  rows.forEach((row) => {
    const span = row.querySelector('span');
    span.innerHTML += span.innerHTML;
  });
  let dir = 1;
  let vel = 0;
  const pos = rows.map(() => 0);
  ScrollTrigger.create({
    onUpdate: (self) => { dir = self.direction; vel = clamp(Math.abs(self.getVelocity()) / 200, 0, 12); },
  });
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(rows[0].parentElement);
  gsap.ticker.add((_, dt) => {
    if (!visible) return;
    vel *= 0.95;
    rows.forEach((row, i) => {
      const span = row.firstElementChild;
      const half = span.scrollWidth / 2;
      const sign = Number(row.dataset.mega);
      pos[i] -= (1 + vel) * dir * sign * (dt / 16.67);
      if (pos[i] <= -half) pos[i] += half;
      if (pos[i] > 0) pos[i] -= half;
      span.style.transform = `translate3d(${pos[i]}px,0,0) skewX(${clamp(-vel * dir * sign * 0.8, -8, 8)}deg)`;
    });
  });
}

// ───────── Manifeste : les mots s'allument au scroll ─────────
export function initManifesto() {
  const el = document.querySelector('[data-manifesto]');
  if (!el) return;
  const words = [...splitWords(el)];
  if (reduced()) return;
  el.classList.add('is-live');
  ScrollTrigger.create({
    trigger: el,
    start: 'top 80%',
    end: 'bottom 45%',
    scrub: true,
    onUpdate: (self) => {
      const n = Math.round(self.progress * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    },
  });
}

// ───────── Cas d'usage : défilement horizontal épinglé ─────────
export function initCases() {
  const sec = document.getElementById('equipes');
  if (!sec) return;
  const viewport = sec.querySelector('[data-cases-viewport]');
  const track = sec.querySelector('[data-cases-track]');
  const cards = [...track.children];
  const count = sec.querySelector('[data-cases-count]');
  const bar = sec.querySelector('[data-cases-bar]');
  const setProgress = (p) => {
    const i = Math.min(cards.length - 1, Math.round(p * (cards.length - 1)));
    count.textContent = `0${i + 1} / 0${cards.length}`;
    bar.style.transform = `scaleX(${Math.max(0.04, p)})`;
    cards.forEach((c, k) => c.classList.toggle('is-current', k === i));
  };
  setProgress(0);

  const mm = gsap.matchMedia();
  mm.add('(min-width: 980px) and (prefers-reduced-motion: no-preference)', () => {
    sec.classList.add('is-pinned');
    // Épinglage en CSS (position: sticky) : la hauteur de la section = distance horizontale + un écran
    const dist = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    const setHeight = () => { sec.style.height = `${dist() + window.innerHeight}px`; };
    setHeight();
    ScrollTrigger.addEventListener('refreshInit', setHeight);
    const tw = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
        invalidateOnRefresh: true,
        onUpdate: (self) => setProgress(self.progress),
      },
    });
    return () => {
      ScrollTrigger.removeEventListener('refreshInit', setHeight);
      tw.scrollTrigger?.kill(); tw.kill();
      gsap.set(track, { clearProps: 'transform' });
      sec.style.height = '';
      sec.classList.remove('is-pinned');
    };
  });
  mm.add('(max-width: 979px), (prefers-reduced-motion: reduce)', () => {
    const onScroll = () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      setProgress(max > 0 ? viewport.scrollLeft / max : 0);
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
  });
}

// ───────── Calculateur de temps récupéré ─────────
export function initRoi() {
  const box = document.querySelector('[data-roi]');
  if (!box) return;
  const { plans, setup, currency } = CONFIG.pricing;
  const inputs = Object.fromEntries([...box.querySelectorAll('[data-roi-input]')].map((i) => [i.dataset.roiInput, i]));
  const out = (k) => box.querySelector(`[data-out="${k}"]`);
  const res = (k) => box.querySelector(`[data-roi="${k}"]`);
  const state = { hours: 0, value: 0 };
  const money = (v) => `${fmt(Math.round(v))} ${currency}`;

  const update = () => {
    const team = +inputs.team.value;
    const hours = +inputs.hours.value;
    const cost = +inputs.cost.value;
    const rate = +inputs.rate.value / 100;
    out('team').textContent = team;
    out('hours').textContent = `${hours} h`;
    out('cost').textContent = `${cost} ${currency}`;
    out('rate').textContent = `${Math.round(rate * 100)} %`;
    Object.values(inputs).forEach((i) => i.style.setProperty('--p', `${((i.value - i.min) / (i.max - i.min)) * 100}%`));

    const monthlyHours = team * hours * rate * 4.33;
    const value = monthlyHours * cost;
    const planKey = team <= 3 ? 'starter' : team <= 15 ? 'pro' : 'enterprise';
    const price = plans[planKey];
    const fee = setup?.[planKey];
    res('plan').textContent = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' }[planKey];
    res('cost').textContent = price == null ? 'Sur devis' : money(price);
    const net = price == null ? null : value - price;
    res('payback').textContent = net && net > 0 && fee != null
      ? `${Math.max(1, Math.ceil((fee / net) * 30))} jours`
      : '—';

    gsap.to(state, {
      hours: monthlyHours, value, duration: reduced() ? 0 : 0.6, ease: 'power3.out', overwrite: true,
      onUpdate: () => {
        res('hours').textContent = fmt(Math.round(state.hours));
        res('value').textContent = money(state.value);
      },
    });
    const max = Math.max(value, price || 0, 1);
    box.querySelector('[data-roi-bar="cost"]').style.transform = `scaleX(${price == null ? 0 : price / max})`;
    box.querySelector('[data-roi-bar="value"]').style.transform = `scaleX(${value / max})`;
  };
  Object.values(inputs).forEach((i) => i.addEventListener('input', update));
  box.querySelector('[data-roi-form]').addEventListener('submit', (e) => e.preventDefault());
  update();
}

// ───────── Palette de commandes ⌘K ─────────
export function initCommandPalette() {
  const root = document.querySelector('[data-cmdk]');
  if (!root) return;
  const input = root.querySelector('[data-cmdk-input]');
  const list = root.querySelector('[data-cmdk-list]');
  const hint = document.querySelector('[data-kbd-hint]');
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if (!isMac) document.querySelectorAll('.nav-k kbd:first-child, [data-kbd-hint] kbd:first-child').forEach((k) => { k.textContent = 'Ctrl'; });

  const go = (sel) => () => scrollToTarget(sel);
  const items = [
    { g: 'Actions', ic: 'play', label: 'Lancer le film produit', run: () => { scrollToTarget('#video'); setTimeout(() => document.querySelector('[data-player-toggle]')?.click(), 900); } },
    { g: 'Actions', ic: 'spark', label: 'Essayer l’assistant IA', run: () => { scrollToTarget('#demo'); setTimeout(() => document.querySelector('[data-tab="assistant"]')?.click(), 700); } },
    { g: 'Actions', ic: 'clock', label: 'Calculer mon temps récupéré', run: go('#calculateur') },
    { g: 'Actions', ic: 'calendar', label: 'Voir les tarifs en annuel', run: () => { scrollToTarget('#tarifs'); setTimeout(() => document.querySelector('[data-period="annual"]')?.click(), 700); } },
    { g: 'Actions', ic: 'arrowUpRight', label: 'Commencer maintenant', run: () => { const a = document.querySelector('[data-cta]'); if (a) a.click(); } },
    { g: 'Aller à', ic: 'grid', label: 'Produit', run: go('#produit') },
    { g: 'Aller à', ic: 'eye', label: 'Le film', run: go('#video') },
    { g: 'Aller à', ic: 'refresh', label: 'Comment ça marche', run: go('#comment') },
    { g: 'Aller à', ic: 'bolt', label: 'Fonctionnalités', run: go('#fonctionnalites') },
    { g: 'Aller à', ic: 'users', label: 'Pour chaque équipe', run: go('#equipes') },
    { g: 'Aller à', ic: 'chart', label: 'Démo interactive', run: go('#demo') },
    { g: 'Aller à', ic: 'doc', label: 'Tarifs', run: go('#tarifs') },
    { g: 'Aller à', ic: 'chat', label: 'FAQ', run: go('#faq') },
  ];
  let filtered = items;
  let active = 0;
  let lastFocus = null;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    filtered = items.filter((it) => it.label.toLowerCase().includes(q));
    active = Math.min(active, Math.max(0, filtered.length - 1));
    let g = '';
    list.innerHTML = filtered.length ? filtered.map((it, i) => {
      const head = it.g !== g ? `<li class="cmdk-group" role="presentation">${(g = it.g)}</li>` : '';
      return `${head}<li role="option" id="cmdk-opt-${i}" aria-selected="${i === active}" data-i="${i}">${icon(it.ic, 16)}<span>${it.label}</span><kbd class="mono">↵</kbd></li>`;
    }).join('') : '<li class="cmdk-empty">Aucun résultat. Essayez « tarifs » ou « film ».</li>';
    input.setAttribute('aria-activedescendant', filtered.length ? `cmdk-opt-${active}` : '');
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  };

  const open = () => {
    lastFocus = document.activeElement;
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-open'));
    input.value = '';
    active = 0;
    render();
    input.focus();
    if (hint) hint.hidden = true;
  };
  const close = () => {
    root.classList.remove('is-open');
    setTimeout(() => { root.hidden = true; }, reduced() ? 0 : 200);
    lastFocus?.focus?.();
  };
  const runActive = () => {
    const it = filtered[active];
    if (!it) return;
    close();
    setTimeout(it.run, 60);
  };

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      root.hidden ? open() : close();
    } else if (!root.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(1, filtered.length); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + filtered.length) % Math.max(1, filtered.length); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); runActive(); }
      else if (e.key === 'Tab') { e.preventDefault(); input.focus(); }
    }
  });
  input.addEventListener('input', () => { active = 0; render(); });
  list.addEventListener('pointermove', (e) => {
    const li = e.target.closest('[data-i]');
    if (li && +li.dataset.i !== active) { active = +li.dataset.i; render(); }
  });
  list.addEventListener('click', (e) => { const li = e.target.closest('[data-i]'); if (li) { active = +li.dataset.i; runActive(); } });
  root.querySelector('[data-cmdk-close]').addEventListener('click', close);
  document.querySelectorAll('[data-cmdk-open]').forEach((b) => b.addEventListener('click', open));

  // Astuce affichée une fois sur ordinateur
  if (hint && isFinePointer()) {
    let seen = false;
    try { seen = localStorage.getItem('ordra-kbd-hint') === '1'; } catch { /* stockage indisponible */ }
    if (!seen) {
      ScrollTrigger.create({
        trigger: '#video', start: 'top 60%', once: true,
        onEnter: () => {
          hint.hidden = false;
          requestAnimationFrame(() => hint.classList.add('is-in'));
          setTimeout(() => { hint.classList.remove('is-in'); setTimeout(() => { hint.hidden = true; }, 500); }, 5000);
          try { localStorage.setItem('ordra-kbd-hint', '1'); } catch { /* stockage indisponible */ }
        },
      });
    }
  }
}

// ───────── Rail de progression (ordinateur) ─────────
export function initRail() {
  const rail = document.querySelector('[data-rail]');
  if (!rail) return;
  const secs = [
    ['top', 'Accueil'], ['produit', 'Produit'], ['video', 'Le film'], ['probleme', 'Le constat'], ['comment', 'Comment ça marche'],
    ['fonctionnalites', 'Fonctionnalités'], ['equipes', 'Équipes'], ['ia', 'L’IA'], ['demo', 'Démo'], ['calculateur', 'Calculateur'],
    ['tarifs', 'Tarifs'], ['faq', 'FAQ'], ['commencer', 'Commencer'],
  ].filter(([id]) => document.getElementById(id));
  rail.innerHTML = secs.map(([id, l]) => `<a href="#${id}" aria-label="${l}"><span>${l}</span></a>`).join('');
  const links = [...rail.children];
  secs.forEach(([id], i) => {
    ScrollTrigger.create({
      trigger: `#${id}`, start: 'top 50%', end: 'bottom 50%',
      onToggle: (self) => { if (self.isActive) links.forEach((a, k) => a.classList.toggle('is-active', k === i)); },
    });
  });
  const hero = document.getElementById('top');
  const toggle = () => rail.classList.toggle('is-visible', window.scrollY > hero.offsetHeight * 0.4);
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
}

// ───────── Cartes qui s'inclinent sous le pointeur ─────────
export function initTilt() {
  if (!isFinePointer() || reduced()) return;
  document.querySelectorAll('.feat, .plan, .case').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    gsap.set(el, { transformPerspective: 1100 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 6);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 6);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}
