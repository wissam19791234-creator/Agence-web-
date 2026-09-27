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
  document.querySelectorAll('[data-mailto]').forEach((a) => { a.href = `mailto:${c.email}`; });

  // Étiquettes « exemple » tant que les contenus illustratifs ne sont pas remplacés
  document.querySelectorAll('[data-example-tag]').forEach((t) => { t.hidden = !CONFIG.exampleContent; });

  // Logos (mots-symboles) et chiffres clés
  const logos = document.querySelector('[data-logos]');
  if (logos) logos.innerHTML = CONFIG.logos.map((l) => `<li><span class="logo-word">${esc(l)}</span></li>`).join('');
  const stats = document.querySelector('[data-stats]');
  if (stats) stats.innerHTML = CONFIG.stats.map((st) => `<div class="proof-stat"><b class="num">${esc(st.value)}</b><span>${esc(st.label)}</span></div>`).join('');

  // Avis clients
  const reviews = document.querySelector('[data-reviews]');
  if (reviews) {
    const stars = (n = 5) => `<span class="stars" aria-label="${n} sur 5">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
    reviews.innerHTML = CONFIG.testimonials.map((t) => `
      <figure class="review">
        ${stars(t.rating)}
        <blockquote>« ${esc(t.quote)} »</blockquote>
        <figcaption><span class="review-av" data-avatars="${esc(t.avatar || '')}">${esc(t.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span>
          <span><b>${esc(t.name)}</b><small>${esc(t.role)} · ${esc(t.company)}</small></span></figcaption>
      </figure>`).join('');
  }

  // Études de cas
  const studies = document.querySelector('[data-studies]');
  if (studies) {
    const hues = ['#d4ff3a', '#b9a7ff', '#eaff8f'];
    studies.innerHTML = CONFIG.caseStudies.map((st, i) => `
      <article class="study" style="--c:${hues[i % 3]}">
        <div class="study-top"><span class="study-sector mono">${esc(st.sector)}</span></div>
        <h3>${esc(st.company)}</h3>
        <b class="study-metric">${esc(st.metric)}<small>${esc(st.metricLabel || '')}</small></b>
        <dl>
          <div><dt>Avant</dt><dd>${esc(st.challenge)}</dd></div>
          <div><dt>Avec Ordra</dt><dd>${esc(st.solution)}</dd></div>
          <div><dt>Résultat</dt><dd>${esc(st.result)}</dd></div>
        </dl>
      </article>`).join('');
  }

  // Équipe
  const team = document.querySelector('[data-team]');
  if (team) {
    team.innerHTML = CONFIG.team.map((m, i) => `
      <li class="member" style="--c:${['#d4ff3a', '#b9a7ff', '#eaff8f', '#c7f9cc'][i % 4]}">
        <div class="member-photo" ${m.photo ? '' : `data-avatars="${esc(m.avatar || '')}" data-avatar-size="lg"`}>${m.photo
          ? `<img src="${esc(m.photo)}" alt="Portrait de ${esc(m.name)}, ${esc(m.role)}" loading="lazy" width="480" height="600" />` : ''}</div>
        <b>${esc(m.name)}</b><small>${esc(m.role)}</small>
      </li>`).join('');
  }

  // Avatars illustrés (chargés après l'affichage : ~200 Ko)
  const slots = document.querySelectorAll('[data-avatars]');
  if (slots.length) {
    import('../data/avatars.js').then(({ AVATARS }) => {
      slots.forEach((el) => {
        const keys = el.dataset.avatars.split(',').filter((k) => AVATARS[k]);
        if (!keys.length) return;
        el.innerHTML = keys.map((k) => `<img src="${AVATARS[k]}" alt="" width="96" height="96" decoding="async" />`).join('');
      });
    });
  }
}

// ───────── Formulaires ─────────
export async function send(kind, data) {
  // Démonstration sans envoi : pas d'adresse configurée, ou page publiée en aperçu (artifact)
  if (!CONFIG.formEndpoint || __ARTIFACT__) { await wait(900); return true; }
  const res = await fetch(CONFIG.formEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ _subject: `${CONFIG.brand} · ${kind === 'signup' ? 'Nouvelle inscription' : 'Nouveau message'}`, form: kind, ...data, page: location.href }),
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
    const details = modal.querySelector('[data-plan-details]');
    if (details) details.value = planSelect.value === 'custom' ? document.querySelector('[data-custom]')?.dataset.summary || '' : '';
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
