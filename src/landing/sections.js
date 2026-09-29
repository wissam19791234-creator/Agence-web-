// Sections interactives de la landing : insights, fonctionnalités (bento), cas d'usage.
import { INSIGHTS, INSIGHT_TYPES, HEALTH, BRIEFING, GOALS, REPORTS, AUTOMATION_TEMPLATES, TRIGGERS, ACTIONS, NOTIFY } from '../shared/demo-data.js';
import { ring } from '../shared/charts.js';
import { icon } from '../shared/icons.js';
import { href } from '../shared/paths.js';
import { esc, fmt, reduced, toast, wait, skeleton } from '../shared/ui.js';

const DETAILS = {
  i1: 'Source principale : trafic organique mobile, −18 % depuis la mise à jour de mardi.',
  i2: 'Les pages produit refaites en juin convertissent 1,4× mieux que les autres.',
  i3: 'Les clients revenus 2 fois ou plus dépensent 2,1× plus que les nouveaux.',
  i4: 'Simulation : +15 % de budget → +2 400 € de chiffre d’affaires estimé sur 30 jours.',
};

export function renderInsights(root) {
  if (!root) return;
  const list = ['i2', 'i1', 'i3', 'i4'].map((id) => INSIGHTS.find((i) => i.id === id));
  root.innerHTML = list.map((i) => {
    const t = INSIGHT_TYPES[i.type];
    return `<article class="card ins ins--${i.type}" data-reveal>
      <header><span class="ins-type">${icon(t.icon, 14)}${t.label}</span><span class="ins-impact">Impact <b>${i.impact}</b></span></header>
      <h3>${esc(i.title)}</h3>
      <p>${esc(i.text)}</p>
      <div class="ins-more" hidden><p>${icon('spark', 13)} ${esc(DETAILS[i.id])}</p></div>
      <footer><button type="button" class="btn btn--secondary btn--sm" data-inv>${esc(i.type === 'attention' ? 'Examiner' : i.action)}</button></footer>
    </article>`;
  }).join('');
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-inv]');
    if (!b) return;
    const card = b.closest('.ins');
    const more = card.querySelector('.ins-more');
    if (!more.hidden) { more.hidden = true; b.textContent = b.dataset.label; return; }
    b.dataset.label = b.textContent;
    b.classList.add('is-loading');
    await wait(700);
    b.classList.remove('is-loading');
    more.hidden = false;
    b.textContent = 'Masquer';
  });
}

// ───────── Bento des fonctionnalités ─────────
const SEARCH_ITEMS = [
  ['Chiffre d’affaires', 'Indicateur', 'chart'], ['Trafic mobile', 'Indicateur', 'chart'], ['Clients récurrents', 'Indicateur', 'users'],
  ['Rapport hebdomadaire', 'Rapport', 'doc'], ['Alerte baisse de revenu', 'Automatisation', 'flow'], ['Objectif : 50 000 €', 'Objectif', 'target'],
  ['Pourquoi le trafic baisse ?', 'Demander à l’IA', 'spark'], ['Créer une automatisation', 'Action', 'plus'],
];

