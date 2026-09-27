// Avant/Après, tarifs, FAQ, CTA final.
import { CONFIG } from '../config.js';
import { gsap } from './motion.js';
import { clamp, fmt, isFinePointer, prefersReducedMotion } from './utils.js';

export function initBeforeAfter() {
  const ba = document.querySelector('[data-ba]');
  if (!ba) return;
  const handle = ba.querySelector('[data-ba-handle]');
  let pos = 50;

  const set = (v, animate = false) => {
    pos = clamp(v, 0, 100);
    const apply = () => {
      ba.style.setProperty('--pos', `${pos}%`);
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
      handle.setAttribute('aria-valuetext', `${Math.round(pos)} % avant, ${Math.round(100 - pos)} % après`);
    };
    if (animate && !prefersReducedMotion()) {
      const cur = { v: parseFloat(ba.style.getPropertyValue('--pos')) || 50 };
      gsap.to(cur, { v: pos, duration: 0.6, ease: 'power3.out', onUpdate: () => {
        ba.style.setProperty('--pos', `${cur.v}%`);
      }, onComplete: apply });
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
    } else apply();
  };

  const fromEvent = (e) => {
    const r = ba.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };

  let intro = null;
  const stopIntro = () => { intro?.kill(); intro = null; };
  ba.addEventListener('pointerdown', stopIntro, { capture: true });
  handle.addEventListener('keydown', stopIntro, { capture: true });

  let dragging = false;
  const start = (e) => {
    dragging = true;
    ba.classList.add('is-dragging');
    handle.setPointerCapture?.(e.pointerId);
    set(fromEvent(e));
  };
  handle.addEventListener('pointerdown', start);
  ba.addEventListener('pointerdown', (e) => {
    if (e.target.closest('[data-ba-handle]')) return;
    if (e.pointerType === 'mouse') { set(fromEvent(e), true); }
  });
  handle.addEventListener('pointermove', (e) => { if (dragging) set(fromEvent(e)); });
  const end = () => { dragging = false; ba.classList.remove('is-dragging'); };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);

  handle.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 4;
    const map = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step };
    if (e.key in map) { e.preventDefault(); set(pos + map[e.key]); }
    else if (e.key === 'Home') { e.preventDefault(); set(0); }
    else if (e.key === 'End') { e.preventDefault(); set(100); }
  });

  // Petite démonstration du geste à l'arrivée dans le viewport
  if (!prefersReducedMotion()) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const cur = { v: 50 };
      intro = gsap.timeline()
        .to(cur, { v: 72, duration: 0.9, ease: 'power2.inOut', onUpdate: () => ba.style.setProperty('--pos', `${cur.v}%`) })
        .to(cur, { v: 30, duration: 1.1, ease: 'power2.inOut', onUpdate: () => ba.style.setProperty('--pos', `${cur.v}%`) })
        .to(cur, { v: 50, duration: 0.9, ease: 'power2.inOut', onUpdate: () => ba.style.setProperty('--pos', `${cur.v}%`), onComplete: () => set(50) });
    }, { threshold: 0.6 });
    io.observe(ba);
  }
}

