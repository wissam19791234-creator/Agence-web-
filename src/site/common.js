// Éléments communs aux pages marketing : navigation, CTA collant, apparitions au scroll,
// FAQ animée, tarifs, intégrations, preuves sociales.
import { CONFIG } from '../config.js';
import { hydrateStickers, sticker } from '../shared/stickers.js';
import { displayLines, fitDisplayTitles } from '../shared/display.js';
import { icon } from '../shared/icons.js';
import { rewriteLinks, href } from '../shared/paths.js';
import { esc, fmt, reduced } from '../shared/ui.js';

export function initChrome() {
  rewriteLinks();
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  hydrateStickers();
  document.querySelectorAll('[data-ic]').forEach((el) => { if (!el.innerHTML.trim()) el.innerHTML = icon(el.dataset.ic, 18); });

  // Navigation : fond au scroll + lien actif
  const nav = document.querySelector('[data-nav]');
  const onScroll = () => nav?.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const here = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const p = a.getAttribute('href');
    if (p && p !== '/' && here.endsWith(p.replace(/^\./, ''))) a.setAttribute('aria-current', 'page');
  });

  // Menu mobile
  const burger = document.querySelector('[data-burger]');
  const mnav = document.querySelector('[data-mnav]');
  if (burger && mnav) {
    const set = (open) => {
      mnav.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('is-locked', open);
    };
    burger.addEventListener('click', () => set(mnav.hidden));
    mnav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mnav.hidden) set(false); });
  }

  // CTA collant (mobile) : visible après le hero, masqué près du CTA final
  const sticky = document.querySelector('[data-sticky-cta]');
  const hero = document.querySelector('.hero, .page-hero');
  const final = document.querySelector('.final, .foot');
  if (sticky && hero) {
    const st = { past: false, end: false };
    const upd = () => sticky.classList.toggle('is-on', st.past && !st.end);
    new IntersectionObserver(([e]) => { st.past = !e.isIntersecting; upd(); }).observe(hero);
    // masqué dès que le CTA final est visible, et après lui (pied de page)
    if (final) new IntersectionObserver(([e]) => { st.end = e.isIntersecting || e.boundingClientRect.top < 0; upd(); }).observe(final);
  }

  // Relief : le nœud 3D suit légèrement le pointeur (ordinateur uniquement)
  if (!reduced() && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((box) => {
      const img = box.querySelector('img');
      box.addEventListener('pointermove', (e) => {
        const r = box.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = `perspective(700px) rotateY(${x * 18}deg) rotateX(${-y * 18}deg) scale(1.04)`;
      });
      box.addEventListener('pointerleave', () => { img.style.transform = ''; });
    });
  }

  initFaq();
  fitDisplayTitles();
}

