// Jeu de données de DÉMONSTRATION (espace fictif « Maison Demo »).
// Toutes les valeurs sont générées : elles illustrent l'interface et ne décrivent aucune entreprise réelle.
// Le backend réel remplacera ces fonctions derrière src/shared/api.js.

// Générateur pseudo-aléatoire déterministe (mêmes courbes à chaque visite)
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const DAYS = 90;
function series(seed, base, trend, noise, weekly = 0.08, shock = null) {
  const r = rng(seed);
  return Array.from({ length: DAYS }, (_, i) => {
    const w = 1 + weekly * Math.sin((i / 7) * Math.PI * 2);
    let v = base * (1 + trend * (i / DAYS)) * w * (1 + (r() - 0.5) * noise);
    if (shock && i >= shock.from) v *= shock.factor;
    return Math.round(v);
  });
}

const today = new Date();
export const DATES = Array.from({ length: DAYS }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - (DAYS - 1 - i));
  return d;
});

// Recale une série pour que la fenêtre des 30 derniers jours vaille `target`
// (somme, ou moyenne si `avg`) avec une variation `delta` vs les 30 jours précédents.
function calibrate(values, target, delta, avg = false, days = 30) {
  const n = values.length;
  const cur = values.slice(n - days);
  const prev = values.slice(n - days * 2, n - days);
  const agg = (a) => a.reduce((x, y) => x + y, 0) / (avg ? a.length : 1);
  const sCur = target / agg(cur);
  const sPrev = target / (1 + delta) / agg(prev);
  return values.map((v, i) => {
    const s = i >= n - days ? sCur : sPrev;
    return avg ? Math.round(v * s * 100) / 100 : Math.round(v * s);
  });
}

export const METRICS = {
  revenue: { id: 'revenue', label: 'Chiffre d’affaires', unit: '€', series: calibrate(series(7, 1320, 0.42, 0.18, 0.08, { from: 84, factor: 0.9 }), 48294, 0.184), format: 'money' },
  visitors: { id: 'visitors', label: 'Visiteurs', unit: '', series: calibrate(series(11, 820, 0.25, 0.14, 0.12, { from: 83, factor: 0.8 }), 21480, -0.12), format: 'int', invert: false },
  conversion: { id: 'conversion', label: 'Taux de conversion', unit: '%', series: calibrate(series(3, 34, 0.14, 0.1).map((v) => v / 10), 3.8, 0.086, true), format: 'pct' },
  orders: { id: 'orders', label: 'Commandes', unit: '', series: calibrate(series(5, 30, 0.38, 0.2), 1136, 0.14), format: 'int' },
  returning: { id: 'returning', label: 'Clients récurrents', unit: '', series: calibrate(series(13, 9, 0.6, 0.22), 612, 0.24), format: 'int' },
  aov: { id: 'aov', label: 'Panier moyen', unit: '€', series: calibrate(series(17, 41, 0.06, 0.08), 42.5, 0.039, true), format: 'money' },
};

export const PERIODS = [
  { id: '7d', label: '7 j', days: 7 },
  { id: '30d', label: '30 j', days: 30 },
  { id: '90d', label: '90 j', days: 90 },
];

/** Somme ou moyenne sur la période + variation vs période précédente. */
export function summarize(metricId, days = 30) {
  const m = METRICS[metricId];
  const cur = m.series.slice(-days);
  const prev = m.series.slice(-days * 2, -days);
  const avg = m.format === 'pct' || metricId === 'aov';
  const agg = (a) => (avg ? a.reduce((x, y) => x + y, 0) / a.length : a.reduce((x, y) => x + y, 0));
  const value = agg(cur);
  const before = prev.length ? agg(prev) : value;
  return { ...m, value, previous: before, delta: before ? (value - before) / before : 0, points: cur, prevPoints: prev };
}

// Chiffres clés du scénario (arrondis pour la narration de l'IA)
export const HEADLINE = {
  revenue: 48294, revenueDelta: 0.184, trafficDelta: -0.12, returningDelta: 0.24, conversion: 3.8, conversionBench: 2.9,
};

