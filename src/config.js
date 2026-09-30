/**
 * Configuration centrale de Scalify : marque, offres, contenus de confiance.
 * Tout ce qui doit être remplacé par des données réelles se trouve ici.
 */
export const CONFIG = {
  brand: 'Scalify',
  tagline: 'Le centre de commande intelligent de votre activité.',

  // Où envoyer les formulaires (inscription, connexion par lien, contact).
  // FormSubmit transfère chaque envoi par email ; au premier envoi, confirmez l'email d'activation.
  // Vide = démonstration sans envoi.
  formEndpoint: 'https://formsubmit.co/ajax/scalifyfr@gmail.com',

  company: {
    legalName: '[Raison sociale]',
    siteUrl: 'https://www.votre-domaine.fr',
    email: 'scalifyfr@gmail.com',
  },

  // Vidéo de démonstration (bouton « Voir la démo »)
  video: {
    mp4: '/media/scalify-demo.mp4',
    mp4Mobile: '/media/scalify-demo-mobile.mp4',
    webm: '/media/scalify-demo.webm',
    poster: '/media/scalify-demo-poster.jpg',
  },

  // ───────── Tarifs (HT, par mois) ─────────
  pricing: {
    currency: '€',
    yearlyDiscount: 0.2,
    plans: [
      {
        id: 'starter', name: 'Starter', price: 190, tagline: 'Pour démarrer seul',
        cta: 'Choisir Starter',
        limits: { ai: '300 questions IA / mois', dashboards: '3 dashboards', automations: '10 automatisations', reports: 'Rapport hebdomadaire', history: '6 mois', members: '2 membres', analytics: 'Analyses essentielles' },
      },
      {
        id: 'pro', name: 'Pro', price: 490, tagline: 'Pour piloter au quotidien', recommended: true,
        cta: 'Choisir Pro',
        limits: { ai: 'IA illimitée', dashboards: 'Dashboards illimités', automations: '50 automatisations', reports: 'Tous les rapports + planification', history: '24 mois', members: '10 membres', analytics: 'Analyses avancées + prévisions' },
      },
      {
        id: 'business', name: 'Business', price: 990, tagline: 'Pour toute l’entreprise',
        cta: 'Choisir Business',
        limits: { ai: 'IA illimitée + contexte équipe', dashboards: 'Dashboards illimités', automations: 'Automatisations illimitées', reports: 'Rapports direction + marque blanche', history: 'Illimité', members: '50 membres', analytics: 'Analyses avancées + anomalies' },
      },
      {
        id: 'enterprise', name: 'Entreprise', price: 1990, tagline: 'Pour les grandes équipes',
        cta: 'Choisir Entreprise',
        limits: { ai: 'IA illimitée + modèles dédiés', dashboards: 'Dashboards illimités', automations: 'Automatisations illimitées', reports: 'Rapports à votre image', history: 'Illimité', members: 'Membres illimités', analytics: 'Anomalies + prévisions avancées' },
      },
    ],
    rows: [
      ['ai', 'Usage de l’IA'], ['dashboards', 'Dashboards'], ['automations', 'Automatisations'], ['reports', 'Rapports'],
      ['history', 'Historique'], ['members', 'Membres'], ['analytics', 'Analyses'],
    ],
  },


  // ───────── Preuves sociales ─────────
  // Laissez vide tant que vous n'avez pas de retours réels et autorisés :
  // la page affiche alors le programme « Premières équipes » au lieu de faux avis.
  // Format : { quote, name, role, type, look, sample }
  // `sample: true` affiche un badge « Exemple » : retirez-le uniquement pour un retour réel et autorisé.
  // `look` décrit l'avatar illustré (voir src/shared/avatars.js).
  testimonials: [
    { type: 'E-commerce', name: 'Camille R.', role: 'Fondatrice, boutique en ligne', quote: 'Le briefing du matin remplace mes trois tableaux. Je sais quoi faire avant mon café.', look: { bg: 'lav', shirt: 'ember', skin: 0, hair: 2, style: 'long' }, sample: true },
    { type: 'Indépendant', name: 'Karim B.', role: 'Consultant', quote: 'Je vois en un coup d’œil quels clients relancer.', look: { bg: 'sun', shirt: 'blue', skin: 2, hair: 0, style: 'short', beard: true }, sample: true },
    { type: 'Agence', name: 'Léa M.', role: 'Directrice d’agence', quote: 'Les rapports clients sont prêts en quelques clics.', look: { bg: 'mint', shirt: 'violet', skin: 1, hair: 1, style: 'bun', glasses: true }, sample: true },
    { type: 'Commerce', name: 'Thomas D.', role: 'Gérant de magasin', quote: 'Une alerte quand une journée décroche. Je réagis le jour même.', look: { bg: 'sky', shirt: 'mint', skin: 0, hair: 4, style: 'bald', glasses: true, beard: true }, sample: true },
    { type: 'Startup', name: 'Aïcha N.', role: 'Responsable croissance', quote: 'Je pose ma question à l’IA, elle me répond avec mes chiffres.', look: { bg: 'ember', shirt: 'sun', skin: 4, hair: 0, style: 'curly' }, sample: true },
  ],
  // Équipe. Même principe : `sample: true` tant que ce ne sont pas les vraies personnes.
  team: [
    { name: 'Sami', role: 'Fondateur', line: 'Vision & produit', look: { bg: 'sun', shirt: 'violet', skin: 2, hair: 0, style: 'short' }, sample: true },
    { name: 'Inès', role: 'Design', line: 'Chaque écran, chaque sticker', look: { bg: 'mint', shirt: 'ember', skin: 1, hair: 1, style: 'long' }, sample: true },
    { name: 'Yanis', role: 'IA & données', line: 'Le cerveau du Copilote', look: { bg: 'lav', shirt: 'blue', skin: 3, hair: 0, style: 'curly', glasses: true }, sample: true },
    { name: 'Julie', role: 'Ingénierie', line: 'Rapide et fiable', look: { bg: 'sky', shirt: 'mint', skin: 0, hair: 3, style: 'bun' }, sample: true },
  ],
  logos: [], // ex. ['Nom client 1', 'Nom client 2']
};
