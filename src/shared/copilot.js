// Moteur de réponses du Copilot (démonstration).
// Chaque réponse est courte et visuelle : un titre, une phrase, un visuel (grand chiffre,
// courbe ou barres), 3 chiffres au plus, 2 recommandations, des actions et des questions
// de suivi. Branchez `api.askCopilot` sur votre LLM en conservant ce format de sortie.
import { HEADLINE, CHANNELS, HEALTH, GOALS, INSIGHTS, summarize, METRICS } from './demo-data.js';

const pct = (v, d = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(d).replace('.', ',')} %`;
const eur = (v) => `${Math.round(v).toLocaleString('fr-FR')} €`;
const int = (v) => Math.round(v).toLocaleString('fr-FR');
const fmtMetric = (m, v) => (m.format === 'money' ? (m.id === 'aov' ? `${v.toFixed(1).replace('.', ',')} €` : eur(v)) : m.format === 'pct' ? `${v.toFixed(1).replace('.', ',')} %` : int(v));
// Texte normalisé : minuscules, sans accents ni apostrophes typographiques
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');

export const SUGGESTIONS = [
  'Sur quoi dois-je me concentrer aujourd’hui ?',
  'Pourquoi mon chiffre d’affaires a-t-il baissé cette semaine ?',
  'Quel est mon meilleur canal ?',
  'Prévision pour le mois prochain',
  'Combien de clients inactifs ?',
];

const spark = (id, days = 30) => ({ type: 'spark', points: summarize(id, days).points, bad: summarize(id, days).delta < 0 });
const big = (value, label, delta) => ({ type: 'big', value, label, delta });

// Chaque intention : un motif (texte normalisé) et une réponse
const INTENTS = [
  {
    id: 'hello', k: /^(bonjour|salut|hello|coucou|hey|bonsoir|yo)\b/,
    r: () => ({
      title: 'Bonjour ! Prêt à regarder vos chiffres ?',
      analysis: `Ce mois-ci : ${eur(HEADLINE.revenue)} de chiffre d’affaires (${pct(HEADLINE.revenueDelta)}) et un point d’attention sur le trafic mobile.`,
      viz: big(eur(HEADLINE.revenue), 'Chiffre d’affaires · 30 j', HEADLINE.revenueDelta),
      follow: ['Sur quoi dois-je me concentrer aujourd’hui ?', 'Fais-moi un résumé', 'Que peux-tu faire ?'],
    }),
  },
  {
    id: 'thanks', k: /^(merci|super|parfait|top|genial|ok)\b/,
    r: () => ({ title: 'Avec plaisir.', analysis: 'Je surveille vos indicateurs en continu. Revenez quand vous voulez.', follow: ['Fais-moi un résumé', 'Quel indicateur surveiller ?'] }),
  },
  {
    id: 'help', k: /(que|quoi|qu est-ce).*(sais|peux|pourrais).*(faire)|^aide|help|comment (ca|tu) marche/,
    r: () => ({
      title: 'Je réponds avec vos chiffres',
      analysis: 'Posez une question simple sur vos ventes, vos clients, vos canaux ou vos objectifs.',
      data: [['Ventes', 'CA, commandes, panier'], ['Clients', 'récurrents, inactifs'], ['Pilotage', 'objectifs, alertes, rapports']],
      follow: ['Quel est mon meilleur canal ?', 'Combien de clients inactifs ?', 'Prévision pour le mois prochain'],
    }),
  },
  {
    id: 'traffic', k: /trafic|visite|visiteur|audience|mobile|seo/,
    r: () => {
      const v = summarize('visitors', 30);
      return {
        title: `Trafic : ${pct(v.delta, 0)} en 30 jours`,
        analysis: 'La baisse est concentrée sur le mobile (−18 %) depuis mardi. Le desktop est stable.',
        viz: spark('visitors'),
        data: [['Visiteurs 30 j', int(v.value)], ['Mobile', '64 % des visites'], ['Impact estimé', '−2 900 € / mois']],
        recos: ['Comparer la vitesse mobile avant et après mardi.'],
        actions: ['Créer une alerte à −20 %'],
        follow: ['Quel est mon meilleur canal ?', 'Trouve une activité inhabituelle.'],
      };
    },
  },
  {
    id: 'drop', k: /(baiss|chut|recul|diminu|perd).*(chiffre|ca\b|revenu|vente)|(chiffre|ca\b|revenu|vente).*(baiss|chut|recul|diminu)|pourquoi.*(baisse|chute)/,
    r: () => ({
      title: 'Le CA recule de 4 % cette semaine',
      analysis: 'Vous ne vendez pas moins bien : vous recevez moins de visiteurs, surtout sur mobile depuis mardi.',
      explanation: 'La conversion est stable à 3,8 %. La baisse du trafic organique (−9 %) coïncide avec la mise à jour du site de mardi.',
      viz: { type: 'bars', items: [['Trafic mobile', -0.18], ['Trafic organique', -0.09], ['Conversion', 0], ['Clients récurrents', 0.24]] },
      recos: ['Vérifier les pages mobiles modifiées mardi.', 'Relancer les clients récurrents par email.'],
      actions: ['Créer une alerte trafic mobile'],
      follow: ['Compare avec la semaine dernière', 'Quel est mon meilleur canal ?'],
    }),
  },
  {
    id: 'compare', k: /compar|semaine derniere|mois dernier|vs|par rapport|evolution/,
    r: () => {
      const s7 = summarize('revenue', 7);
      return {
        title: `CA sur 7 jours : ${pct(s7.delta)}`,
        analysis: `${eur(s7.value)} contre ${eur(s7.previous)} la semaine précédente.`,
        viz: { type: 'compare', a: ['Semaine précédente', s7.previous], b: ['Cette semaine', s7.value], fmt: 'money' },
        data: [['Commandes 7 j', int(summarize('orders', 7).value)], ['Panier moyen', fmtMetric(METRICS.aov, summarize('aov', 7).value)]],
        recos: [s7.delta < 0 ? 'La baisse vient du trafic : surveillez le mobile.' : 'Belle semaine : sécurisez-la avec un objectif.'],
        follow: ['Pourquoi mon chiffre d’affaires a-t-il baissé cette semaine ?', 'Prévision pour le mois prochain'],
      };
    },
  },
  {
    id: 'forecast', k: /prevision|prevoir|projection|mois prochain|fin du mois|va faire|atteindre|estimation/,
    r: () => {
      const g = GOALS[0];
      const next = HEADLINE.revenue * 1.06;
      return {
        title: `≈ ${eur(next)} le mois prochain`,
        analysis: 'Au rythme actuel (+6 % par mois), et l’objectif du mois est atteint dans 9 jours.',
        explanation: 'Projection sur la tendance des 90 derniers jours, saisonnalité hebdomadaire incluse. Marge d’erreur : ±8 %.',
        viz: big(eur(next), 'Prévision · mois prochain', 0.06),
        data: [['Objectif du mois', `${Math.round((g.current / g.target) * 1000) / 10} %`.replace('.', ',')], ['Reste à faire', eur(g.target - g.current)], ['Jours restants', '9']],
        recos: ['Relancer les clients inactifs sécuriserait +3 100 €.'],
        actions: ['Créer un objectif à 55 000 €'],
        follow: ['Combien de clients inactifs ?', 'Comment augmenter la conversion ?'],
      };
    },
  },
  {
    id: 'inactive', k: /inactif|dormant|perdu|churn|partent|partir|relanc|risque de (partir|perdre)/,
    r: () => ({
      title: '214 clients inactifs depuis 60 jours',
      analysis: 'Ils achetaient en moyenne 2,1× plus que les autres. Une relance ciblée est prête.',
      viz: big('214', 'Clients inactifs · 60 j'),
      data: [['Potentiel estimé', '≈ 3 100 €'], ['Dernier achat moyen', 'il y a 74 j']],
      recos: ['Envoyer une relance personnalisée cette semaine.', 'Automatiser la relance à J+60.'],
      actions: ['Lancer la relance'],
      follow: ['Qui sont mes meilleurs clients ?', 'Crée une automatisation'],
    }),
  },
  {
    id: 'topcustomers', k: /meilleur.? client|top client|clients? (les plus|fidel)|segment/,
    r: () => ({
      title: 'Vos clients récurrents font 41 % du CA',
      analysis: `Ils sont ${int(summarize('returning', 30).value)} (${pct(summarize('returning', 30).delta, 0)}) et leur panier est 2,1× plus élevé que celui d’un nouveau client.`,
      viz: { type: 'bars', share: true, items: [['Récurrents', 0.41], ['Nouveaux', 0.34], ['Occasionnels', 0.25]] },
      recos: ['Leur proposer un programme de fidélité.', 'Les cibler en priorité dans l’email de jeudi.'],
      follow: ['Combien de clients inactifs ?', 'Quel est mon meilleur canal ?'],
    }),
  },
  {
    id: 'customers', k: /client|acheteur/,
    r: () => {
      const r = summarize('returning', 30);
      return {
        title: `${int(r.value)} clients récurrents ce mois-ci`,
        analysis: `${pct(r.delta, 0)} en 30 jours, et 262 nouveaux clients sur un objectif de 400.`,
        viz: spark('returning'),
        data: [['Récurrents', `${int(r.value)} (${pct(r.delta, 0)})`], ['Nouveaux', '262 / 400'], ['Inactifs 60 j', '214']],
        follow: ['Qui sont mes meilleurs clients ?', 'Combien de clients inactifs ?'],
      };
    },
  },
  {
    id: 'channel', k: /canal|canaux|source|acquisition|provien|d ou viennent|marketing|pub|email/,
    r: () => ({
      title: 'L’email est votre meilleur canal',
      analysis: 'Il convertit à 5,2 % et progresse de 31 %. L’organique pèse le plus mais recule.',
      viz: { type: 'bars', items: CHANNELS.map((c) => [c.label, c.delta]), share: false },
      data: CHANNELS.slice(0, 3).map((c) => [c.label, `${Math.round(c.share * 100)} % du trafic`]),
      recos: ['Envoyer un email de plus par mois.', 'Déplacer 15 % du budget vers le canal payant.'],
      follow: ['Pourquoi le trafic baisse ?', 'Comment augmenter la conversion ?'],
    }),
  },
  {
    id: 'conversion', k: /conversion|convertir|transform/,
    r: () => ({
      title: 'Conversion : 3,8 %, au-dessus de votre moyenne',
      analysis: 'Votre moyenne sur 90 jours est de 2,9 %. Le frein principal : 47 % d’abandon au paiement mobile.',
      viz: spark('conversion'),
      data: [['Conversion 30 j', '3,8 %'], ['Moyenne 90 j', '2,9 %'], ['Abandon paiement mobile', '47 %']],
      recos: ['Simplifier le paiement mobile : +0,4 pt estimé.', 'Ajouter des avis sur les 10 pages les plus vues.'],
      actions: ['Créer un objectif à 4,2 %'],
      follow: ['Quel est mon panier moyen ?', 'Prévision pour le mois prochain'],
    }),
  },
  {
    id: 'aov', k: /panier|montant moyen|ticket|aov/,
    r: () => {
      const a = summarize('aov', 30);
      return {
        title: `Panier moyen : ${fmtMetric(METRICS.aov, a.value)}`,
        analysis: `${pct(a.delta)} en 30 jours. Les clients récurrents ont un panier 2,1× plus élevé.`,
        viz: spark('aov'),
        recos: ['Proposer un produit complémentaire au paiement.'],
        follow: ['Qui sont mes meilleurs clients ?', 'Combien de commandes ce mois ?'],
      };
    },
  },
  {
    id: 'orders', k: /commande|vente|achat/,
    r: () => {
      const o = summarize('orders', 30);
      return {
        title: `${int(o.value)} commandes en 30 jours`,
        analysis: `${pct(o.delta, 0)} par rapport au mois précédent, avec un pic de 38 commandes hier soir.`,
        viz: spark('orders'),
        follow: ['Trouve une activité inhabituelle.', 'Quel est mon panier moyen ?'],
      };
    },
  },
  {
    id: 'revenue', k: /chiffre|ca\b|revenu|argent|gagne|rentr/,
    r: () => {
      const s = summarize('revenue', 30);
      return {
        title: `${eur(s.value)} de CA sur 30 jours`,
        analysis: `${pct(s.delta)} par rapport au mois précédent, porté par les clients récurrents.`,
        viz: spark('revenue'),
        data: [['Commandes', int(summarize('orders', 30).value)], ['Panier moyen', fmtMetric(METRICS.aov, summarize('aov', 30).value)]],
        follow: ['Compare avec la semaine dernière', 'Prévision pour le mois prochain'],
      };
    },
  },
  {
    id: 'goal', k: /objectif|cible|target/,
    r: () => {
      const g = GOALS[0];
      return {
        title: 'Objectif du mois atteint à 85,6 %',
        analysis: `${eur(g.current)} sur ${eur(g.target)}. Au rythme actuel, c’est bon dans 9 jours.`,
        viz: { type: 'progress', value: g.current / g.target, label: `${eur(g.current)} / ${eur(g.target)}` },
        recos: g.steps.slice(0, 2),
        actions: ['Voir le plan d’action'],
        follow: ['Prévision pour le mois prochain', 'Combien de clients inactifs ?'],
      };
    },
  },
  {
    id: 'health', k: /sante|score|va bien|comment ca va|etat/,
    r: () => ({
      title: `Score de santé : ${HEALTH.score}/100`,
      analysis: `+${HEALTH.delta} points cette semaine. Point faible : le risque (trafic organique en baisse).`,
      viz: { type: 'bars', score: true, items: HEALTH.parts.map((p) => [p.label, p.score / 100]) },
      follow: ['Pourquoi le trafic baisse ?', 'Sur quoi dois-je me concentrer aujourd’hui ?'],
    }),
  },
  {
    id: 'summary', k: /resume|bilan|recap|synthese|point|vue d ensemble|comment vont/,
    r: () => ({
      title: 'Votre mois en 3 chiffres',
      analysis: 'Les ventes montent, les clients reviennent, le trafic mobile est à surveiller.',
      data: [['Chiffre d’affaires', `${eur(HEADLINE.revenue)} (${pct(HEADLINE.revenueDelta)})`], ['Clients récurrents', pct(HEADLINE.returningDelta, 0)], ['Trafic', pct(HEADLINE.trafficDelta, 0)]],
      viz: spark('revenue'),
      follow: ['Sur quoi dois-je me concentrer aujourd’hui ?', 'Prévision pour le mois prochain'],
    }),
  },
  {
    id: 'automation', k: /automati|workflow|tache|alerte/,
    r: () => ({
      title: '3 automatisations utiles pour vous',
      analysis: 'Choisies selon vos chiffres de la semaine.',
      data: [['Alerte trafic mobile', 'si −20 %'], ['Relance clients inactifs', 'à J+60'], ['Briefing du matin', 'chaque jour 8 h']],
      actions: ['Activer les 3 automatisations'],
      follow: ['Combien de clients inactifs ?', 'Crée un rapport'],
    }),
  },
  {
    id: 'report', k: /rapport|report|pdf|export/,
    r: () => ({
      title: 'Rapport hebdomadaire prêt',
      analysis: 'CA, clients, canaux et recommandations, en une page.',
      data: [['CA 30 j', eur(HEADLINE.revenue)], ['Conversion', '3,8 %'], ['Santé', `${HEALTH.score}/100`]],
      actions: ['Générer le rapport'],
      follow: ['Fais-moi un résumé', 'Crée une automatisation'],
    }),
  },
  {
    id: 'priorities', k: /concentr|aujourd|focus|priorit|faire en premier|par ou commencer/,
    r: () => ({
      title: '3 priorités pour aujourd’hui',
      analysis: 'Une urgence, une opportunité, un objectif à sécuriser.',
      data: [['1 · Trafic mobile', '−2 900 € / mois'], ['2 · Clients inactifs', '+3 100 €'], ['3 · Budget payant +15 %', '+2 400 €']],
      actions: ['Créer les 3 tâches'],
      follow: ['Pourquoi le trafic baisse ?', 'Combien de clients inactifs ?'],
    }),
  },
  {
    id: 'anomaly', k: /inhabituel|anomal|bizarre|etrange|pic|anormal/,
    r: () => ({
      title: '2 activités inhabituelles',
      analysis: 'Un pic de commandes hier soir (×4) et une chute du trafic mobile depuis mardi.',
      viz: spark('orders', 7),
      data: [['Commandes 21 h – 23 h', '38 (×4)'], ['Trafic mobile', '−18 %']],
      actions: ['Surveiller automatiquement'],
      follow: ['Pourquoi le trafic baisse ?', 'Combien de commandes ce mois ?'],
    }),
  },
  {
    id: 'watch', k: /indicateur|surveill|attention|kpi|metrique/,
    r: () => ({
      title: 'À surveiller : le trafic mobile',
      analysis: 'Seul indicateur clé en baisse 3 jours de suite, avec un impact direct sur le CA.',
      viz: spark('visitors', 7),
      actions: ['Créer l’alerte'],
      follow: ['Pourquoi le trafic baisse ?', 'Fais-moi un résumé'],
    }),
  },
  {
    id: 'improve', k: /amelior|augmenter|booster|croissance|conseil|action|comment (gagner|vendre)/,
    r: () => ({
      title: '3 actions pour vendre plus',
      analysis: 'Classées par impact estimé sur le mois.',
      data: [['Relancer 214 inactifs', '+3 100 €'], ['Budget payant +15 %', '+2 400 €'], ['Paiement mobile simplifié', '+0,4 pt']],
      actions: ['Appliquer les 3 actions'],
      follow: ['Comment augmenter la conversion ?', 'Prévision pour le mois prochain'],
    }),
  },
];

/** Réponse contextuelle sur un indicateur (« Explique ceci », « Pourquoi ? »…). */
function aboutMetric(metricId, intent = 'explain') {
  const s = summarize(metricId, 30);
  const m = METRICS[metricId];
  const up = s.delta >= 0;
  const channel = [...CHANNELS].sort((a, b) => (up ? b.delta - a.delta : a.delta - b.delta))[0];
  const titles = {
    explain: `${m.label} : ${fmtMetric(m, s.value)}`,
    why: `${m.label} : pourquoi ${up ? 'la hausse' : 'la baisse'}`,
    todo: `${m.label} : que faire`,
    trend: `${m.label} : la tendance`,
    report: `Rapport · ${m.label}`,
  };
  return {
    title: titles[intent] || titles.explain,
    analysis: `${pct(s.delta)} en 30 jours. Le canal qui pèse le plus : « ${channel.label} » (${pct(channel.delta, 0)}).`,
    viz: spark(metricId),
    data: [['30 derniers jours', fmtMetric(m, s.value)], ['30 jours d’avant', fmtMetric(m, s.previous)]],
    recos: up ? [`Renforcer le canal « ${channel.label} ».`] : [`Examiner le canal « ${channel.label} » en priorité.`],
    actions: [intent === 'report' ? 'Générer le rapport' : 'Créer une alerte'],
    follow: ['Compare avec la semaine dernière', 'Prévision pour le mois prochain'],
  };
}

export function answer(question, { metric = null, intent = null } = {}) {
  if (metric) return aboutMetric(metric, intent || 'explain');
  const q = norm(question);
  const hit = INTENTS.find((a) => a.k.test(q));
  if (hit) return { id: hit.id, ...hit.r() };
  const known = INSIGHTS.map((i) => i.title.toLowerCase());
  return {
    id: 'unknown',
    title: 'Je n’ai pas trouvé ça dans vos données',
    analysis: known.length ? 'Je réponds sur vos ventes, clients, canaux, objectifs et alertes. Essayez une de ces questions :' : '',
    follow: ['Fais-moi un résumé', 'Quel est mon meilleur canal ?', 'Combien de clients inactifs ?'],
  };
}