/** FAQ : ouverture animée des <details>. */
function initFaq() {
  document.querySelectorAll('.faq-item').forEach((d) => {
    const s = d.querySelector('summary');
    const a = d.querySelector('.faq-a');
    s.addEventListener('click', (e) => {
      if (reduced()) return;
      e.preventDefault();
      if (d.open) {
        const h = a.scrollHeight;
        a.animate([{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        const h = a.scrollHeight;
        a.animate([{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  });
}

/** Tarifs Free / Pro / Business avec bascule mensuel / annuel. */
export function renderPricing(root) {
  if (!root) return;
  const { plans, rows, yearlyDiscount, currency } = CONFIG.pricing;
  root.innerHTML = `
    <div class="billing" role="radiogroup" aria-label="Période de facturation">
      <button type="button" role="radio" aria-checked="true" data-period="monthly">Mensuel</button>
      <button type="button" role="radio" aria-checked="false" data-period="yearly">Annuel <span class="pill pill--accent">−${Math.round(yearlyDiscount * 100)} %</span></button>
    </div>
    <div class="plans">
      ${plans.map((p) => `
        <article class="plan card ${p.recommended ? 'plan--rec' : ''}" data-plan="${p.id}">
          ${p.recommended ? '<span class="plan-flag">Recommandé</span>' : ''}
          <h3>${esc(p.name)}</h3>
          <p class="plan-tag">${esc(p.tagline)}</p>
          <div class="plan-price"><b class="num" data-price="${p.price}">${p.price === 0 ? '0' : fmt.int(p.price)}</b><span>${currency} HT<br />/ mois</span></div>
          <p class="plan-note" data-note>${p.price === 0 ? 'Gratuit pour toujours' : 'Facturé mensuellement'}</p>
          <a class="btn ${p.recommended ? 'btn--primary' : 'btn--secondary'} btn--lg plan-cta" href="${href(`/signup/?plan=${p.id}`)}">${esc(p.cta)}</a>
          <ul class="plan-list">${rows.map(([k, l]) => `<li><span class="plan-k">${esc(l)}</span><span class="plan-v">${esc(p.limits[k])}</span></li>`).join('')}</ul>
        </article>`).join('')}
    </div>
    <p class="plans-foot">Besoin de plus de 50 membres ou d’un hébergement dédié ? <a class="link" href="mailto:${CONFIG.company.email}?subject=Scalify%20%E2%80%94%20offre%20sur%20mesure">Parlons-en</a>.</p>`;
  const btns = root.querySelectorAll('[data-period]');
  const apply = (period) => {
    btns.forEach((b) => { b.setAttribute('aria-checked', String(b.dataset.period === period)); });
    root.querySelector('.billing').classList.toggle('is-yearly', period === 'yearly');
    root.querySelectorAll('.plan').forEach((card) => {
      const b = card.querySelector('[data-price]');
      const base = +b.dataset.price;
      if (!base) return;
      const v = period === 'yearly' ? Math.round(base * (1 - yearlyDiscount)) : base;
      const from = parseInt(b.textContent.replace(/\D/g, ''), 10) || v;
      if (reduced()) b.textContent = fmt.int(v);
      else {
        const t0 = performance.now();
        const step = (now) => { const k = Math.min(1, (now - t0) / 380); b.textContent = fmt.int(from + (v - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }
      card.querySelector('[data-note]').textContent = period === 'yearly' ? `Soit ${fmt.int(v * 12)} ${currency} HT facturés par an` : 'Facturé mensuellement';
    });
  };
  btns.forEach((b) => b.addEventListener('click', () => apply(b.dataset.period)));
  root.querySelector('.billing').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const next = root.querySelector('[data-period][aria-checked="false"]');
    apply(next.dataset.period);
    next.focus();
  });
}

export function renderIntegrations(root) {
  if (!root) return;
  const label = { available: 'Connecté', soon: 'Bientôt' };
  root.innerHTML = CONFIG.integrations.map((i) => `
    <li class="integ-item ${i.status === 'available' ? 'is-on' : ''}">
      <span class="integ-logo" aria-hidden="true">${esc(i.name.split(/\s/).map((w) => w[0]).join('').slice(0, 2))}</span>
      <b>${esc(i.name)}</b>
      <span class="pill ${i.status === 'available' ? 'pill--good' : ''}">${label[i.status] || 'Bientôt'}</span>
    </li>`).join('');
}

/** Preuves sociales : vrais avis s'ils existent, sinon programme « premières équipes ». */
export function renderProof(root) {
  if (!root) return;
  const t = CONFIG.testimonials;
  if (t.length) {
    root.innerHTML = `<div class="wrap"><header class="sec-head"><p class="eyebrow">Ils utilisent ${CONFIG.brand}</p><h2>Ce qu’en disent les équipes.</h2></header>
      ${CONFIG.logos.length ? `<ul class="logos">${CONFIG.logos.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
      <div class="quotes">${t.map((q) => `<figure class="card quote"><blockquote>« ${esc(q.quote)} »</blockquote><figcaption><b>${esc(q.name)}</b><span>${esc(q.role)} · ${esc(q.company)}</span></figcaption></figure>`).join('')}</div></div>`;
    return;
  }
  root.innerHTML = `<div class="wrap"><div class="early">
    <div class="early-copy">
      <p class="eyebrow">Accès anticipé</p>
      <h2 class="display">${displayLines('Rejoignez<br />les premières<br />équipes.')}</h2>
      <p class="sec-sub">${CONFIG.brand} se construit avec ses premiers utilisateurs : nouveautés en avant-première et ligne directe avec l’équipe produit.</p>
      <a class="btn btn--primary btn--lg" href="${href('/signup/')}">Rejoindre l’accès anticipé</a>
    </div>
    <ul class="early-list">
      <li>${sticker('spark', { size: 44, rot: -8 })}<span><b>Influencez la roadmap</b>Vos demandes passent en priorité.</span></li>
      <li>${sticker('chat', { size: 44, rot: 6 })}<span><b>Accompagnement direct</b>Un échange avec l’équipe pour configurer votre espace.</span></li>
      <li>${sticker('coin', { size: 44, rot: -10 })}<span><b>Tarif fondateur</b>Conservé tant que vous restez abonné.</span></li>
    </ul>
  </div></div>`;
}
