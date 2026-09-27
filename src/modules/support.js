// Service client : bulle de discussion (réponses instantanées + transfert à l'équipe par email).
import { CONFIG } from '../config.js';
import { gsap } from './motion.js';
import { fmt, prefersReducedMotion, wait } from './utils.js';
import { send } from './site.js';

const esc = (v = '') => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function answers() {
  const { plans, setup, currency, custom, annualDiscount } = CONFIG.pricing;
  const m = (v) => `${fmt(v)} ${currency}`;
  return [
    { id: 'offre', q: 'Quelle offre choisir ?', k: /offre|plan|choisir|starter|pro|business|prix|tarif|co[uû]t|combien/i,
      a: `En bref : <b>Starter</b> (${m(plans.starter)}/mois) jusqu’à 5 personnes, <b>Pro</b> (${m(plans.pro)}/mois) jusqu’à 15, <b>Business</b> (${m(plans.business)}/mois) jusqu’à 50. Au-delà, on compose une offre <b>sur mesure</b> dès ${m(custom.base)}/mois.`,
      then: [['Voir les offres', '#tarifs'], ['Composer mon offre', '[data-custom]']] },
    { id: 'install', q: 'Et l’installation ?', k: /install|param[eé]trage|mise en (route|place)|d[eé]lai|frais/i,
      a: `On branche vos outils et on configure vos premiers workflows pour vous : ${m(setup.starter)}, ${m(setup.pro)} ou ${m(setup.business)} selon l’offre, une seule fois. <b>Offerte</b> avec l’engagement annuel (−${Math.round(annualDiscount * 100)} %). Comptez 5 à 10 jours ouvrés.` },
    { id: 'secu', q: 'Mes données sont-elles protégées ?', k: /s[eé]cu|donn[eé]es|rgpd|chiffr|h[eé]berg/i,
      a: 'Chiffrées en transit et au repos, accès par rôle, et elles restent à vous : jamais utilisées pour entraîner des modèles pour d’autres clients. Hébergement privé en UE possible sur l’offre sur mesure.' },
    { id: 'essai', q: 'Je peux tester avant ?', k: /test|essai|d[eé]mo|gratuit|essayer/i,
      a: 'Oui : la démo interactive plus haut fonctionne tout de suite. Et on peut organiser une démo de 20 min sur vos propres données.',
      then: [['Ouvrir la démo', '#demo']] },
    { id: 'humain', q: 'Parler à un humain', k: /humain|conseill|appel|rappel|t[eé]l[eé]phone|quelqu/i, human: true },
  ];
}

