// Film produit intégré : une bande-annonce de 60 s façon « launch video »
// (coupes sur le beat, typographie cinétique, mouvements de caméra, curseur simulé).
import { gsap } from './motion.js';
import { CONFIG } from '../config.js';
import { mountDashboard, logoMark } from './dashboard.js';
import { icon } from './icons.js';
import { buildScore } from './sound.js';

export const FILM_DURATION = 60;
export const CHAPTERS = [0, 5, 15, 30, 45, 55];

const CHAOS = [
  ['mail', 'Re: Re: TR: Devis T4'], ['table', 'ventes_v7_FINAL(2).xlsx'], ['chat', '38 messages non lus'],
  ['crm', '214 contacts sans suivi'], ['alert', 'Facture en retard'], ['doc', 'Reporting — accès refusé'],
  ['mail', 'Relance : toujours rien ?'], ['task', '6 tâches en retard'], ['table', 'export_clients.csv'],
  ['calendar', 'Réunion déplacée (encore)'], ['chat', 'Qui a le chiffre de sept. ?'], ['mail', 'URGENT : bilan mensuel'],
  ['folder', 'Dossier « À trier »'], ['alert', 'Stock : rupture ?'], ['doc', 'Compte-rendu_v3.docx'],
  ['table', 'budget_2025_copie.xlsx'], ['mail', 'Pouvez-vous renvoyer…'], ['task', 'Mettre à jour le CRM'],
  ['chat', '@toi — tu as vu ?'], ['crm', 'Doublon détecté'], ['calendar', 'Point hebdo — 45 min'], ['mail', '312 non lus'],
];

const SLIDES = [
  { k: 'Analytics', t: 'Comprenez vos chiffres en un regard.' },
  { k: 'Alertes', t: 'L’important arrive au bon moment.' },
  { k: 'Clients', t: 'Chaque compte, chaque signal.' },
  { k: 'Rapports', t: 'Prêts avant que vous ne les demandiez.' },
  { k: 'Assistant', t: 'Posez la question. Obtenez la réponse.' },
  { k: 'Performance', t: 'Vos objectifs, suivis en direct.' },
];

function slideUI(i) {
  switch (i) {
    case 0: return `<div class="fm-ui fm-ui--bars">${[38, 52, 44, 61, 57, 72, 66, 84, 95, 78].map((h, j) => `<i style="--h:${h}%" class="${j === 8 ? 'hot' : ''}"></i>`).join('')}<span class="fm-note">✦ Pic lié à la campagne du 12</span></div>`;
    case 1: return `<div class="fm-ui fm-ui--alerts">${[['warn', 'Trésorerie sous le seuil dans 9 j'], ['', 'Client clé inactif depuis 21 j'], ['ok', 'Objectif mensuel atteint']].map(([c, t]) => `<div class="fm-alert ${c}"><i></i>${t}</div>`).join('')}</div>`;
    case 2: return `<div class="fm-ui fm-ui--clients">${[['AB', 'Atelier Brume', 92, 'Actif'], ['NW', 'Nordwise', 78, 'À relancer'], ['MC', 'Maison Ciel', 64, 'Suivi'], ['LF', 'Lefort & Fils', 41, 'À risque']].map(([a, n, s, p]) => `<div class="fm-client"><span>${a}</span><b>${n}</b><em><i style="--s:${s}%"></i></em><small>${p}</small></div>`).join('')}</div>`;
    case 3: return `<div class="fm-ui fm-ui--doc"><div class="fm-doc"><small>RAPPORT MENSUEL · OCT.</small><b>Synthèse de performance</b><div class="fm-doc-k"><i></i><i></i><i></i></div><svg viewBox="0 0 200 50" preserveAspectRatio="none"><path pathLength="1" d="M0,42 C20,40 30,30 50,32 C70,34 80,20 100,22 C120,24 135,12 150,14 C170,16 180,6 200,4"/></svg><div class="fm-doc-l"><i></i><i></i><i></i></div></div><span class="fm-stamp">PDF prêt ✓</span></div>`;
    case 4: return `<div class="fm-ui fm-ui--chat"><div class="fm-q"><span data-type="Quels clients risquent de partir ?"></span></div><div class="fm-a"><span class="fm-av">✦</span><p>2 clients à risque, 40 100 € exposés. <b>Lefort &amp; Fils</b> : aucun échange depuis 21 jours.</p></div></div>`;
    default: return `<div class="fm-ui fm-ui--gauge"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" class="trk"/><circle cx="60" cy="60" r="50" class="val" pathLength="100"/></svg><b data-num="87">0 %</b><small>de l’objectif mensuel</small></div>`;
  }
}

