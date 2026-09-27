// Contenus pilotés par la config (avis, études de cas, équipe, contact),
// formulaires (inscription + contact), fenêtre d'inscription et consentement cookies.
import { CONFIG } from '../config.js';
import { icon } from './icons.js';
import { gsap } from './motion.js';
import { prefersReducedMotion, wait } from './utils.js';

/* global __ARTIFACT__ */
const esc = (v = '') => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todo = '<span class="todo mono">À compléter</span>';

export function initContent() {
  const c = CONFIG.company;
  const fields = {
    ...c,
    addressLine: c.street,
    cityLine: `${c.postalCode} ${c.city} · ${c.country}`,
  };
  document.querySelectorAll('[data-company]').forEach((el) => { el.textContent = fields[el.dataset.company] || ''; });
  document.querySelectorAll('[data-ic]').forEach((el) => { if (!el.innerHTML.trim()) el.innerHTML = icon(el.dataset.ic, 16); });
  const addr = [c.street, c.postalCode, c.city, c.country].filter((x) => x && !x.startsWith('[')).join(' ');
  document.querySelectorAll('[data-itinerary]').forEach((a) => {
    a.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr || CONFIG.brand)}`;
  });

  // Avis clients
  const reviews = document.querySelector('[data-reviews]');
  if (reviews) {
    const list = CONFIG.testimonials.length ? CONFIG.testimonials : [{}, {}, {}];
    const stars = (n) => `<span class="stars" aria-label="${n ? `${n} sur 5` : 'Note à venir'}">${'★'.repeat(n || 5)}</span>`;
    reviews.innerHTML = `
      <div class="reviews-summary">
        ${CONFIG.testimonials.length
          ? `<b class="reviews-score">${(CONFIG.testimonials.reduce((a, t) => a + (t.rating || 5), 0) / CONFIG.testimonials.length).toFixed(1).replace('.', ',')}</b>${stars(5)}<small>${CONFIG.testimonials.length} avis vérifiés</small>`
          : `<b class="reviews-score">Bientôt</b>${stars(0)}<small>Vos premiers avis clients s’afficheront ici</small>`}
      </div>
      ${list.map((t) => `
        <figure class="review${t.quote ? '' : ' is-empty'}">
          ${stars(t.rating)}
          <blockquote>${t.quote ? `« ${esc(t.quote)} »` : '« Emplacement pour un avis client : ce qui a changé concrètement, en une ou deux phrases. »'}</blockquote>
          <figcaption><span class="review-av">${t.name ? esc(t.name.split(' ').map((w) => w[0]).join('').slice(0, 2)) : ''}</span>
            <span><b>${t.name ? esc(t.name) : 'Prénom Nom'}</b><small>${t.role ? `${esc(t.role)} · ${esc(t.company)}` : 'Fonction · Entreprise'}</small></span>${t.quote ? '' : todo}</figcaption>
        </figure>`).join('')}`;
  }

  // Études de cas
  const studies = document.querySelector('[data-studies]');
  if (studies) {
    const list = CONFIG.caseStudies.length ? CONFIG.caseStudies : [{ sector: 'Commerce B2B' }, { sector: 'Services' }, { sector: 'Industrie' }];
    const hues = ['#ff6b2c', '#ffc857', '#ff4d8d'];
    studies.innerHTML = list.map((s, i) => `
      <article class="study${s.challenge ? '' : ' is-empty'}" style="--c:${hues[i % 3]}">
        <div class="study-top"><span class="study-sector mono">${esc(s.sector || 'Secteur')}</span>${s.challenge ? '' : todo}</div>
        <h3>${s.company ? esc(s.company) : 'Nom du client'}</h3>
        <b class="study-metric">${s.metric ? esc(s.metric) : 'Résultat clé'}</b>
        <dl>
          <div><dt>Le défi</dt><dd>${s.challenge ? esc(s.challenge) : 'Ce qui bloquait avant Ordra.'}</dd></div>
          <div><dt>La solution</dt><dd>${s.solution ? esc(s.solution) : 'Les modules et automatisations mis en place.'}</dd></div>
          <div><dt>Le résultat</dt><dd>${s.result ? esc(s.result) : 'Ce qui a changé, chiffres à l’appui.'}</dd></div>
        </dl>
      </article>`).join('');
  }

  // Équipe
  const team = document.querySelector('[data-team]');
  if (team) {
    const list = CONFIG.team.length ? CONFIG.team : [{}, {}, {}, {}];
    team.innerHTML = list.map((m, i) => `
      <li class="member${m.name ? '' : ' is-empty'}" style="--c:${['#ff6b2c', '#ffc857', '#ff4d8d', '#ff8a3d'][i % 4]}">
        <div class="member-photo">${m.photo
          ? `<img src="${esc(m.photo)}" alt="Portrait de ${esc(m.name)}, ${esc(m.role)}" loading="lazy" width="480" height="600" />`
          : '<svg viewBox="0 0 100 120" aria-hidden="true"><circle cx="50" cy="44" r="20"/><path d="M14 120c4-26 18-38 36-38s32 12 36 38"/></svg>'}</div>
        <b>${m.name ? esc(m.name) : 'Prénom Nom'}</b><small>${m.role ? esc(m.role) : 'Rôle'}</small>${m.name ? '' : todo}
      </li>`).join('');
  }
}

// ───────── Formulaires ─────────
async function send(kind, data) {
  if (!CONFIG.formEndpoint) { await wait(900); return true; }
  const res = await fetch(CONFIG.formEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ form: kind, ...data, page: location.href }),
  });
  return res.ok;
}

export function initForms() {
  document.querySelectorAll('[data-form]').forEach((form) => {
    const err = form.querySelector('.form-error');
    const btn = form.querySelector('.form-submit');
    const done = form.querySelector('.form-done');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.hidden = true;
      const invalid = [...form.elements].find((el) => el.willValidate && !el.checkValidity());
      if (invalid) {
        form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
        invalid.setAttribute('aria-invalid', 'true');
        const label = invalid.type === 'checkbox' ? 'Merci de cocher la case de consentement.'
          : invalid.type === 'email' && invalid.value ? 'Cette adresse email ne semble pas valide.'
          : `Merci de renseigner le champ « ${form.querySelector(`label[for="${invalid.id}"]`)?.textContent || 'requis'} ».`;
        err.textContent = label;
        err.hidden = false;
        invalid.focus();
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      btn.classList.add('is-loading');
      btn.disabled = true;
      try {
        const ok = await send(form.dataset.form, data);
        if (!ok) throw new Error('refus');
        if (window.gtag) window.gtag('event', form.dataset.form === 'signup' ? 'sign_up' : 'generate_lead');
        if (!__ARTIFACT__ && CONFIG.formEndpoint && CONFIG.thankYouPage) {
          location.href = CONFIG.thankYouPage;
          return;
        }
        [...form.children].forEach((ch) => { if (ch !== done) ch.hidden = true; });
        done.hidden = false;
        if (!prefersReducedMotion()) gsap.from(done, { y: 16, opacity: 0, duration: 0.6, ease: 'expo.out' });
      } catch {
        err.textContent = `L’envoi n’a pas abouti. Réessayez, ou écrivez-nous à ${CONFIG.company.email}.`;
        err.hidden = false;
      } finally {
        btn.classList.remove('is-loading');
        btn.disabled = false;
      }
    });
    form.addEventListener('input', (e) => { e.target.removeAttribute('aria-invalid'); err.hidden = true; });
    form.addEventListener('change', () => { err.hidden = true; });
  });
}

// ───────── Fenêtre d'inscription ─────────
export function initSignupModal() {
  const modal = document.querySelector('[data-modal]');
  if (!modal) return;
  const panel = modal.querySelector('.modal-panel');
  const planSelect = modal.querySelector('[data-plan-select]');
  let last = null;
  const open = (plan) => {
    last = document.activeElement;
    if (plan) planSelect.value = plan;
    modal.hidden = false;
    document.documentElement.classList.add('is-locked');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    setTimeout(() => modal.querySelector('input')?.focus(), 60);
  };
  const form = modal.querySelector('form');
  const close = () => {
    if (modal.hidden) return;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('is-locked');
    setTimeout(() => {
      modal.hidden = true;
      // Après un envoi réussi, le formulaire est prêt pour une nouvelle demande
      const done = form.querySelector('.form-done');
      if (!done.hidden) {
        form.reset();
        [...form.children].forEach((ch) => { ch.hidden = ch === done || ch.classList.contains('form-error'); });
      }
    }, prefersReducedMotion() ? 0 : 250);
    last?.focus?.();
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#inscription"]');
    if (!a) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    open(a.dataset.planPick);
  }, true);
  modal.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      const f = [...panel.querySelectorAll('a[href], button:not([disabled]), input, select, textarea')].filter((el) => !el.closest('[hidden]'));
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  });
  if (location.hash === '#inscription') open();
}

// ───────── Consentement + Google Analytics ─────────
export function initConsent() {
  const bar = document.querySelector('[data-consent]');
  if (!bar) return;
  const KEY = 'ordra-consent';
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch { /* stockage indisponible */ } };
  const loadGA = () => {
    if (!CONFIG.gaId || window.gtag) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(CONFIG.gaId)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CONFIG.gaId, { anonymize_ip: true });
  };
  const show = () => { bar.hidden = false; requestAnimationFrame(() => bar.classList.add('is-in')); };
  const hide = () => { bar.classList.remove('is-in'); setTimeout(() => { bar.hidden = true; }, 300); };
  bar.querySelectorAll('[data-consent-choice]').forEach((b) => b.addEventListener('click', () => {
    write(b.dataset.consentChoice);
    if (b.dataset.consentChoice === 'accept') loadGA();
    hide();
  }));
  document.querySelectorAll('[data-consent-open]').forEach((b) => b.addEventListener('click', show));
  const v = read();
  if (v === 'accept') loadGA();
  // Le bandeau ne s'affiche que si une mesure d'audience est configurée
  else if (v == null && CONFIG.gaId) setTimeout(show, 1500);
}
