// Démo interactive : onglets fonctionnels + assistant IA conversationnel.
import { icon } from './icons.js';
import { smoothPath, toPoints, fmt, prefersReducedMotion, wait } from './utils.js';

const reduced = () => prefersReducedMotion();

// ───────── Données d'exemple ─────────
const series = {
  '7 j': { labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], values: [8.2, 9.1, 8.7, 10.4, 11.2, 6.1, 4.3], rev: '58 000 €', delta: '+9,2 %', orders: '142', conv: '3,8 %' },
  '30 j': { labels: ['S1', 'S2', 'S3', 'S4', 'S5'], values: [24, 27, 26, 31, 20], rev: '128 450 €', delta: '+12,4 %', orders: '611', conv: '4,1 %' },
  '90 j': { labels: ['Juil.', 'Août', 'Sept.'], values: [96, 82, 118], rev: '296 000 €', delta: '+7,8 %', orders: '1 804', conv: '3,9 %' },
  '12 m': { labels: ['N', 'D', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O'], values: [88, 94, 71, 76, 90, 97, 102, 99, 96, 82, 118, 128], rev: '1,14 M€', delta: '+18,6 %', orders: '7 220', conv: '4,0 %' },
};

const flows = [
  { id: 'f1', name: 'Relance devis J+3', desc: 'Relance personnalisée rédigée par l’IA', runs: 1284, saved: '42 h', on: true, ic: 'mail' },
  { id: 'f2', name: 'Rapport hebdo direction', desc: 'Chaque lundi à 08:00, envoyé par email', runs: 52, saved: '26 h', on: true, ic: 'doc' },
  { id: 'f3', name: 'Alerte trésorerie', desc: 'Prévient si le solde prévu passe sous 20 000 €', runs: 7, saved: '—', on: true, ic: 'alert' },
  { id: 'f4', name: 'Onboarding nouveau client', desc: 'Email de bienvenue, tâches internes, rappel J+7', runs: 318, saved: '31 h', on: false, ic: 'users' },
  { id: 'f5', name: 'Synchronisation CRM ↔ factures', desc: 'Met à jour le statut client à chaque paiement', runs: 2210, saved: '58 h', on: true, ic: 'refresh' },
];

const customers = [
  { n: 'Atelier Brume', seg: 'PME', ca: 24200, last: 'Hier', score: 92, status: 'ok' },
  { n: 'Nordwise', seg: 'ETI', ca: 18400, last: 'Il y a 5 j', score: 78, status: 'warn' },
  { n: 'Maison Ciel', seg: 'PME', ca: 11050, last: 'Il y a 2 j', score: 64, status: 'ok' },
  { n: 'Lefort & Fils', seg: 'TPE', ca: 8900, last: 'Il y a 21 j', score: 41, status: 'bad' },
  { n: 'Studio Alto', seg: 'PME', ca: 7600, last: 'Aujourd’hui', score: 88, status: 'ok' },
  { n: 'Verano Group', seg: 'ETI', ca: 31200, last: 'Il y a 9 j', score: 71, status: 'warn' },
  { n: 'Cobalt Conseil', seg: 'TPE', ca: 4300, last: 'Il y a 3 j', score: 59, status: 'ok' },
];
const statusLabel = { ok: ['Actif', 'pill--ok'], warn: ['À relancer', 'pill--warn'], bad: ['À risque', 'pill--bad'] };

const reports = [
  { n: 'Synthèse mensuelle — octobre', d: 'Performance, ventes, trésorerie · 6 pages' },
  { n: 'Analyse clients à risque', d: 'Score IA, historique, actions proposées · 3 pages' },
  { n: 'Bilan des automatisations', d: 'Exécutions, temps libéré, erreurs · 2 pages' },
  { n: 'Prévisions T4', d: 'Scénarios bas / moyen / haut · 4 pages' },
];

// ───────── Rendus ─────────
function lineChart(values, w = 600, h = 200) {
  const pts = toPoints(values, w, h, 12);
  const line = smoothPath(pts);
  const grid = [0.25, 0.5, 0.75].map((k) => `<line class="g" x1="0" x2="${w}" y1="${h * k}" y2="${h * k}"/>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${grid}
    <path class="a" d="${line} L${w},${h} L0,${h} Z"/><path class="l draw" pathLength="1" d="${line}"/></svg>`;
}

function barChart(set) {
  const max = Math.max(...set.values);
  return set.labels.map((l, i) => `<div><i style="height:${(set.values[i] / max) * 88}%"></i><span>${l}</span></div>`).join('');
}

const views = {
  overview: () => `
    <div class="dp-head"><div><h3>Vue d’ensemble</h3><p>Lundi · semaine 42 · mise à jour il y a 12 s</p></div></div>
    <div class="dp-kpis">
      <div class="dp-card dp-kpi"><small>Chiffre d’affaires (30 j)</small><b>128 450 €</b><em>+12,4 %</em></div>
      <div class="dp-card dp-kpi"><small>Clients actifs</small><b>1 284</b><em>+3,1 %</em></div>
      <div class="dp-card dp-kpi"><small>Tâches automatisées</small><b>3 912</b><em>+28 %</em></div>
      <div class="dp-card dp-kpi"><small>Délai moyen de paiement</small><b>31 j</b><em class="down">+2 j</em></div>
    </div>
    <div class="dp-grid2">
      <div class="dp-card"><h4>Revenus <small>30 derniers jours</small></h4><div class="dp-chart">${lineChart([42, 46, 44, 51, 49, 57, 55, 62, 60, 68, 72, 70, 79, 84, 82, 91])}</div></div>
      <div class="dp-card"><h4>Activité <small>en direct</small></h4>
        <ul class="dp-list">
          <li><span class="dp-dot dp-dot--ok"></span>Facture #2291 payée<time>09:42</time></li>
          <li><span class="dp-dot dp-dot--ai"></span>Anomalie détectée : délais<time>09:18</time></li>
          <li><span class="dp-dot"></span>12 relances envoyées<time>08:57</time></li>
          <li><span class="dp-dot"></span>Rapport hebdo généré<time>08:30</time></li>
          <li><span class="dp-dot dp-dot--ok"></span>Nouveau client : Studio Alto<time>08:12</time></li>
        </ul>
      </div>
    </div>`,

  analytics: () => `
    <div class="dp-head"><div><h3>Analytics</h3><p>Ventes par période</p></div>
      <div class="dp-seg" role="group" aria-label="Période">${Object.keys(series).map((k) => `<button type="button" aria-pressed="${k === '30 j'}" data-period="${k}">${k}</button>`).join('')}</div>
    </div>
    <div class="dp-kpis" data-an-kpis></div>
    <div class="dp-grid2">
      <div class="dp-card"><h4>Chiffre d’affaires <small data-an-label>30 j · k€</small></h4><div class="dp-bars" data-an-bars></div></div>
      <div class="dp-card"><h4>Par canal</h4>
        <ul class="dp-list">
          ${[['Site web', 46], ['Commerciaux', 31], ['Partenaires', 15], ['Autres', 8]].map(([n, v]) => `<li>${n}<span class="score" style="margin-left:auto"><i style="--s:${v}%"></i></span><time>${v} %</time></li>`).join('')}
        </ul>
      </div>
    </div>`,

  automation: () => `
    <div class="dp-head"><div><h3>Automatisations</h3><p><span data-flow-count>${flows.filter((f) => f.on).length}</span> workflows actifs · 157 h libérées ce trimestre</p></div>
      <button type="button" class="btn btn--ghost btn--sm" data-new-flow>${icon('plus', 14)}Nouveau workflow</button></div>
    <div class="dp-flows">
      ${flows.map((f) => `
        <div class="dp-flow ${f.on ? 'is-on' : ''}" data-flow="${f.id}">
          <span class="dp-flow-ic">${icon(f.ic, 16)}</span>
          <div><b>${f.name}</b><small>${f.desc}</small>
            <div class="dp-flow-meta"><span><span data-runs>${fmt(f.runs)}</span> exécutions</span><span>${f.saved} libérées</span></div></div>
          <button type="button" class="switch" role="switch" aria-checked="${f.on}" aria-label="Activer ${f.name}"></button>
        </div>`).join('')}
    </div>`,

  customers: () => `
    <div class="dp-head"><div><h3>Clients</h3><p>${customers.length} comptes · triés par score IA</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div class="dp-seg" role="group" aria-label="Filtrer">
          <button type="button" aria-pressed="true" data-filter="all">Tous</button>
          <button type="button" aria-pressed="false" data-filter="warn">À relancer</button>
          <button type="button" aria-pressed="false" data-filter="bad">À risque</button>
        </div>
        <label class="dp-search">${icon('search', 14)}<span class="sr-only">Rechercher un client</span><input id="demo-customer-search" type="text" placeholder="Rechercher…" data-cust-search /></label>
      </div>
    </div>
    <div class="dp-table-wrap"><table class="dp-table">
      <thead><tr><th>Client</th><th>Segment</th><th>CA 12 mois</th><th>Dernier échange</th><th>Score IA</th><th>Statut</th></tr></thead>
      <tbody data-cust-body></tbody>
    </table></div>`,

  reports: () => `
    <div class="dp-head"><div><h3>Rapports</h3><p>Générés automatiquement ou à la demande</p></div></div>
    <div class="dp-reports">
      ${reports.map((r, i) => `
        <div class="dp-report">
          <span class="dp-report-ic">${icon('doc', 18)}</span>
          <div><b>${r.n}</b><small>${r.d}</small></div>
          <button type="button" class="btn btn--ghost" data-gen="${i}">Générer</button>
        </div>`).join('')}
    </div>`,

  assistant: () => `
    <div class="chat">
      <div class="chat-log" data-chat-log aria-live="polite">
        <div class="msg msg--ai"><span class="msg-av">✦</span><div class="msg-body"><p><b>Que souhaitez-vous analyser ?</b></p><p>Posez votre question en langage naturel : ventes, clients, trésorerie, automatisations…</p></div></div>
      </div>
      <div class="chat-suggest" data-chat-suggest>
        <button type="button">Analyse mes performances cette semaine.</button>
        <button type="button">Quels clients risquent de partir ?</button>
        <button type="button">Prévision de chiffre d’affaires pour novembre</button>
        <button type="button">Où puis-je gagner du temps ?</button>
      </div>
      <form class="chat-form" data-chat-form>
        <label class="sr-only" for="demo-chat-input">Votre question</label>
        <input id="demo-chat-input" type="text" autocomplete="off" placeholder="Posez une question à l’IA…" />
        <button type="submit" aria-label="Envoyer">${icon('send', 16)}</button>
      </form>
    </div>`,
};

// ───────── Réponses IA (démo) ─────────
function answerFor(q) {
  const s = q.toLowerCase();
  if (/^(relancer|créer|ajouter|comparer|voir le détail)/.test(s)) {
    return {
      text: `C’est lancé : <b>${q.replace(/[<>]/g, '')}</b>. Dans le produit, l’action s’exécute tout de suite et apparaît dans le fil d’activité. Ici, c’est une démonstration.`,
      actions: ['Analyse mes performances cette semaine.', 'Quels clients risquent de partir ?'],
    };
  }
  if (/perf|semaine|bilan|résum|resum/.test(s)) {
    return {
      text: 'Voici votre semaine en bref. Le chiffre d’affaires atteint <b>58 000 €</b>, en hausse de <b>9,2 %</b> par rapport à la semaine précédente.',
      bars: [8.2, 9.1, 8.7, 10.4, 11.2, 6.1, 4.3],
      bullets: ['Meilleur jour : vendredi (11 200 €)', 'Taux de conversion : 3,8 % (+0,4 pt)', 'Point d’attention : 12 devis sans réponse depuis plus de 5 jours'],
      actions: ['Relancer les 12 devis', 'Voir le détail par canal'],
    };
  }
  if (/client|risque|partir|churn|perd/.test(s)) {
    return {
      text: 'J’identifie <b>2 clients à risque</b> et <b>2 à relancer</b>, pour un chiffre d’affaires exposé de <b>40 100 €</b>.',
      bullets: ['Lefort & Fils : aucun échange depuis 21 jours, score 41', 'Verano Group : baisse de commandes de 32 % sur 60 jours', 'Nordwise : devis en attente depuis 5 jours'],
      actions: ['Créer les tâches de relance', 'Ouvrir la liste Clients'],
    };
  }
  if (/prévi|previ|novembre|mois prochain|forecast|chiffre/.test(s)) {
    return {
      text: 'Prévision pour novembre : <b>134 000 €</b> (fourchette 126 000 – 141 000 €), soit <b>+4,3 %</b> par rapport à octobre.',
      bars: [96, 82, 118, 128, 134],
      bullets: ['Fiabilité estimée du modèle : 94 %', 'Hypothèse : taux de relance maintenu', 'Risque principal : délais fournisseur'],
      actions: ['Comparer les scénarios', 'Ajouter au rapport mensuel'],
    };
  }
  if (/temps|gagner|automat|tâche|tache/.test(s)) {
    return {
      text: 'Trois tâches répétitives pourraient être automatisées, pour environ <b>18 h libérées par mois</b>.',
      bullets: ['Saisie des factures dans le CRM : 8 h / mois', 'Relances de paiement : 6 h / mois', 'Préparation du point hebdo : 4 h / mois'],
      actions: ['Créer ces 3 workflows', 'Voir les automatisations'],
    };
  }
  return {
    text: 'Bonne question. Dans cette démo, je peux analyser <b>vos performances</b>, <b>vos clients</b>, <b>vos prévisions</b> ou <b>vos gains de temps</b>. Dans le produit, je réponds à partir de toutes vos données connectées.',
    actions: ['Analyse mes performances cette semaine.', 'Quels clients risquent de partir ?'],
  };
}

export function initDemo() {
  const root = document.querySelector('[data-demo]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  root.querySelectorAll('[data-ic]').forEach((s) => { s.innerHTML = icon(s.dataset.ic, 16); });

  const rendered = new Set();
  const flowTimers = [];

  const select = (name, focus = false) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach((p) => {
      const on = p.dataset.panel === name;
      p.hidden = !on;
      if (on) {
        if (!rendered.has(name)) {
          p.innerHTML = views[name]();
          wire(name, p);
          rendered.add(name);
        } else {
          p.style.animation = 'none';
          void p.offsetWidth;
          p.style.animation = '';
        }
      }
    });
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t.dataset.tab));
    t.addEventListener('keydown', (e) => {
      const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (e.key in keys) {
        e.preventDefault();
        const n = tabs[(i + keys[e.key] + tabs.length) % tabs.length];
        select(n.dataset.tab, true);
      } else if (e.key === 'Home') { e.preventDefault(); select(tabs[0].dataset.tab, true); }
      else if (e.key === 'End') { e.preventDefault(); select(tabs.at(-1).dataset.tab, true); }
    });
  });

  // Barre de commande « Que souhaitez-vous analyser ? »
  const cmd = root.querySelector('[data-demo-cmd]');
  cmd.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = cmd.querySelector('input');
    const q = input.value.trim() || 'Analyse mes performances cette semaine.';
    input.value = '';
    select('assistant');
    ask(q);
  });

  let ask = () => {};

  function wire(name, p) {
    if (name === 'analytics') {
      const kpis = p.querySelector('[data-an-kpis]');
      const bars = p.querySelector('[data-an-bars]');
      const label = p.querySelector('[data-an-label]');
      const set = (k) => {
        const s = series[k];
        kpis.innerHTML = `
          <div class="dp-card dp-kpi"><small>Chiffre d’affaires</small><b>${s.rev}</b><em>${s.delta}</em></div>
          <div class="dp-card dp-kpi"><small>Commandes</small><b>${s.orders}</b><em>+6,0 %</em></div>
          <div class="dp-card dp-kpi"><small>Conversion</small><b>${s.conv}</b><em>+0,3 pt</em></div>
          <div class="dp-card dp-kpi"><small>Panier moyen</small><b>412 €</b><em>+2,1 %</em></div>`;
        bars.innerHTML = barChart({ ...s, values: s.values.map(() => 0) });
        label.textContent = `${k} · k€`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const max = Math.max(...s.values);
          bars.querySelectorAll('i').forEach((b, i) => { b.style.height = `${(s.values[i] / max) * 88}%`; });
        }));
        p.querySelectorAll('[data-period]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.period === k)));
      };
      p.querySelectorAll('[data-period]').forEach((b) => b.addEventListener('click', () => set(b.dataset.period)));
      set('30 j');
    }

    if (name === 'automation') {
      const count = p.querySelector('[data-flow-count]');
      p.querySelectorAll('.dp-flow').forEach((row) => {
        const f = flows.find((x) => x.id === row.dataset.flow);
        const sw = row.querySelector('.switch');
        sw.addEventListener('click', () => {
          f.on = !f.on;
          sw.setAttribute('aria-checked', String(f.on));
          row.classList.toggle('is-on', f.on);
          count.textContent = flows.filter((x) => x.on).length;
        });
      });
      // Compteurs vivants
      flowTimers.push(setInterval(() => {
        if (p.hidden) return;
        const active = flows.filter((f) => f.on);
        if (!active.length) return;
        const f = active[Math.floor(Math.random() * active.length)];
        f.runs += 1;
        const el = p.querySelector(`[data-flow="${f.id}"] [data-runs]`);
        if (el) el.textContent = fmt(f.runs);
      }, 1400));
      p.querySelector('[data-new-flow]').addEventListener('click', () => {
        select('assistant');
        ask('Où puis-je gagner du temps ?');
      });
    }

    if (name === 'customers') {
      const body = p.querySelector('[data-cust-body]');
      const search = p.querySelector('[data-cust-search]');
      let filter = 'all';
      const draw = () => {
        const q = search.value.trim().toLowerCase();
        const rows = customers
          .filter((c) => (filter === 'all' || c.status === filter) && c.n.toLowerCase().includes(q))
          .sort((a, b) => b.score - a.score);
        body.innerHTML = rows.length
          ? rows.map((c) => `<tr><td><b>${c.n}</b></td><td>${c.seg}</td><td>${fmt(c.ca)} €</td><td>${c.last}</td><td><span class="score"><i style="--s:${c.score}%"></i>${c.score}</span></td><td><span class="pill ${statusLabel[c.status][1]}">${statusLabel[c.status][0]}</span></td></tr>`).join('')
          : '<tr><td colspan="6" class="dp-empty">Aucun client ne correspond à cette recherche.</td></tr>';
      };
      search.addEventListener('input', draw);
      p.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => {
        filter = b.dataset.filter;
        p.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        draw();
      }));
      draw();
    }

    if (name === 'reports') {
      p.querySelectorAll('[data-gen]').forEach((b) => b.addEventListener('click', async () => {
        if (b.classList.contains('is-done')) return;
        b.classList.add('is-loading');
        b.setAttribute('aria-busy', 'true');
        b.innerHTML = '<span class="fr-spinner" style="display:inline-block"></span>Génération…';
        await wait(reduced() ? 150 : 1600);
        b.classList.remove('is-loading');
        b.removeAttribute('aria-busy');
        b.classList.add('is-done');
        b.innerHTML = `${icon('check', 14)}Prêt`;
      }));
    }

    if (name === 'assistant') {
      const log = p.querySelector('[data-chat-log]');
      const form = p.querySelector('[data-chat-form]');
      const input = form.querySelector('input');
      const send = form.querySelector('button');
      let busy = false;

      const scroll = () => { log.scrollTop = log.scrollHeight; };

      ask = async (q) => {
        if (busy) return;
        busy = true;
        send.disabled = true;
        const user = document.createElement('div');
        user.className = 'msg msg--user';
        user.textContent = q;
        log.appendChild(user);

        const ai = document.createElement('div');
        ai.className = 'msg msg--ai';
        ai.innerHTML = '<span class="msg-av">✦</span><div class="msg-body"><span class="typing" aria-label="L’IA analyse"><i></i><i></i><i></i></span></div>';
        log.appendChild(ai);
        scroll();
        await wait(reduced() ? 100 : 900);

        const a = answerFor(q);
        const body = ai.querySelector('.msg-body');
        body.innerHTML = '<p></p>';
        const para = body.querySelector('p');
        // Rendu progressif mot à mot (en conservant le balisage)
        const tokens = a.text.split(/(<[^>]+>|\s+)/).filter(Boolean);
        let html = '';
        for (const tk of tokens) {
          html += tk;
          if (!tk.startsWith('<') && !reduced()) {
            para.innerHTML = html;
            await wait(18 + Math.random() * 30);
          }
        }
        para.innerHTML = html;

        if (a.bars) {
          const max = Math.max(...a.bars);
          const mini = document.createElement('div');
          mini.className = 'msg-mini';
          mini.innerHTML = a.bars.map((v, i) => `<i class="${v === max ? 'is-max' : ''}" style="height:${(v / max) * 100}%;animation-delay:${i * 60}ms"></i>`).join('');
          body.appendChild(mini);
        }
        if (a.bullets) {
          const ul = document.createElement('ul');
          body.appendChild(ul);
          for (const b of a.bullets) {
            const li = document.createElement('li');
            li.textContent = b;
            ul.appendChild(li);
            scroll();
            await wait(reduced() ? 0 : 220);
          }
        }
        if (a.actions) {
          const acts = document.createElement('div');
          acts.className = 'msg-actions';
          a.actions.forEach((t) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = t;
            btn.addEventListener('click', () => {
              if (/Clients/.test(t)) return select('customers');
              if (/automatisations/i.test(t) && /Voir/.test(t)) return select('automation');
              ask(t.endsWith('?') || t.endsWith('.') ? t : `${t}`);
            });
            acts.appendChild(btn);
          });
          body.appendChild(acts);
        }
        scroll();
        busy = false;
        send.disabled = false;
      };

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = input.value.trim();
        if (!q) return;
        input.value = '';
        ask(q);
      });
      p.querySelectorAll('[data-chat-suggest] button').forEach((b) => b.addEventListener('click', () => ask(b.textContent)));
    }
  }

  select('overview');
  // Prépare l'assistant pour que la barre de commande fonctionne immédiatement
  const assistantPanel = panels.find((p) => p.dataset.panel === 'assistant');
  assistantPanel.innerHTML = views.assistant();
  wire('assistant', assistantPanel);
  rendered.add('assistant');
}