function markup() {
  const chaos = CHAOS.map(([ic, t]) => `<div class="fm-card">${icon(ic, 14)}<span>${t}</span></div>`).join('');
  const letters = CONFIG.brand.split('').map((c) => `<span>${c}</span>`).join('');
  const toasts = ['Relance envoyée · Nordwise', 'Facture rapprochée · #2291', 'Rapport envoyé · Direction', 'Tâche créée · Devis T4', 'Relance envoyée · Maison Ciel', 'Alerte stock traitée', 'CRM mis à jour · 12 fiches', 'Relance envoyée · Studio Alto']
    .map((t) => `<div class="fm-toast">${icon('bolt', 13)}<span>${t}</span></div>`).join('');
  return `
  <div class="fm" aria-hidden="true">
    <div class="fm-cam" data-cam>
      <div class="fm-layer fm-chaos" data-l="chaos">${chaos}<div class="fm-unread"><small>Non lus</small><b data-unread>0</b></div></div>

      <div class="fm-layer fm-logo" data-l="logo">
        <i class="fm-line"></i><i class="fm-burst"></i>
        <div class="fm-brand"><span class="fm-mark">${logoMark(64)}</span><span class="fm-word">${letters}</span></div>
        <p class="fm-tag">Votre entreprise. <span class="serif">Pilotée par l’IA.</span></p>
      </div>

      <div class="fm-layer fm-dash" data-l="dash">
        <div class="fm-dash-rig"><div class="dash-frame" data-film-dash></div><i class="fm-sweep"></i></div>
      </div>

      <div class="fm-layer fm-feat" data-l="feat">
        ${SLIDES.map((s, i) => `
          <div class="fm-slide" data-slide="${i}" style="--c:${['#ff6b2c', '#ffc857', '#ff4d8d', '#ff8a3d', '#ffb347', '#ff3d2e'][i]}">
            <div class="fm-slide-copy">
              <span class="fm-idx mono">0${i + 1} / 06</span>
              <b class="fm-kw">${s.k}</b>
              <p>${s.t}</p>
            </div>
            ${slideUI(i)}
          </div>`).join('')}
      </div>

      <div class="fm-layer fm-auto" data-l="auto">
        <div class="fm-flow">
          <div class="fm-node"><small>Déclencheur</small><b>Devis sans réponse · 3 j</b></div>
          <i class="fm-link"><em></em></i>
          <div class="fm-node ai"><small>IA</small><b>Rédige la relance</b></div>
          <i class="fm-link"><em></em></i>
          <div class="fm-node"><small>Action</small><b>Envoi + suivi CRM</b></div>
        </div>
        <div class="fm-activate"><span>Activer le workflow</span><i class="fm-switch"></i></div>
        <div class="fm-toasts">${toasts}</div>
        <div class="fm-auto-count"><small>Tâches automatisées</small><b data-autocount>0</b></div>
      </div>

      <div class="fm-layer fm-week" data-l="week">
        <div class="fm-clock"><i class="h"></i><i class="m"></i></div>
        <div class="fm-days">${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map((d) => `<span>${d}</span>`).join('')}</div>
      </div>

      <div class="fm-layer fm-split" data-l="split">
        <div class="fm-before">
          <span class="fm-lbl mono">Avant</span>
          ${['clients_final_v4.xlsx', '312 non lus', 'Relancer Nordwise !!', 'reporting (copie).xlsx', '17:48 — pas fini'].map((t) => `<div class="fm-mess">${t}</div>`).join('')}
        </div>
        <div class="fm-after"><span class="fm-lbl mono">Après</span><div class="dash-frame" data-film-dash></div></div>
        <i class="fm-wipe"></i>
      </div>

      <div class="fm-layer fm-rise" data-l="rise">
        <svg viewBox="0 0 400 200" preserveAspectRatio="none"><defs><linearGradient id="fmRise" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff6b2c" stop-opacity=".35"/><stop offset="1" stop-color="#ff6b2c" stop-opacity="0"/></linearGradient></defs>
          <path class="area" d="M0,180 C60,176 90,160 140,150 C190,140 220,110 270,92 C320,74 350,40 400,14 L400,200 L0,200 Z" fill="url(#fmRise)"/>
          <path class="ln" pathLength="1" d="M0,180 C60,176 90,160 140,150 C190,140 220,110 270,92 C320,74 350,40 400,14"/>
        </svg>
        <i class="fm-tip"></i>
      </div>

      <div class="fm-layer fm-end" data-l="end">
        <span class="fm-mark">${logoMark(56)}</span>
        <b class="fm-end-t">Votre entreprise. <span class="serif">Pilotée par l’IA.</span></b>
        <a class="btn btn--primary fm-cta" href="${CONFIG.signupUrl}" tabindex="-1">Commencer maintenant ${icon('arrow', 16)}</a>
        <small class="fm-price mono" data-film-price></small>
      </div>

      <div class="fm-layer fm-kin" data-l="kin"></div>
    </div>
    <div class="fm-sub" data-sub></div>
    <div class="fm-cursor"><svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5 3l14 8-6 1.6L10 19z" fill="#fff" stroke="#0a0706" stroke-width="1.2" stroke-linejoin="round"/></svg><i class="fm-ripple"></i></div>
    <i class="fm-flash"></i>
    <i class="fm-bar fm-bar--t"></i><i class="fm-bar fm-bar--b"></i>
    <i class="fm-vig"></i>
  </div>`;
}