export function initPricing() {
  const group = document.querySelector('[data-billing]');
  if (!group) return;
  const { currency, annualDiscount, plans, setup = {}, setupWaivedAnnual } = CONFIG.pricing;
  const buttons = [...group.querySelectorAll('[data-period]')];
  const money = (v) => `${fmt(v)} ${currency}`;
  document.querySelectorAll('[data-currency]').forEach((c) => { c.textContent = currency; });
  document.querySelectorAll('[data-from-price]').forEach((el) => {
    el.textContent = `À partir de ${money(plans.starter)} HT / mois · Mise en route accompagnée${setupWaivedAnnual ? ' · Installation offerte en annuel' : ''}`;
  });
  const save = group.querySelector('.billing-save');
  if (save) save.innerHTML = `−${Math.round(annualDiscount * 100)} %${setupWaivedAnnual ? '<span class="billing-extra"> · installation offerte</span>' : ''}`;
  document.querySelectorAll('[data-setup-cell]').forEach((td) => {
    const v = setup[td.dataset.setupCell];
    td.textContent = v == null ? 'Sur devis' : `${money(v)} HT${setupWaivedAnnual ? ' · offerte en annuel' : ''}`;
  });

  const apply = (period) => {
    const annual = period === 'annual';
    group.classList.toggle('is-annual', annual);
    buttons.forEach((b) => {
      const on = b.dataset.period === period;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('[data-plan]').forEach((card) => {
      const base = plans[card.dataset.plan];
      const priceEl = card.querySelector('[data-price]');
      const note = card.querySelector('[data-note]');
      if (base == null || !priceEl) return;
      const value = annual ? Math.round(base * (1 - annualDiscount)) : base;
      priceEl.classList.add('is-swap');
      setTimeout(() => {
        priceEl.textContent = String(value);
        priceEl.classList.remove('is-swap');
      }, prefersReducedMotion() ? 0 : 180);
      if (note) {
        note.textContent = annual
          ? `Facturé ${fmt(value * 12)} ${currency} HT par an`
          : 'Facturation mensuelle · sans engagement';
      }
      const box = card.querySelector('[data-setup]');
      const fee = setup[card.dataset.plan];
      if (box && fee != null) {
        const waived = annual && setupWaivedAnnual;
        box.classList.toggle('is-waived', waived);
        box.querySelector('[data-setup-price]').innerHTML = waived
          ? `<s>${money(fee)}</s> Installation offerte`
          : `+ ${money(fee)} HT`;
        box.querySelector('[data-setup-label]').textContent = waived
          ? 'Avec l’engagement annuel'
          : 'Installation & paramétrage · une fois';
      }
    });
  };

  buttons.forEach((b, i) => {
    b.addEventListener('click', () => apply(b.dataset.period));
    b.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const next = buttons[(i + 1) % buttons.length];
        apply(next.dataset.period);
        next.focus();
      }
    });
  });
  apply('monthly');

  if (!prefersReducedMotion()) {
    gsap.from('.plan', {
      y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: '.plans', start: 'top 85%', once: true },
    });
  }
}

/** Accordéons <details> avec animation de hauteur. */
export function initAccordions() {
  const reduced = prefersReducedMotion();
  document.querySelectorAll('.faq-item, .compare').forEach((det) => {
    const summary = det.querySelector('summary');
    const content = det.querySelector('.faq-a, .compare-scroll');
    if (!summary || !content) return;
    let anim = null;
    summary.addEventListener('click', (e) => {
      if (reduced) return;
      e.preventDefault();
      anim?.kill();
      if (det.open) {
        anim = gsap.to(content, {
          height: 0, opacity: 0, duration: 0.45, ease: 'power3.inOut',
          onComplete: () => { det.open = false; gsap.set(content, { clearProps: 'height,opacity' }); },
        });
      } else {
        det.open = true;
        anim = gsap.fromTo(content, { height: 0, opacity: 0 }, {
          height: 'auto', opacity: 1, duration: 0.6, ease: 'power3.out',
          onComplete: () => gsap.set(content, { clearProps: 'height' }),
        });
      }
    });
  });
}

export function initFinal() {
  const sec = document.querySelector('[data-final]');
  if (!sec) return;
  const rig = sec.querySelector('[data-final-rig]');
  if (!isFinePointer() || prefersReducedMotion()) return;
  sec.addEventListener('pointermove', (e) => {
    const r = sec.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    sec.style.setProperty('--fx', `${x * 100}%`);
    sec.style.setProperty('--fy', `${y * 100}%`);
    rig.style.setProperty('--fry', `${(x - 0.5) * 24}deg`);
    rig.style.setProperty('--frx', `${18 - (y - 0.5) * 18}deg`);
  });
  sec.addEventListener('pointerleave', () => {
    rig.style.removeProperty('--fry');
    rig.style.removeProperty('--frx');
  });
}