export function renderBento(root) {
  if (!root) return;
  root.innerHTML = `
    <article class="card bt bt--search" id="command-center" data-reveal>
      <div class="bt-copy"><span class="bt-k">${icon('search', 14)}Command Center</span><h3>Tout trouver. Au clavier.</h3><p>Indicateurs, rapports, actions : une seule recherche.</p></div>
      <div class="palette">
        <label class="palette-in">${icon('search', 16)}<input type="text" placeholder="Rechercher… ex. « trafic »" data-pal aria-label="Rechercher dans le centre de commande" /><kbd>⌘K</kbd></label>
        <ul class="palette-list" data-pal-list></ul>
      </div>
    </article>

    <article class="card bt bt--auto" id="automations" data-reveal>
      <div class="bt-copy"><span class="bt-k">${icon('flow', 14)}Automatisations</span><h3>Le répétitif s’automatise.</h3></div>
      <form class="flowb" data-flow>
        <label class="flowb-row"><span>Quand</span><select class="select" name="when">${TRIGGERS.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
        <label class="flowb-row"><span>Alors</span><select class="select" name="then">${ACTIONS.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
        <label class="flowb-row"><span>Et</span><select class="select" name="and">${NOTIFY.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
        <div class="flowb-tpl">${AUTOMATION_TEMPLATES.slice(0, 3).map((t, i) => `<button type="button" class="pill" data-tpl="${i}">${esc(t.name)}</button>`).join('')}</div>
        <button class="btn btn--primary" type="submit">${icon('plus', 15)}Créer l’automatisation</button>
        <p class="flowb-ok" hidden>${icon('check', 14)} Active. Elle surveille dès maintenant.</p>
      </form>
    </article>

    <article class="card bt bt--brief" id="briefing" data-reveal>
      <div class="bt-copy"><span class="bt-k">${icon('sun', 14)}Briefing quotidien</span><h3>Bonjour.</h3><p>Voici ce qui a changé pendant votre absence.</p></div>
      <div class="brief-n"><span><b>3</b>changements</span><span><b>2</b>opportunités</span><span class="is-warn"><b>1</b>point d’attention</span></div>
      <div class="brief-list" hidden>
        <ul>${BRIEFING.changes.map((c) => `<li>${icon('activity', 13)}${esc(c)}</li>`).join('')}${BRIEFING.opportunities.map((c) => `<li class="is-opp">${icon('bolt', 13)}${esc(c)}</li>`).join('')}<li class="is-warn">${icon('alert', 13)}${esc(BRIEFING.issue)}</li></ul>
      </div>
      <button type="button" class="btn btn--secondary btn--sm" data-brief>Voir le briefing</button>
    </article>

    <article class="card bt bt--score" id="score" data-reveal>
      <div class="bt-copy"><span class="bt-k">${icon('activity', 14)}Score de santé</span><h3>Votre activité, en un chiffre.</h3></div>
      <div class="score">
        <div class="score-ring">${ring(HEALTH.score, { size: 116, stroke: 8 })}<b class="num">${HEALTH.score}<small>/100</small></b></div>
        <p class="score-d">${icon('arrowUp', 12)} +${HEALTH.delta} points cette semaine</p>
      </div>
      <ul class="score-parts">${HEALTH.parts.map((p, i) => `<li><button type="button" data-part="${i}" aria-expanded="false"><span>${p.label}</span><span class="score-bar"><i style="--p:${p.score}%"></i></span><b class="num">${p.score}</b></button></li>`).join('')}</ul>
      <p class="score-note" data-part-note>Survolez une catégorie pour voir l’explication.</p>
    </article>

    <article class="card bt bt--goal" id="objectifs" data-reveal>
      <div class="bt-copy"><span class="bt-k">${icon('target', 14)}Objectifs</span><h3>${esc(GOALS[0].label)}</h3></div>
      <div class="goal-nums"><b class="num">42 800 €</b><span>sur 50 000 €</span><em class="num">85,6 %</em></div>
      <div class="bar"><i style="--p:85.6%"></i></div>
      <div class="goal-ai"><span class="pill pill--ai">${icon('spark', 12)}Objectif suggéré par l’IA</span><b class="num">55 000 € le mois prochain</b></div>
      <button type="button" class="btn btn--secondary btn--sm" data-how>Comment l’atteindre</button>
      <ol class="goal-steps" hidden>${GOALS[0].steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    </article>

    <article class="card bt bt--report" id="rapports" data-reveal>
      <div class="bt-copy"><span class="bt-k">${icon('doc', 14)}Rapports</span><h3>Prêts avant que vous ne les demandiez.</h3></div>
      <div class="rep-types" role="radiogroup" aria-label="Type de rapport">${REPORTS.map((r, i) => `<button type="button" role="radio" aria-checked="${i === 1}" data-rep="${r.id}">${esc(r.name.replace('Rapport ', ''))}</button>`).join('')}</div>
      <div class="rep-out" data-rep-out><p class="dm-muted">Choisissez un rapport puis générez-le.</p></div>
      <button type="button" class="btn btn--primary btn--sm" data-gen>${icon('spark', 14)}Générer le rapport</button>
    </article>

    <article class="card bt bt--notif" id="notifications" data-reveal>
      <div class="bt-copy"><span class="bt-k">${icon('bell', 14)}Notifications intelligentes</span><h3>Pas plus d’alertes. De meilleures alertes.</h3></div>
      <div class="nt" data-nt>
        <span class="nt-ic">${icon('radar', 16)}</span>
        <div><b>L’IA a détecté quelque chose d’inhabituel</b><p>Le trafic se comporte différemment de d’habitude.</p>
          <div class="nt-a"><button type="button" class="btn btn--primary btn--sm" data-nt-a="inv">Examiner</button><button type="button" class="btn btn--ghost btn--sm" data-nt-a="ign">Ignorer</button><button type="button" class="btn btn--ghost btn--sm" data-nt-a="why">Pourquoi ?</button></div>
          <p class="nt-out" hidden></p>
        </div>
      </div>
    </article>`;

  // Recherche
  const pal = root.querySelector('[data-pal]');
  const list = root.querySelector('[data-pal-list]');
  let sel = 0;
  const draw = () => {
    const q = pal.value.trim().toLowerCase();
    const items = SEARCH_ITEMS.filter(([l, k]) => !q || l.toLowerCase().includes(q) || k.toLowerCase().includes(q)).slice(0, 5);
    sel = Math.min(sel, Math.max(0, items.length - 1));
    list.innerHTML = items.length
      ? items.map(([l, k, ic], i) => `<li class="${i === sel ? 'is-sel' : ''}">${icon(ic, 15)}<span>${esc(l)}</span><small>${esc(k)}</small>${i === sel ? '<kbd>↵</kbd>' : ''}</li>`).join('')
      : `<li class="palette-empty">${icon('spark', 15)}<span>Demander à l’IA : « ${esc(pal.value)} »</span><kbd>↵</kbd></li>`;
  };
  pal.addEventListener('input', () => { sel = 0; draw(); });
  pal.addEventListener('keydown', (e) => {
    const n = list.children.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % n; draw(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + n) % n; draw(); }
    if (e.key === 'Enter') { e.preventDefault(); toast(`Ouverture : ${list.children[sel]?.querySelector('span')?.textContent || ''}`, { tone: 'success' }); }
  });
  list.addEventListener('pointermove', (e) => { const li = e.target.closest('li'); if (!li) return; const i = [...list.children].indexOf(li); if (i !== sel) { sel = i; draw(); } });
  draw();

  // Automatisation
  const flow = root.querySelector('[data-flow]');
  flow.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tpl]');
    if (!t) return;
    const tpl = AUTOMATION_TEMPLATES[+t.dataset.tpl];
    ['when', 'then', 'and'].forEach((k) => {
      const s = flow.elements[k];
      if (![...s.options].some((o) => o.value === tpl[k])) s.add(new Option(tpl[k]));
      s.value = tpl[k];
      s.classList.add('is-flash');
      setTimeout(() => s.classList.remove('is-flash'), 500);
    });
  });
  flow.addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = flow.querySelector('[type="submit"]');
    const ok = flow.querySelector('.flowb-ok');
    b.classList.add('is-loading');
    await wait(800);
    b.classList.remove('is-loading');
    ok.hidden = false;
    toast('Automatisation créée.', { tone: 'success', action: { label: 'Annuler', run: () => { ok.hidden = true; toast('Automatisation supprimée.'); } } });
  });

  // Briefing
  root.querySelector('[data-brief]').addEventListener('click', (e) => {
    const l = root.querySelector('.brief-list');
    l.hidden = !l.hidden;
    e.currentTarget.textContent = l.hidden ? 'Voir le briefing' : 'Réduire';
  });

  // Score
  const note = root.querySelector('[data-part-note]');
  root.querySelectorAll('[data-part]').forEach((b) => {
    const show = () => {
      const p = HEALTH.parts[+b.dataset.part];
      note.innerHTML = `<b>${p.label} · ${p.score}</b> ${esc(p.note)}`;
      root.querySelectorAll('[data-part]').forEach((x) => x.setAttribute('aria-expanded', String(x === b)));
    };
    b.addEventListener('pointerenter', show);
    b.addEventListener('focus', show);
    b.addEventListener('click', show);
  });

  // Objectif
  root.querySelector('[data-how]').addEventListener('click', (e) => {
    const s = root.querySelector('.goal-steps');
    s.hidden = !s.hidden;
    e.currentTarget.textContent = s.hidden ? 'Comment l’atteindre' : 'Masquer le plan';
  });

  // Rapports
  let rep = 'weekly';
  const out = root.querySelector('[data-rep-out]');
  root.querySelectorAll('[data-rep]').forEach((b) => b.addEventListener('click', () => {
    rep = b.dataset.rep;
    root.querySelectorAll('[data-rep]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  }));
  root.querySelector('[data-gen]').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    const r = REPORTS.find((x) => x.id === rep);
    b.disabled = true;
    out.innerHTML = `<div class="rep-doc">${skeleton(4)}<small class="dm-muted">${icon('spark', 12)} L’IA rédige « ${esc(r.name)} »…</small></div>`;
    await wait(1600);
    out.innerHTML = `<div class="rep-doc is-ready"><div class="rep-doc-h"><b>${esc(r.name)}</b><span class="pill pill--good">${icon('check', 12)}Prêt</span></div><p>${esc(r.desc)}</p>
      <div class="rep-act"><button type="button" class="btn btn--secondary btn--sm" data-r="pdf">${icon('download', 14)}Exporter PDF</button><button type="button" class="btn btn--ghost btn--sm" data-r="share">${icon('share', 14)}Partager</button><button type="button" class="btn btn--ghost btn--sm" data-r="plan">${icon('calendar', 14)}Planifier</button></div></div>`;
    b.disabled = false;
  });
  out.addEventListener('click', (e) => {
    const a = e.target.closest('[data-r]');
    if (!a) return;
    if (a.dataset.r === 'share') {
      // Message selon le résultat réel de la copie (le presse-papiers peut être refusé)
      const ok = () => toast('Lien de partage copié.', { tone: 'success' });
      const ko = () => toast('Copie refusée par le navigateur : le partage se fait depuis l’application.');
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(location.href).then(ok, ko); else ko();
      return;
    }
    const msg = { pdf: 'Démo : dans l’application, le PDF est prêt à télécharger.', plan: 'Rapport planifié chaque lundi à 8 h.' }[a.dataset.r];
    toast(msg, { tone: 'success' });
  });

  // Notification
  const nt = root.querySelector('[data-nt]');
  nt.addEventListener('click', (e) => {
    const a = e.target.closest('[data-nt-a]');
    if (!a) return;
    const o = nt.querySelector('.nt-out');
    o.hidden = false;
    if (a.dataset.ntA === 'ign') {
      nt.classList.add('is-muted');
      o.innerHTML = `Ignorée. <button type="button" class="link-btn" data-undo>Annuler</button>`;
      o.querySelector('[data-undo]').addEventListener('click', () => { nt.classList.remove('is-muted'); o.hidden = true; });
    } else if (a.dataset.ntA === 'why') {
      o.innerHTML = `${icon('spark', 12)} Mobile −18 % depuis mardi, alors que le desktop est stable : l’écart dépasse 3 fois la variation habituelle.`;
    } else {
      o.innerHTML = `${icon('spark', 12)} Analyse ouverte dans le Copilot. <a class="link" href="${href('/app/ai/')}">Voir →</a>`;
    }
  });
}

// ───────── Cas d'usage (scénarios illustratifs) ─────────
const CASES = [
  { k: 'E-commerce', title: 'Des ventes qui baissent sans explication', problem: 'Le chiffre d’affaires recule, personne ne sait pourquoi.', solution: 'L’IA isole la cause : le trafic mobile après une mise à jour.', label: 'Temps pour trouver la cause', b: '3 jours', a: '4 min', bw: 100, aw: 6 },
  { k: 'Agence B2B', title: 'Un reporting qui mange le lundi', problem: 'Six heures de tableurs chaque semaine pour le comité.', solution: 'Rapport direction généré et envoyé chaque lundi à 8 h.', label: 'Reporting par semaine', b: '6 h', a: '10 min', bw: 100, aw: 8 },
  { k: 'Abonnements', title: 'Des clients qui partent en silence', problem: 'Les résiliations sont découvertes après coup.', solution: 'Score de risque et relance automatique avant le départ.', label: 'Clients à risque repérés à temps', b: '0 %', a: '7 sur 10', bw: 4, aw: 70 },
];

/**
 * Simulateur : l'utilisateur règle SES chiffres (visiteurs, conversion, panier) et voit
 * l'effet de leviers simples. Estimation indicative, hypothèses affichées.
 */
export function renderSimulator(root) {
  if (!root) return;
  const LEVERS = [
    { id: 'conv', label: '+0,4 pt de conversion', on: true },
    { id: 'reactiv', label: '+5 % de clients relancés', on: true },
    { id: 'basket', label: '+3 % de panier moyen', on: false },
  ];
  const SLIDERS = [
    { id: 'visits', label: 'Visiteurs par mois', min: 1000, max: 100000, step: 1000, value: 20000, show: (v) => fmt.int(v) },
    { id: 'conv', label: 'Taux de conversion', min: 0.5, max: 6, step: 0.1, value: 2, show: (v) => `${v.toFixed(1).replace('.', ',')} %` },
    { id: 'basket', label: 'Panier moyen', min: 10, max: 300, step: 5, value: 60, show: (v) => `${fmt.int(v)} €` },
  ];
  root.innerHTML = `
    <div class="sim-in">
      <p class="sim-k">Vos chiffres</p>
      ${SLIDERS.map((x) => `<label class="sim-row" for="sim-${x.id}"><span>${x.label}</span><b class="sim-v" data-v="${x.id}">${x.show(x.value)}</b>
        <input type="range" id="sim-${x.id}" data-s="${x.id}" min="${x.min}" max="${x.max}" step="${x.step}" value="${x.value}" /></label>`).join('')}
      <p class="sim-k">Leviers activés</p>
      <div class="sim-levers">${LEVERS.map((l) => `<button type="button" class="sim-lever" data-l="${l.id}" aria-pressed="${l.on}">${l.label}</button>`).join('')}</div>
    </div>
    <div class="sim-out">
      <div class="sim-now"><span>Aujourd’hui</span><b class="num" data-o="now">0 €</b><small>par mois</small></div>
      <div class="sim-gain"><span>Avec les leviers</span><b class="num" data-o="gain">+0 €</b><small>par mois · <b class="num" data-o="year">+0 €</b> par an</small></div>
      <div class="sim-bars" aria-hidden="true"><i data-b="now"></i><i data-b="after"></i></div>
      <p class="sim-note">Estimation indicative calculée à partir de vos valeurs et des leviers cochés.</p>
    </div>`;
  const st = Object.fromEntries(SLIDERS.map((x) => [x.id, x.value]));
  const lv = Object.fromEntries(LEVERS.map((l) => [l.id, l.on]));
  const $ = (q) => root.querySelector(q);
  const shown = { now: 0, gain: 0, year: 0 };
  const tween = (key, to, prefix = '') => {
    const el = $(`[data-o="${key}"]`); const from = shown[key]; shown[key] = to;
    if (reduced()) { el.textContent = `${prefix}${fmt.int(to)} €`; return; }
    const t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / 380); el.textContent = `${prefix}${fmt.int(from + (to - from) * (1 - Math.pow(1 - k, 3)))} €`; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const calc = () => {
    const now = st.visits * (st.conv / 100) * st.basket;
    const after = st.visits * ((st.conv + (lv.conv ? 0.4 : 0)) / 100) * st.basket * (lv.reactiv ? 1.05 : 1) * (lv.basket ? 1.03 : 1);
    const gain = after - now;
    tween('now', now); tween('gain', gain, '+'); tween('year', gain * 12, '+');
    const max = Math.max(after, 1);
    $('[data-b="now"]').style.setProperty('--w', `${(now / max) * 100}%`);
    $('[data-b="after"]').style.setProperty('--w', '100%');
  };
  root.addEventListener('input', (e) => {
    const x = SLIDERS.find((y) => y.id === e.target.dataset.s); if (!x) return;
    st[x.id] = +e.target.value; $(`[data-v="${x.id}"]`).textContent = x.show(st[x.id]);
    e.target.style.setProperty('--p', `${((st[x.id] - x.min) / (x.max - x.min)) * 100}%`);
    calc();
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-l]'); if (!b) return;
    lv[b.dataset.l] = !lv[b.dataset.l]; b.setAttribute('aria-pressed', String(lv[b.dataset.l])); calc();
  });
  root.querySelectorAll('input[type=range]').forEach((r) => { const x = SLIDERS.find((y) => y.id === r.dataset.s); r.style.setProperty('--p', `${((x.value - x.min) / (x.max - x.min)) * 100}%`); });
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); calc(); } }, { threshold: 0.3 });
  io.observe(root);
}

export function renderCases(root) {
  if (!root) return;
  root.innerHTML = CASES.map((c) => `
    <article class="card case" data-reveal>
      <span class="pill">${esc(c.k)}</span>
      <h3>${esc(c.title)}</h3>
      <dl>
        <div><dt>Problème</dt><dd>${esc(c.problem)}</dd></div>
        <div><dt>Solution</dt><dd>${esc(c.solution)}</dd></div>
      </dl>
      <div class="case-ba" role="img" aria-label="${esc(c.label)} : avant ${esc(c.b)}, après ${esc(c.a)}">
        <p class="case-l">${esc(c.label)}</p>
        <div class="case-row"><small>Avant</small><span class="case-bar"><i style="--w:${c.bw}%"></i></span><b>${esc(c.b)}</b></div>
        <div class="case-row is-after"><small>Après</small><span class="case-bar"><i style="--w:${c.aw}%"></i></span><b>${esc(c.a)}</b></div>
      </div>
    </article>`).join('');
}