/** Construit le film dans `root` et renvoie { tl, score }. */
export function buildFilm(root) {
  root.innerHTML = markup();
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  root.querySelectorAll('[data-film-dash]').forEach((f) => mountDashboard(f));
  const plans = CONFIG.pricing.plans;
  $('[data-film-price]').textContent = `À partir de ${plans.starter} ${CONFIG.pricing.currency} HT / mois`;

  const cam = $('[data-cam]');
  const L = (n) => $(`[data-l="${n}"]`);
  const kin = L('kin');
  const sub = $('[data-sub]');
  const flash = $('.fm-flash');
  const hits = [];

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  gsap.set(root.querySelectorAll('.fm-layer'), { autoAlpha: 0 });
  gsap.set(kin, { autoAlpha: 1 });

  // ── Outils ──
  const show = (n, t) => tl.set(L(n), { autoAlpha: 1 }, t);
  const hide = (n, t) => tl.set(L(n), { autoAlpha: 0 }, t);
  const doFlash = (t, a = 1) => {
    tl.fromTo(flash, { opacity: a }, { opacity: 0, duration: 0.35, ease: 'power2.out', immediateRender: false }, t);
  };
  const slam = (html, t, dur = 0.55, { cls = '', sound = 'impact', exit = 'cut' } = {}) => {
    const el = document.createElement('div');
    el.className = `fm-slam ${cls}`;
    el.innerHTML = `<span>${html}</span>`;
    kin.appendChild(el);
    gsap.set(el, { autoAlpha: 0 });
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06, ease: 'none' }, t)
      .fromTo(el.firstElementChild, { scale: 1.5, yPercent: 8 }, { scale: 1, yPercent: 0, duration: 0.28, ease: 'expo.out' }, t)
      .to(el.firstElementChild, { scale: 1.07, duration: dur - 0.28, ease: 'none' }, t + 0.28);
    if (exit === 'fade') tl.to(el, { autoAlpha: 0, duration: 0.2 }, t + dur);
    else tl.set(el, { autoAlpha: 0 }, t + dur);
    if (sound) hits.push({ t, type: sound });
    return el;
  };
  const caption = (text, t, dur) => {
    tl.call(() => { sub.textContent = text; }, null, t)
      .fromTo(sub, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, t)
      .to(sub, { autoAlpha: 0, duration: 0.2 }, t + dur);
  };
  const shake = (t, dur, amp) => {
    const n = Math.round(dur / 0.05);
    for (let i = 0; i < n; i++) {
      const k = amp * (0.4 + (i / n) * 0.6);
      tl.to(cam, { xPercent: (Math.random() - 0.5) * k, yPercent: (Math.random() - 0.5) * k, duration: 0.05, ease: 'none' }, t + i * 0.05);
    }
    tl.to(cam, { xPercent: 0, yPercent: 0, duration: 0.05 }, t + n * 0.05);
  };
  // Cadre la caméra sur un point (fractions du cadre) avec un zoom s
  const focus = (fx, fy, s, t, d = 0.8, ease = 'power3.inOut') => {
    tl.to(cam, { scale: s, xPercent: -(fx - 0.5) * s * 100, yPercent: -(fy - 0.5) * s * 100, duration: d, ease }, t);
  };
  const count = (el, to, t, d, ease = 'power2.out', fmt = (v) => Math.round(v).toLocaleString('fr-FR')) => {
    const o = { v: 0 };
    tl.fromTo(o, { v: 0 }, { v: to, duration: d, ease, onUpdate: () => { el.textContent = fmt(o.v); } }, t);
  };

  tl.set([$('.fm-bar--t'), $('.fm-bar--b')], { scaleY: 1 }, 0);

  // ═════ 0–5 s · Le chaos ═════
  slam('Lundi.', 0.15, 0.55, { sound: 'kick', cls: 'bg-ink' });
  slam('08:57', 0.8, 0.45, { sound: 'kick', cls: 'bg-flame' });
  show('chaos', 1.3);
  const cards = $$('.fm-card');
  cards.forEach((c, i) => {
    const x = 6 + ((i * 37) % 82);
    const y = 8 + ((i * 53) % 78);
    gsap.set(c, { left: `${x}%`, top: `${y}%` });
    tl.fromTo(c, { autoAlpha: 0, yPercent: -260, rotate: (i % 2 ? 1 : -1) * (8 + (i % 5) * 4), scale: 1.25 },
      { autoAlpha: 1, yPercent: 0, rotate: (i % 2 ? -1 : 1) * (2 + (i % 4) * 2), scale: 1, duration: 0.35, ease: 'back.out(2)' }, 1.3 + i * 0.075);
    if (i % 3 === 0) hits.push({ t: 1.3 + i * 0.075, type: 'pop' });
  });
  count($('[data-unread]'), 312, 1.3, 3.2, 'power2.in');
  tl.fromTo(L('chaos'), { '--red': 0 }, { '--red': 1, duration: 3, ease: 'power1.in' }, 1.5);
  shake(2.6, 2.1, 2.2);
  slam('Trop d’outils.', 3.1, 0.5, { cls: 'bg-cream' });
  slam('Trop d’onglets.', 3.65, 0.5, { cls: 'bg-flame' });
  slam('Pas assez de <span class="serif">temps.</span>', 4.2, 0.55, { cls: 'bg-ink' });
  doFlash(4.78);
  hide('chaos', 4.8);

  // ═════ 5–15 s · La révélation ═════
  show('logo', 5.0);
  tl.fromTo('.fm-line', { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.55, ease: 'expo.inOut' }, 5.0)
    .to('.fm-line', { scaleX: 0, autoAlpha: 0, duration: 0.2, ease: 'power3.in' }, 5.55)
    .fromTo('.fm-burst', { scale: 0, autoAlpha: 1 }, { scale: 4, autoAlpha: 0, duration: 1.1, ease: 'expo.out' }, 5.7)
    .fromTo('.fm-logo .fm-mark', { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(1.8)' }, 5.7)
    .fromTo('.fm-word span', { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.05, duration: 0.5, ease: 'expo.out' }, 5.9)
    .fromTo('.fm-tag', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 6.6)
    .to(L('logo'), { scale: 1.6, autoAlpha: 0, duration: 0.45, ease: 'power3.in' }, 7.5);
  hits.push({ t: 5.7, type: 'impact' }, { t: 7.55, type: 'whoosh' });

  show('dash', 7.9);
  const rig = $('.fm-dash-rig');
  tl.fromTo(rig, { rotateX: 58, yPercent: 40, scale: 0.55, autoAlpha: 0 }, { rotateX: 0, yPercent: 0, scale: 1, autoAlpha: 1, duration: 1.3, ease: 'expo.out' }, 7.95)
    .fromTo('.fm-sweep', { xPercent: -120 }, { xPercent: 820, duration: 1.1, ease: 'power2.inOut' }, 8.6);
  hits.push({ t: 7.95, type: 'whoosh' });
  focus(0.566, 0.254, 1.65, 9.5);
  caption('Vos chiffres. En temps réel.', 9.9, 1.2);
  focus(0.462, 0.5, 1.75, 11.15, 0.45, 'power4.inOut');
  hits.push({ t: 11.15, type: 'whoosh' });
  caption('Vos tendances. Anticipées.', 11.5, 1.0);
  focus(0.8, 0.41, 2.3, 12.55, 0.45, 'power4.inOut');
  hits.push({ t: 12.55, type: 'whoosh' });
  caption('Vos priorités. Signalées par l’IA.', 12.9, 0.9);
  focus(0.5, 0.5, 1, 13.85, 0.6, 'expo.inOut');
  slam('Tout. <span class="serif">Au même endroit.</span>', 14.25, 0.6, { cls: 'bg-flame' });
  doFlash(14.86, 0.9);
  hide('dash', 15);

  // ═════ 15–30 s · Montage des fonctions ═════
  show('feat', 15);
  const slides = $$('.fm-slide');
  slides.forEach((s, i) => {
    const t = 15 + i * 2.5;
    tl.fromTo(s, { autoAlpha: 0, xPercent: 70, skewX: -14 }, { autoAlpha: 1, xPercent: 0, skewX: 0, duration: 0.38, ease: 'expo.out' }, t)
      .fromTo(s.querySelector('.fm-kw'), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out' }, t + 0.1)
      .fromTo(s.querySelector('.fm-ui'), { scale: 0.85, autoAlpha: 0, rotateY: -18 }, { scale: 1, autoAlpha: 1, rotateY: 0, duration: 0.6, ease: 'expo.out' }, t + 0.15);
    hits.push({ t, type: 'whoosh', arg: 0.3 });
    const ui = s.querySelector('.fm-ui');
    if (i === 0) {
      tl.fromTo(ui.querySelectorAll('i'), { scaleY: 0 }, { scaleY: 1, stagger: 0.05, duration: 0.5, ease: 'expo.out' }, t + 0.3)
        .fromTo(ui.querySelector('.fm-note'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }, t + 1.1);
      hits.push({ t: t + 1.1, type: 'pop' });
    }
    if (i === 1) {
      ui.querySelectorAll('.fm-alert').forEach((a, j) => {
        tl.fromTo(a, { autoAlpha: 0, yPercent: -120 }, { autoAlpha: 1, yPercent: 0, duration: 0.4, ease: 'back.out(2)' }, t + 0.4 + j * 0.4);
        hits.push({ t: t + 0.4 + j * 0.4, type: 'pop' });
      });
    }
    if (i === 2) {
      tl.fromTo(ui.querySelectorAll('.fm-client'), { autoAlpha: 0, xPercent: 20 }, { autoAlpha: 1, xPercent: 0, stagger: 0.12, duration: 0.4 }, t + 0.35)
        .fromTo(ui.querySelectorAll('.fm-client em i'), { scaleX: 0 }, { scaleX: 1, stagger: 0.12, duration: 0.6 }, t + 0.6);
    }
    if (i === 3) {
      tl.fromTo(ui.querySelectorAll('.fm-doc > *'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.3 }, t + 0.35)
        .fromTo(ui.querySelector('path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8 }, t + 0.7)
        .fromTo(ui.querySelector('.fm-stamp'), { autoAlpha: 0, scale: 2, rotate: -12 }, { autoAlpha: 1, scale: 1, rotate: -6, duration: 0.3, ease: 'back.out(2)' }, t + 1.6);
      hits.push({ t: t + 1.6, type: 'kick' });
    }
    if (i === 4) {
      const q = ui.querySelector('[data-type]');
      const full = q.dataset.type;
      const o = { n: 0 };
      tl.fromTo(o, { n: 0 }, { n: full.length, duration: 0.8, ease: 'none', onUpdate: () => { q.textContent = full.slice(0, Math.round(o.n)); } }, t + 0.35)
        .fromTo(ui.querySelector('.fm-a'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4 }, t + 1.3);
      hits.push({ t: t + 1.3, type: 'pop' });
    }
    if (i === 5) {
      tl.fromTo(ui.querySelector('.val'), { strokeDasharray: '0 100' }, { strokeDasharray: '87 100', duration: 1.2, ease: 'expo.out' }, t + 0.35);
      count(ui.querySelector('[data-num]'), 87, t + 0.35, 1.2, 'expo.out', (v) => `${Math.round(v)} %`);
    }
    if (i < slides.length - 1) {
      tl.to(s, { xPercent: -70, skewX: 14, autoAlpha: 0, duration: 0.26, ease: 'power3.in' }, t + 2.26);
    }
  });
  tl.to(slides.at(-1), { scale: 1.3, autoAlpha: 0, duration: 0.4, ease: 'power3.in' }, 29.4);
  hide('feat', 29.8);

  // ═════ 30–45 s · L'automatisation ═════
  slam('Et le <span class="serif">répétitif ?</span>', 30.0, 1.2, { exit: 'fade', cls: 'bg-cream' });
  slam('L’IA s’en <span class="serif">charge.</span>', 31.35, 1.25, { cls: 'bg-flame', exit: 'fade' });
  show('auto', 32.7);
  const nodes = $$('.fm-node');
  tl.fromTo(nodes, { autoAlpha: 0, y: 30, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, stagger: 0.25, duration: 0.5, ease: 'back.out(1.6)' }, 32.8)
    .fromTo($$('.fm-link'), { scaleX: 0 }, { scaleX: 1, stagger: 0.25, duration: 0.4 }, 33.1)
    .fromTo('.fm-activate', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 33.6);
  nodes.forEach((_, i) => hits.push({ t: 32.8 + i * 0.25, type: 'pop' }));
  // Curseur simulé
  const cursor = $('.fm-cursor');
  tl.fromTo(cursor, { autoAlpha: 0, left: '88%', top: '92%' }, { autoAlpha: 1, left: '62%', top: '71%', duration: 0.9, ease: 'power3.inOut' }, 33.8)
    .to(cursor, { scale: 0.8, duration: 0.08 }, 34.7)
    .to(cursor, { scale: 1, duration: 0.15 }, 34.78)
    .fromTo('.fm-ripple', { scale: 0, autoAlpha: 1 }, { scale: 3, autoAlpha: 0, duration: 0.5 }, 34.72)
    .fromTo('.fm-activate', { '--on': 0 }, { '--on': 1, duration: 0.2 }, 34.75)
    .to(cursor, { autoAlpha: 0, duration: 0.3 }, 35.6)
    .fromTo($$('.fm-link em'), { xPercent: -100 }, { xPercent: 400, duration: 0.6, repeat: 12, ease: 'none', stagger: 0.3 }, 34.8)
    .to(nodes, { boxShadow: '0 0 0 1px rgba(255,107,44,.6), 0 0 40px -6px rgba(255,107,44,.7)', stagger: 0.2, duration: 0.3, yoyo: true, repeat: 5 }, 34.8);
  hits.push({ t: 34.72, type: 'kick' });
  const toasts = $$('.fm-toast');
  toasts.forEach((to, i) => {
    const t = 36 + 3.2 * Math.pow(i / toasts.length, 1.6);
    tl.fromTo(to, { autoAlpha: 0, xPercent: 40, scale: 0.9 }, { autoAlpha: 1, xPercent: 0, scale: 1, duration: 0.3, ease: 'back.out(2)' }, t);
    hits.push({ t, type: 'pop' });
  });
  tl.fromTo('.fm-auto-count', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 35.9);
  count($('[data-autocount]'), 3912, 36, 3.8, 'power3.in');
  tl.to(cam, { scale: 1.12, duration: 4, ease: 'power1.in' }, 36)
    .to(cam, { scale: 1, duration: 0.3 }, 40.1);
  hide('auto', 40.2);
  show('week', 40.2);
  tl.fromTo('.fm-clock', { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(2)' }, 40.2)
    .fromTo('.fm-clock .m', { rotate: 0 }, { rotate: 360 * 10, duration: 2.6, ease: 'power2.inOut' }, 40.3)
    .fromTo('.fm-clock .h', { rotate: 0 }, { rotate: 360 * 1.5, duration: 2.6, ease: 'power2.inOut' }, 40.3);
  $$('.fm-days span').forEach((d, i) => {
    tl.to(d, { color: '#0a0706', backgroundColor: '#fbefe4', duration: 0.1 }, 40.4 + i * 0.5)
      .to(d, { color: '#8f7b6e', backgroundColor: 'rgba(255,255,255,0)', duration: 0.3 }, 40.85 + i * 0.5);
    hits.push({ t: 40.4 + i * 0.5, type: 'tick' });
  });
  caption('Du lundi au vendredi. Sans relâche.', 40.6, 2.2);
  hide('week', 43);
  slam('Pendant que vous faites <span class="serif">autre chose.</span>', 43.05, 1.8, { exit: 'fade', cls: 'bg-ink' });

  // ═════ 45–55 s · Les résultats ═════
  show('split', 45);
  tl.fromTo('.fm-mess', { autoAlpha: 0, scale: 1.2 }, { autoAlpha: 1, scale: 1, stagger: 0.06, duration: 0.25 }, 45)
    .fromTo(L('split'), { '--wipe': '0%' }, { '--wipe': '100%', duration: 1.6, ease: 'power3.inOut' }, 45.7);
  hits.push({ t: 45.7, type: 'whoosh', arg: 1.2 });
  hide('split', 47.55);
  slam('Moins de <span class="serif">saisie.</span>', 47.6, 0.75, { cls: 'bg-cream' });
  slam('Moins <span class="serif">d’oublis.</span>', 48.4, 0.75, { cls: 'bg-flame' });
  slam('Plus de <span class="serif">décisions.</span>', 49.2, 0.95, { cls: 'bg-ink accent' });
  show('rise', 50.2);
  tl.fromTo(L('rise'), { rotate: -4, scale: 1.25 }, { rotate: 0, scale: 1, duration: 2.6, ease: 'power2.out' }, 50.2)
    .fromTo('.fm-rise .ln', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' }, 50.3)
    .fromTo('.fm-rise .area', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 51)
    .fromTo('.fm-tip', { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(3)' }, 52.05);
  hits.push({ t: 52.05, type: 'pop' });
  caption('Votre croissance, pilotée.', 51.2, 1.6);
  hide('rise', 53);
  slam('Vos équipes <span class="serif">respirent.</span>', 53.0, 1.8, { exit: 'fade', cls: 'bg-flame' });
  doFlash(54.9);

  // ═════ 55–60 s · À vous ═════
  show('end', 55);
  tl.fromTo('.fm-end .fm-mark', { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(1.8)' }, 55.05)
    .fromTo('.fm-end-t', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 55.4)
    .fromTo('.fm-cta', { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 56.4)
    .fromTo('.fm-price', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 57)
    .to([$('.fm-bar--t'), $('.fm-bar--b')], { scaleY: 0, duration: 1.2, ease: 'power2.inOut' }, 57.5)
    .to({}, { duration: 0.01 }, FILM_DURATION - 0.01);
  hits.push({ t: 55.05, type: 'impact' }, { t: 56.4, type: 'pop' });

  return { tl, score: buildScore(hits) };
}
