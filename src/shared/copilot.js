// Moteur de réponses du Copilot (démonstration).
// Chaque réponse est structurée comme le serait celle de l'API : analyse, explication,
// données utilisées, recommandations, actions. Branchez `api.askCopilot` sur votre LLM
// en conservant ce format de sortie.
import { HEADLINE, CHANNELS, summarize, METRICS } from './demo-data.js';

const pct = (v, d = 1) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(d).replace('.', ',')} %`;
const eur = (v) => `${Math.round(v).toLocaleString('fr-FR')} €`;

export const SUGGESTIONS = [
  'Pourquoi mon chiffre d’affaires a-t-il baissé cette semaine ?',
  'Sur quoi dois-je me concentrer aujourd’hui ?',
  'Trouve une activité inhabituelle.',
  'Quel indicateur demande mon attention ?',
  'Donne-moi 3 actions pour améliorer mes performances.',
];

const ANSWERS = [
  {
    k: /baiss|chut|drop|pourquoi.*(chiffre|revenu|ca\b)/i,
    r: () => ({
      title: 'Le chiffre d’affaires recule de 4 % cette semaine',
      analysis: 'La baisse vient presque entièrement du trafic organique (−9 %), surtout sur mobile depuis mardi. Les clients récurrents, eux, continuent de progresser.',
      explanation: 'Le taux de conversion est stable (3,8 %) : vous ne vendez pas moins bien, vous recevez moins de visiteurs. La baisse coïncide avec la mise à jour du site de mardi.',
      data: [['Chiffre d’affaires 7 j', '−4,0 %'], ['Trafic organique', '−9 %'], ['Trafic mobile', '−18 %'], ['Conversion', '3,8 % (stable)']],
      recos: ['Vérifier les pages mobiles modifiées mardi (vitesse, indexation).', 'Compenser avec une campagne email vers les clients récurrents.'],
      actions: ['Créer une alerte trafic mobile', 'Lancer la relance email'],
    }),
  },
  {
    k: /concentr|aujourd|focus|priorit/i,
    r: () => ({
      title: '3 priorités pour aujourd’hui',
      analysis: 'Une urgence (trafic mobile), une opportunité (clients récurrents) et un objectif à sécuriser.',
      explanation: 'Classées par impact estimé sur le chiffre d’affaires du mois.',
      data: [['Objectif du mois', '85,6 % atteint'], ['Reste à faire', '7 200 €'], ['Jours restants', '9']],
      recos: ['1 · Corriger la baisse de trafic mobile (impact estimé : −2 900 € / mois).', '2 · Relancer les clients récurrents inactifs (≈ +3 100 €).', '3 · Valider la hausse de 15 % du budget payant (≈ +2 400 €).'],
      actions: ['Ouvrir le plan d’action', 'Créer les tâches'],
    }),
  },
  {
    k: /inhabituel|anomal|unusual|bizarre|étrange/i,
    r: () => ({
      title: '2 activités inhabituelles cette semaine',
      analysis: 'Un pic de commandes hier soir et une chute du trafic mobile depuis mardi.',
      explanation: 'L’IA compare chaque heure à son comportement habituel sur 8 semaines ; ces deux écarts dépassent 3 écarts-types.',
      data: [['Commandes hier 21 h – 23 h', '38 (×4)'], ['Trafic mobile depuis mardi', '−18 %'], ['Autres indicateurs', 'normaux']],
      recos: ['Le pic de commandes vient d’un partage sur les réseaux : identifiez la publication pour la relancer.', 'La chute mobile demande une vérification technique.'],
      actions: ['Examiner le pic', 'Surveiller automatiquement'],
    }),
  },
  {
    k: /indicateur|metric|attention|surveill/i,
    r: () => ({
      title: 'Le trafic mobile demande votre attention',
      analysis: 'C’est le seul indicateur clé en dégradation continue (3 jours) avec un impact direct sur le chiffre d’affaires.',
      explanation: 'Les autres indicateurs sont stables ou en hausse. Si la tendance continue, l’objectif du mois serait manqué d’environ 1 800 €.',
      data: [['Trafic mobile', '−18 %'], ['Part du mobile', '64 % des visites'], ['Impact estimé', '−2 900 € / mois']],
      recos: ['Comparer les temps de chargement mobile avant et après mardi.', 'Activer une alerte si la baisse dépasse 20 %.'],
      actions: ['Créer l’alerte', 'Voir l’indicateur'],
    }),
  },
  {
    k: /action|amélior|improve|conseil|3 /i,
    r: () => ({
      title: '3 actions pour améliorer vos performances',
      analysis: 'Classées par rapport effort / impact, à partir de vos 90 derniers jours.',
      explanation: 'Chaque estimation compare vos résultats actuels à ceux de vos meilleures semaines.',
      data: [['Clients récurrents', pct(HEADLINE.returningDelta, 0)], ['Canal le plus rentable', 'Email (5,2 %)'], ['Abandon paiement mobile', '47 %']],
      recos: ['Relancer les 214 clients inactifs depuis 60 jours · +3 100 € estimés.', 'Simplifier le paiement mobile · +0,4 pt de conversion.', 'Déplacer 15 % du budget vers le canal payant · +2 400 € estimés.'],
      actions: ['Appliquer les 3 actions', 'Créer un objectif'],
    }),
  },
];

/** Réponse contextuelle sur un indicateur (« Explique ceci », « Pourquoi ? »…). */
function aboutMetric(metricId, intent = 'explain') {
  const s = summarize(metricId, 30);
  const m = METRICS[metricId];
  const val = m.format === 'money' ? eur(s.value) : m.format === 'pct' ? `${s.value.toFixed(1).replace('.', ',')} %` : Math.round(s.value).toLocaleString('fr-FR');
  const up = s.delta >= 0;
  const channel = [...CHANNELS].sort((a, b) => (up ? b.delta - a.delta : a.delta - b.delta))[0];
  const titles = {
    explain: `${m.label} : ${val} sur 30 jours`,
    why: `${m.label} : pourquoi ${up ? 'la hausse' : 'la baisse'}`,
    todo: `${m.label} : que faire`,
    trend: `${m.label} : la tendance`,
    report: `Rapport · ${m.label}`,
  };
  return {
    title: titles[intent] || titles.explain,
    analysis: `${m.label} ${up ? 'progresse' : 'recule'} de ${pct(Math.abs(s.delta) * (up ? 1 : -1))} par rapport aux 30 jours précédents.`,
    explanation: `Le canal qui contribue le plus à cette évolution est « ${channel.label} » (${pct(channel.delta, 0)}).`,
    data: [[`${m.label} (30 j)`, val], ['Période précédente', m.format === 'money' ? eur(s.previous) : m.format === 'pct' ? `${s.previous.toFixed(1).replace('.', ',')} %` : Math.round(s.previous).toLocaleString('fr-FR')], ['Canal principal', channel.label]],
    recos: up
      ? [`Renforcez le canal « ${channel.label} » tant que sa rentabilité se maintient.`, 'Fixez un objectif pour sécuriser cette progression.']
      : [`Examinez le canal « ${channel.label} » en priorité.`, 'Activez une alerte pour être prévenu si la baisse continue.'],
    actions: intent === 'report' ? ['Générer le rapport', 'Planifier chaque semaine'] : ['Créer une alerte', 'Créer un objectif'],
  };
}

export function answer(question, { metric = null, intent = null } = {}) {
  if (metric) return aboutMetric(metric, intent || 'explain');
  const hit = ANSWERS.find((a) => a.k.test(question));
  if (hit) return hit.r();
  return {
    title: 'Voici ce que je vois dans vos données',
    analysis: `Sur 30 jours, le chiffre d’affaires atteint ${eur(HEADLINE.revenue)} (${pct(HEADLINE.revenueDelta)}). Le point d’attention principal est le trafic (${pct(HEADLINE.trafficDelta, 0)}).`,
    explanation: 'Je réponds à partir des indicateurs de ce workspace. Précisez un indicateur, une période ou un canal pour une analyse plus fine.',
    data: [['Chiffre d’affaires 30 j', eur(HEADLINE.revenue)], ['Conversion', '3,8 %'], ['Clients récurrents', pct(HEADLINE.returningDelta, 0)]],
    recos: ['Essayez : « Compare mobile et desktop cette semaine ».', 'Ou : « Quel canal est le plus rentable ? »'],
    actions: ['Voir le dashboard'],
  };
}