export const CHANNELS = [
  { id: 'organic', label: 'Organique', share: 0.38, delta: -0.09 },
  { id: 'paid', label: 'Payant', share: 0.27, delta: 0.14 },
  { id: 'email', label: 'Email', share: 0.21, delta: 0.31 },
  { id: 'direct', label: 'Direct', share: 0.14, delta: 0.02 },
];

export const HEALTH = {
  score: 87, delta: 6,
  parts: [
    { id: 'performance', label: 'Performance', score: 91, note: 'Le chiffre d’affaires dépasse la tendance de 18 %.' },
    { id: 'growth', label: 'Croissance', score: 88, note: 'Les clients récurrents progressent de 24 %.' },
    { id: 'efficiency', label: 'Efficacité', score: 84, note: '12 automatisations ont évité 31 h de travail.' },
    { id: 'engagement', label: 'Engagement', score: 86, note: 'Taux d’ouverture email en hausse de 9 points.' },
    { id: 'risk', label: 'Risque', score: 79, note: 'Le trafic organique recule depuis 7 jours.' },
  ],
};

export const INSIGHTS = [
  { id: 'i1', type: 'attention', title: 'Le trafic recule de 12 %', text: 'Baisse concentrée sur le trafic organique depuis mardi, surtout sur mobile.', impact: 'Élevé', metric: 'visitors', action: 'Analyser' },
  { id: 'i2', type: 'opportunity', title: 'Conversion au-dessus de la moyenne', text: 'Votre taux de 3,8 % dépasse votre moyenne sur 90 jours (2,9 %).', impact: 'Moyen', metric: 'conversion', action: 'Voir l’opportunité' },
  { id: 'i3', type: 'growth', title: 'Clients récurrents +24 %', text: 'Ils génèrent 41 % du chiffre d’affaires du mois, contre 33 % le mois dernier.', impact: 'Élevé', metric: 'returning', action: 'Voir le détail' },
  { id: 'i4', type: 'reco', title: 'Augmentez le budget campagne', text: 'Le canal payant convertit 1,6× mieux que la moyenne : +15 % de budget resterait rentable.', impact: 'Moyen', metric: 'revenue', action: 'Simuler' },
  { id: 'i5', type: 'anomaly', title: 'Activité inhabituelle détectée', text: '38 commandes en 2 h hier soir, 4× le rythme habituel à cette heure.', impact: 'Faible', metric: 'orders', action: 'Examiner' },
];

export const INSIGHT_TYPES = {
  opportunity: { label: 'Opportunité', icon: 'bolt' },
  attention: { label: 'Attention', icon: 'alert' },
  growth: { label: 'Croissance', icon: 'trend' },
  reco: { label: 'Recommandation IA', icon: 'spark' },
  anomaly: { label: 'Anomalie', icon: 'radar' },
};

export const BRIEFING = {
  changes: [
    'Chiffre d’affaires d’hier : 1 842 € (+11 % vs mardi dernier).',
    'Le trafic organique recule pour le 3ᵉ jour consécutif.',
    'Votre objectif mensuel est atteint à 85,6 %.',
  ],
  opportunities: [
    'Les clients récurrents achètent 2,1× plus : une relance ciblée est prête.',
    'Le canal email convertit à 5,2 % : meilleur canal de la semaine.',
  ],
  issue: 'Trafic mobile en baisse de 18 % depuis la mise à jour de mardi.',
};

export const GOALS = [
  { id: 'g1', label: 'Chiffre d’affaires mensuel', target: 50000, current: 42800, unit: '€', due: 'fin du mois',
    steps: ['Relancer les 214 clients inactifs depuis 60 jours (≈ +3 100 €).', 'Augmenter de 15 % le budget du canal payant (≈ +2 400 €).', 'Mettre en avant les 3 produits les plus rentables dans l’email de jeudi.'] },
  { id: 'g2', label: 'Taux de conversion', target: 4.2, current: 3.8, unit: '%', due: 'fin du trimestre',
    steps: ['Simplifier l’étape de paiement mobile (47 % d’abandon).', 'Ajouter des avis produits sur les 10 pages les plus vues.'] },
  { id: 'g3', label: 'Nouveaux clients', target: 400, current: 262, unit: '', due: 'fin du mois',
    steps: ['Relancer le trafic organique (article de blog + réseaux).', 'Lancer l’offre de bienvenue sur la page d’accueil.'] },
];