export function initSupport() {
  const root = document.querySelector('[data-support]');
  if (!root) return;
  const S = CONFIG.support || {};
  const panel = root.querySelector('[data-support-panel]');
  const launcher = root.querySelector('[data-support-launch]');
  const log = root.querySelector('[data-support-log]');
  const chips = root.querySelector('[data-support-chips]');
  const form = root.querySelector('[data-support-form]');
  const input = form.querySelector('input');
  const teaser = root.querySelector('[data-support-teaser]');
  const badge = root.querySelector('[data-support-badge]');
  const A = answers();
  const reduced = prefersReducedMotion();
  let started = false;
  let awaitingEmail = null;

  root.querySelectorAll('[data-support-name]').forEach((el) => { el.textContent = S.agent || 'Support'; });
  root.querySelectorAll('[data-support-reply]').forEach((el) => { el.textContent = S.reply || ''; });

  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const add = (html, who = 'bot') => {
    const el = document.createElement('div');
    el.className = `sp-msg sp-msg--${who}`;
    el.innerHTML = html;
    log.appendChild(el);
    if (!reduced) gsap.from(el, { y: 10, opacity: 0, duration: 0.35, ease: 'expo.out' });
    scroll();
    return el;
  };
  const typing = async (ms = 700) => {
    const t = add('<span class="sp-typing"><i></i><i></i><i></i></span>');
    await wait(reduced ? 0 : ms);
    t.remove();
  };
  const renderChips = (list = A) => {
    chips.innerHTML = list.map((x) => `<button type="button" data-id="${x.id}">${esc(x.q)}</button>`).join('');
  };
  const goTo = (sel) => {
    close();
    document.querySelector(sel)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  const reply = async (item) => {
    await typing(item.human ? 500 : 800);
    if (item.human) {
      add(`Avec plaisir. Laissez votre email ou votre téléphone : l’équipe vous répond ${esc((CONFIG.company.responseTime || '').toLowerCase().replace('réponse ', '')) || 'rapidement'}.`);
      awaitingEmail = true;
      input.placeholder = 'Votre email ou téléphone';
      input.focus();
      renderChips([]);
      return;
    }
    const el = add(item.a);
    if (item.then) {
      const row = document.createElement('div');
      row.className = 'sp-links';
      row.innerHTML = item.then.map(([l, h]) => `<button type="button" data-go="${esc(h)}">${esc(l)} →</button>`).join('');
      el.appendChild(row);
    }
    renderChips(A.filter((x) => x.id !== item.id));
  };

  const start = async () => {
    if (started) return;
    started = true;
    await typing(500);
    add(`Bonjour 👋 Je suis ${esc(S.agent || 'là')}. Une question sur ${esc(CONFIG.brand)} ? Choisissez ci-dessous ou écrivez-moi.`);
    renderChips();
  };

  const open = () => {
    root.classList.add('is-open');
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    teaser.hidden = true;
    badge.hidden = true;
    if (!reduced) gsap.fromTo(panel, { y: 20, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'expo.out' });
    start();
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  };
  const close = () => {
    root.classList.remove('is-open');
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
  };

  launcher.addEventListener('click', () => (panel.hidden ? open() : close()));
  root.querySelector('[data-support-close]').addEventListener('click', () => { close(); launcher.focus(); });
  teaser.addEventListener('click', open);
  document.querySelectorAll('[data-support-open]').forEach((b) => b.addEventListener('click', open));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { close(); launcher.focus(); } });

  chips.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b) return;
    const item = A.find((x) => x.id === b.dataset.id);
    add(esc(item.q), 'me');
    renderChips([]);
    reply(item);
  });
  log.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) goTo(b.dataset.go);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    add(esc(text), 'me');
    if (awaitingEmail) {
      const ok = /@|\d{6,}/.test(text.replace(/\s/g, ''));
      if (!ok) { await typing(400); add('Je n’ai pas reconnu d’email ou de numéro. Vous pouvez réessayer ?'); return; }
      awaitingEmail = false;
      input.placeholder = 'Écrivez votre message…';
      await typing(600);
      try {
        const history = [...log.querySelectorAll('.sp-msg--me')].map((m) => m.textContent).join(' | ');
        await send('support', { contact: text, message: history });
        add(`C’est transmis ✓ On vous recontacte très vite. Vous pouvez aussi écrire à <a href="mailto:${esc(CONFIG.company.email)}">${esc(CONFIG.company.email)}</a>.`);
      } catch {
        add(`L’envoi n’a pas abouti. Écrivez-nous à <a href="mailto:${esc(CONFIG.company.email)}">${esc(CONFIG.company.email)}</a>.`);
      }
      renderChips(A.filter((x) => !x.human));
      return;
    }
    const item = A.find((x) => x.k.test(text));
    if (item) { reply(item); return; }
    await typing(700);
    add('Bonne question ! Je préfère vous mettre en relation avec l’équipe pour une réponse précise.');
    reply(A.find((x) => x.human));
  });

  // Petite invitation après quelques secondes (une seule fois par visite)
  let shown = false;
  try { shown = sessionStorage.getItem('ordra-support-teaser') === '1'; } catch { /* stockage indisponible */ }
  if (!shown) {
    setTimeout(() => {
      if (!panel.hidden) return;
      teaser.hidden = false;
      badge.hidden = false;
      if (!reduced) gsap.from(teaser, { y: 12, opacity: 0, duration: 0.5, ease: 'back.out(2)' });
      setTimeout(() => { teaser.hidden = true; }, 12000);
      try { sessionStorage.setItem('ordra-support-teaser', '1'); } catch { /* stockage indisponible */ }
    }, 9000);
  }
}
