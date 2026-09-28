// Onboarding en 4 étapes, sans formulaire interminable, avec « aha moment » :
// l'IA analyse le workspace et livre 3 premiers insights avant toute configuration.
import '../styles/tokens.css';
import '../styles/auth.css';

import { CONFIG } from '../config.js';
import { api } from '../shared/api.js';
import { icon } from '../shared/icons.js';
import { href, IS_ARTIFACT, rewriteLinks } from '../shared/paths.js';
import { esc, reduced, sendForm, wait } from '../shared/ui.js';
import { hydrateStickers } from '../shared/stickers.js';

rewriteLinks();
hydrateStickers();
const root = document.querySelector('[data-ob]');
const bar = document.querySelector('[data-bar]');
const pct = document.querySelector('[data-pct]');
const plan = new URLSearchParams(location.search).get('plan');
const state = { step: 0, name: '', email: '', goals: [] };

const GOALS = [
  ['revenue', 'Augmenter mon chiffre d’affaires', 'trend'],
  ['time', 'Gagner du temps', 'activity'],
  ['understand', 'Comprendre mes données', 'bulb'],
  ['automate', 'Automatiser des tâches', 'flow'],
  ['track', 'Suivre mes performances', 'target'],
];

// Insights livrés à la fin, selon les objectifs choisis (données de démonstration)
const FIRST_INSIGHTS = {
  revenue: { t: 'Vos clients récurrents valent 2,1× plus', d: 'Une relance des 214 clients inactifs pourrait rapporter ≈ 3 100 € ce mois-ci.', ic: 'trend', k: 'Opportunité' },
  time: { t: '6 h par semaine récupérables', d: 'Le rapport du lundi et les relances peuvent être automatisés dès aujourd’hui.', ic: 'activity', k: 'Gain de temps' },
  understand: { t: 'Le trafic mobile recule de 18 %', d: 'Depuis mardi, alors que le desktop est stable : la cause est probablement technique.', ic: 'alert', k: 'Attention' },
  automate: { t: '3 automatisations prêtes à activer', d: 'Alerte baisse de revenu, briefing du matin, relance des clients inactifs.', ic: 'flow', k: 'Automatisation' },
  track: { t: 'Objectif du mois atteint à 85,6 %', d: 'Au rythme actuel, il sera atteint dans 9 jours.', ic: 'target', k: 'Objectif' },
};
const FALLBACK = ['understand', 'revenue', 'automate'];

const steps = [welcome, goals, analyze, ready];

function progress() {
  const p = Math.round(((state.step + 1) / steps.length) * 100);
  bar.style.width = `${p}%`;
  pct.textContent = `${p} %`;
}

function show(html) {
  root.innerHTML = `<section class="ob-card card" data-step="${state.step}">${html}</section>`;
  rewriteLinks(root);
  root.querySelector('[autofocus]')?.focus();
  progress();
}
function next() { state.step += 1; steps[state.step](); }
function back() { state.step = Math.max(0, state.step - 1); steps[state.step](); }
const backBtn = () => `<button type="button" class="btn btn--ghost" data-back>${icon('arrow', 15, 'flip')}Retour</button>`;
root.addEventListener('click', (e) => { if (e.target.closest('[data-back]')) back(); });

// 1 · Bienvenue
function welcome() {
  show(`
    <span class="ob-k mono">Étape 1 sur 4</span>
    <h1>Bienvenue sur ${CONFIG.brand}.</h1>
    <p class="ob-sub">Votre centre de commande est prêt en 2 minutes.${plan && ['pro', 'business'].includes(plan) ? ` <span class="pill pill--accent">Offre ${esc(plan[0].toUpperCase() + plan.slice(1))}</span>` : ''}</p>
    <form class="ob-form" data-f novalidate>
      <div class="field"><label for="o-name">Prénom</label><input id="o-name" class="input" name="name" autocomplete="given-name" value="${esc(state.name)}" autofocus /></div>
      <div class="field"><label for="o-email">Email professionnel</label><input id="o-email" class="input" type="email" name="email" autocomplete="email" required value="${esc(state.email)}" /></div>
      <p class="field-err" data-err role="alert" hidden></p>
      <button class="btn btn--primary btn--lg" type="submit">Continuer ${icon('arrow', 16)}</button>
      <p class="ob-note">Sans engagement · en continuant, vous acceptez les <a href="/conditions.html">conditions</a> et la <a href="/confidentialite.html">politique de confidentialité</a>.</p>
    </form>`);
  const f = root.querySelector('[data-f]');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = f.querySelector('[data-err]');
    const email = f.elements.email;
    if (!email.value || !email.checkValidity()) {
      email.setAttribute('aria-invalid', 'true');
      err.innerHTML = `${icon('alert', 13)} ${email.value ? 'Cette adresse email ne semble pas valide.' : 'Indiquez votre email pour créer votre espace.'}`;
      err.hidden = false;
      email.focus();
      return;
    }
    state.name = f.elements.name.value.trim();
    state.email = email.value.trim();
    const b = f.querySelector('[type="submit"]');
    b.classList.add('is-loading');
    sendForm(CONFIG.formEndpoint, 'Nouvelle inscription', { name: state.name, email: state.email, plan: plan || 'non choisie' }, IS_ARTIFACT).catch(() => {});
    await wait(500);
    next();
  });
  f.addEventListener('input', (e) => { e.target.removeAttribute('aria-invalid'); f.querySelector('[data-err]').hidden = true; });
}

