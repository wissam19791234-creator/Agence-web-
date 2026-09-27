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

  // Google Analytics 4 (ex. 'G-XXXXXXX'). Chargé seulement après accord du visiteur.
  gaId: '',

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
        id: 'free', name: 'Free', price: 0, tagline: 'Pour découvrir',
        cta: 'Commencer gratuitement',
        limits: { ai: '50 questions IA / mois', dashboards: '1 dashboard', automations: '3 automatisations', reports: 'Rapport hebdomadaire', integrations: '2 sources', members: '1 membre', analytics: 'Analyses essentielles' },
      },
      {
        id: 'pro', name: 'Pro', price: 490, tagline: 'Pour piloter au quotidien', recommended: true,
        cta: 'Essayer Pro 14 jours',
        limits: { ai: 'IA illimitée', dashboards: 'Dashboards illimités', automations: '50 automatisations', reports: 'Tous les rapports + planification', integrations: '15 sources', members: '10 membres', analytics: 'Analyses avancées + prévisions' },
      },
      {
        id: 'business', name: 'Business', price: 990, tagline: 'Pour toute l’entreprise',
        cta: 'Essayer Business 14 jours',
        limits: { ai: 'IA illimitée + contexte équipe', dashboards: 'Dashboards illimités', automations: 'Automatisations illimitées', reports: 'Rapports direction + marque blanche', integrations: 'Sources illimitées + API', members: '50 membres', analytics: 'Analyses avancées + anomalies' },
      },
    ],
    rows: [
      ['ai', 'Usage de l’IA'], ['dashboards', 'Dashboards'], ['automations', 'Automatisations'], ['reports', 'Rapports'],
      ['integrations', 'Intégrations'], ['members', 'Membres'], ['analytics', 'Analyses'],
    ],
  },

  // ───────── Intégrations ─────────
  // status : 'available' (réellement branchée), 'soon' (prévue). Ne passez à 'available'
  // que les connecteurs réellement opérationnels.
  integrations: [
    { name: 'Google Analytics', status: 'soon' },
    { name: 'Stripe', status: 'soon' },
    { name: 'Shopify', status: 'soon' },
    { name: 'HubSpot', status: 'soon' },
    { name: 'Salesforce', status: 'soon' },
    { name: 'Notion', status: 'soon' },
    { name: 'Slack', status: 'soon' },
    { name: 'Zapier', status: 'soon' },
    { name: 'Import CSV', status: 'soon' },
    { name: 'API REST', status: 'soon' },
  ],

  // ───────── Preuves sociales ─────────
  // Laissez vide tant que vous n'avez pas de retours réels et autorisés :
  // la page affiche alors le programme « Premières équipes » au lieu de faux avis.
  // Format : { quote, name, role, company }
  testimonials: [],
  logos: [], // ex. ['Nom client 1', 'Nom client 2']
};