export const AUTOMATIONS = [
  { id: 'a1', name: 'Alerte baisse de revenu', when: 'Le chiffre d’affaires baisse de 10 %', then: 'Analyser la cause', and: 'Me notifier', on: true, runs: 3 },
  { id: 'a2', name: 'Briefing du matin', when: 'Chaque jour à 8 h', then: 'Résumer les changements', and: 'Envoyer par email', on: true, runs: 42 },
  { id: 'a3', name: 'Relance clients inactifs', when: 'Un client est inactif depuis 60 j', then: 'Préparer une relance', and: 'Ajouter à la file d’envoi', on: false, runs: 0 },
];

export const AUTOMATION_TEMPLATES = [
  { name: 'Anomalie de trafic', when: 'Le trafic varie de plus de 20 %', then: 'Identifier la source', and: 'Me notifier sur mobile' },
  { name: 'Rapport hebdo direction', when: 'Chaque lundi à 8 h', then: 'Générer le rapport direction', and: 'Envoyer à l’équipe' },
  { name: 'Objectif en danger', when: 'Un objectif est en retard de 10 %', then: 'Proposer un plan d’action', and: 'Me notifier' },
  { name: 'Gros panier', when: 'Une commande dépasse 500 €', then: 'Marquer le client VIP', and: 'Prévenir l’équipe ventes' },
];

export const TRIGGERS = ['Le chiffre d’affaires baisse de 10 %', 'Le trafic varie de plus de 20 %', 'Un objectif est en retard', 'Chaque jour à 8 h', 'Une commande dépasse 500 €'];
export const ACTIONS = ['Analyser la cause', 'Résumer les changements', 'Proposer un plan d’action', 'Générer un rapport', 'Identifier la source'];
export const NOTIFY = ['Me notifier', 'Envoyer par email', 'Me notifier sur mobile', 'Envoyer à l’équipe'];

export const REPORTS = [
  { id: 'daily', name: 'Rapport quotidien', desc: 'Les chiffres d’hier et ce qui a changé.', schedule: 'Chaque jour · 8 h' },
  { id: 'weekly', name: 'Rapport hebdomadaire', desc: 'Tendances, canaux et objectifs de la semaine.', schedule: 'Chaque lundi · 8 h' },
  { id: 'monthly', name: 'Rapport mensuel', desc: 'Performance complète et comparaison au mois précédent.', schedule: null },
  { id: 'exec', name: 'Rapport direction', desc: 'Une page : santé, risques, décisions à prendre.', schedule: null },
];

export const NOTIFICATIONS = [
  { id: 'n1', kind: 'anomaly', title: 'L’IA a détecté quelque chose d’inhabituel', text: 'Le trafic se comporte différemment de d’habitude sur mobile.', time: 'il y a 12 min', unread: true, metric: 'visitors' },
  { id: 'n2', kind: 'goal', title: 'Objectif à 85,6 %', text: 'Il manque 7 200 € pour atteindre l’objectif du mois.', time: 'il y a 2 h', unread: true, metric: 'revenue' },
  { id: 'n3', kind: 'automation', title: 'Briefing du matin envoyé', text: '3 changements, 2 opportunités, 1 point d’attention.', time: '8:00', unread: false },
];

export const ACTIVITY = [
  { who: 'IA', text: 'a détecté une baisse du trafic organique', time: 'il y a 12 min', tone: 'ai' },
  { who: 'Automatisation', text: '« Briefing du matin » exécutée', time: '8:00', tone: 'auto' },
  { who: 'Vous', text: 'avez créé l’objectif « Nouveaux clients »', time: 'hier', tone: 'me' },
  { who: 'IA', text: 'a recommandé d’augmenter le budget payant', time: 'hier', tone: 'ai' },
  { who: 'Automatisation', text: '« Alerte baisse de revenu » vérifiée', time: 'hier', tone: 'auto' },
];

export const SOURCES = [
  { id: 'demo', name: 'Données de démonstration', status: 'connected' },
];

export const WORKSPACES = [{ id: 'demo', name: 'Maison Demo', plan: 'Démo' }];

export const USER = { name: 'Vous', initials: 'VO', email: 'vous@exemple.fr' };