// 2 · Objectifs
function goals() {
  show(`
    <span class="ob-k mono">Étape 2 sur 4</span>
    <h1>Que voulez-vous accomplir${state.name ? `, ${esc(state.name)}` : ''} ?</h1>
    <p class="ob-sub">Choisissez-en un ou plusieurs. L’IA priorise ses analyses en fonction.</p>
    <div class="ob-opts" role="group" aria-label="Objectifs">${GOALS.map(([id, l, ic]) => `
      <button type="button" class="ob-opt" aria-pressed="${state.goals.includes(id)}" data-g="${id}"><span class="ob-opt-ic">${icon(ic, 18)}</span><span>${l}</span><span class="ob-check">${icon('check', 14)}</span></button>`).join('')}</div>
    <div class="ob-a">${backBtn()}<button type="button" class="btn btn--primary btn--lg" data-next ${state.goals.length ? '' : 'disabled'}>Continuer ${icon('arrow', 16)}</button></div>`);
  const nextBtn = root.querySelector('[data-next]');
  root.querySelector('.ob-opts').addEventListener('click', (e) => {
    const o = e.target.closest('[data-g]');
    if (!o) return;
    const on = o.getAttribute('aria-pressed') !== 'true';
    o.setAttribute('aria-pressed', String(on));
    state.goals = on ? [...state.goals, o.dataset.g] : state.goals.filter((g) => g !== o.dataset.g);
    nextBtn.disabled = !state.goals.length;
  });
  nextBtn.addEventListener('click', next);
}


// 3 · Analyse par l'IA
async function analyze() {
  const tasks = ['Lecture de 90 jours d’activité', 'Détection des tendances', 'Recherche d’activités inhabituelles', 'Calcul du score de santé', 'Préparation de vos premiers insights'];
  show(`
    <span class="ob-k mono">Étape 3 sur 4</span>
    <div class="ob-scan" aria-hidden="true"><i></i><i></i><i></i><span>${icon('spark', 22)}</span></div>
    <h1>Analyse de votre workspace…</h1>
    <p class="ob-sub">L’IA parcourt vos données. Quelques secondes.</p>
    <ul class="ob-tasks">${tasks.map((t) => `<li><span class="ob-tick"></span>${t}</li>`).join('')}</ul>
    <div class="ob-meter"><span class="mono" data-meter>░░░░░░░░░░</span><span class="mono" data-meter-p>0 %</span></div>`);
  await api.saveOnboarding({ name: state.name, email: state.email, goals: state.goals });
  const lis = [...root.querySelectorAll('.ob-tasks li')];
  const meter = root.querySelector('[data-meter]');
  const mp = root.querySelector('[data-meter-p]');
  const dur = reduced() ? 0 : 700;
  for (let i = 0; i < lis.length; i++) {
    lis[i].classList.add('is-run');
    await wait(dur);
    lis[i].classList.remove('is-run');
    lis[i].classList.add('is-done');
    const p = Math.round(((i + 1) / lis.length) * 100);
    const full = Math.round(p / 10);
    meter.textContent = '█'.repeat(full) + '░'.repeat(10 - full);
    mp.textContent = `${p} %`;
  }
  await wait(reduced() ? 0 : 400);
  next();
}

// 4 · Prêt (aha moment)
function ready() {
  const keys = [...new Set([...state.goals, ...FALLBACK])].slice(0, 3);
  show(`
    <span class="ob-k mono">Étape 4 sur 4</span>
    <h1>Vos premiers insights sont prêts.</h1>
    <p class="ob-sub">Voici ce que l’IA a trouvé dans les données de démonstration.</p>
    <ul class="ob-ins">${keys.map((k, i) => {
      const x = FIRST_INSIGHTS[k];
      return `<li style="--d:${i * 0.12}s"><span class="ob-opt-ic">${icon(x.ic, 18)}</span><div><small>${x.k}</small><b>${x.t}</b><p>${x.d}</p></div></li>`;
    }).join('')}</ul>
    <a class="btn btn--primary btn--lg ob-go" href="${href('/app/')}?welcome=1${state.name ? `&name=${encodeURIComponent(state.name)}` : ''}">Ouvrir mon centre de commande ${icon('arrow', 16)}</a>
    <p class="ob-note">Votre workspace est prêt. Le briefing du matin arrivera demain à 8 h.</p>`);
}

welcome();
