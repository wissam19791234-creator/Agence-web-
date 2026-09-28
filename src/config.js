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
  // Format : { quote, name, role, company }
  testimonials: [],
  logos: [], // ex. ['Nom client 1', 'Nom client 2']
};
