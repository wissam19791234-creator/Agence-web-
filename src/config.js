/**
 * Configuration centrale — tout ce qui est propre à votre marque se change ici.
 * Les textes longs (titres, FAQ…) sont dans index.html.
 */
export const CONFIG = {
  brand: 'Ordra',

  // Lien des CTA « Commencer maintenant ».
  // '#inscription' ouvre le formulaire intégré ; sinon mettez l'URL de votre app.
  signupUrl: '#inscription',

  // Où envoyer les formulaires (inscription, contact, service client) : URL qui accepte un POST JSON.
  // Par défaut : FormSubmit, qui transfère chaque envoi par email à l'adresse ci-dessous
  // (au premier envoi, FormSubmit envoie un email d'activation à confirmer une seule fois).
  // Vide = démonstration sans envoi.
  formEndpoint: 'https://formsubmit.co/ajax/scalifyfr@gmail.com',

  // Page de remerciement après un envoi réussi (site publié).
  thankYouPage: 'merci.html',

  // Google Analytics 4 (ex. 'G-XXXXXXX'). Chargé seulement après accord du visiteur.
  gaId: '',

  // Informations de l'entreprise : footer, contact, carte, données structurées, pages légales.
  company: {
    legalName: '[Raison sociale]',
    siteUrl: 'https://www.votre-domaine.fr',
    email: 'scalifyfr@gmail.com',
    phone: '',
    street: '[Adresse]',
    postalCode: '[Code postal]',
    city: '[Ville]',
    country: 'France',
    responseTime: 'Réponse sous 2 h ouvrées',
    openingHours: 'Du lundi au samedi, 9 h – 19 h',
  },

  // Service client : widget de discussion (bas de page) + section « Service client »
  support: {
    agent: 'Léa',               // prénom affiché dans le widget
    agentAvatar: 'lea',         // clé d'avatar (src/data/avatars.js)
    hours: 'Lun – sam · 9 h – 19 h',
    reply: 'Réponse moyenne : 12 min',
  },

  // ───────── Preuves ─────────
  // Contenus d'EXEMPLE (personnes et entreprises fictives, chiffres illustratifs).
  // Remplacez-les par vos vrais clients avant la mise en ligne, puis passez `exampleContent` à false.
  // Publier de faux avis présentés comme réels est interdit (pratique commerciale trompeuse).
  exampleContent: true,
  stats: [
    { value: '+38 %', label: 'de productivité' },
    { value: '12 h', label: 'gagnées par semaine' },
    { value: '64 %', label: 'de tâches automatisées' },
  ],
  logos: ['Nordwise', 'Atelier Brume', 'Maison Ciel', 'Verano', 'Studio Alto', 'Cobalt'],
  testimonials: [
    { quote: 'On a gagné une journée par semaine. Le reporting du lundi se fait tout seul.', name: 'Claire Martin', role: 'Directrice générale', company: 'Atelier Brume', rating: 5, avatar: 'claire' },
    { quote: 'Les relances de devis partent seules. +21 % de signatures en trois mois.', name: 'Thomas Leroy', role: 'Directeur commercial', company: 'Nordwise', rating: 5, avatar: 'thomas' },
    { quote: 'Enfin une vision claire de la trésorerie, sans tableur.', name: 'Inès Benali', role: 'DAF', company: 'Maison Ciel', rating: 5, avatar: 'ines' },
    { quote: 'Installé en une semaine. L’équipe l’a adopté dès le premier jour.', name: 'Karim Dupont', role: 'COO', company: 'Verano', rating: 5, avatar: 'karim' },
    { quote: 'L’assistant IA répond mieux que nos anciens rapports.', name: 'Julie Moreau', role: 'Fondatrice', company: 'Studio Alto', rating: 5, avatar: 'julie' },
    { quote: 'On a arrêté trois outils. Tout est au même endroit.', name: 'Hugo Bernard', role: 'Responsable opérations', company: 'Cobalt', rating: 4, avatar: 'hugo' },
  ],
  caseStudies: [
    { sector: 'Négoce B2B', company: 'Nordwise', metric: '+21 %', metricLabel: 'de devis signés', challenge: 'Des devis oubliés, aucune relance.', solution: 'Relances IA à J+3 et score par affaire.', result: 'Plus aucun devis sans suivi.' },
    { sector: 'Agence créative', company: 'Atelier Brume', metric: '−9 h', metricLabel: 'de reporting / semaine', challenge: 'Un reporting manuel chaque lundi.', solution: 'Rapport direction envoyé à 8 h.', result: 'La direction décide dès le lundi matin.' },
    { sector: 'Distribution', company: 'Verano', metric: '0', metricLabel: 'rupture de stock en 6 mois', challenge: 'Des ruptures découvertes trop tard.', solution: 'Alertes de seuil et réassort programmé.', result: 'Stocks pilotés en temps réel.' },
  ],
  team: [
    { name: 'Sarah Lemoine', role: 'CEO & cofondatrice', avatar: 'sarah' },
    { name: 'Nicolas Faure', role: 'CTO & cofondateur', avatar: 'nicolas' },
    { name: 'Léa Garnier', role: 'Head of Customer Success', avatar: 'lea' },
    { name: 'Mehdi Rahal', role: 'Lead IA', avatar: 'mehdi' },
  ],

  // Vidéo produit. Laisser vide ('') pour afficher l'animatique intégrée.
  // Formats acceptés : fichier .mp4/.webm, lien YouTube ou Vimeo.
  videoUrl: 'media/ordra-film.mp4', // VIDEO_PLACEHOLDER_URL — généré par `npm run film`
  videoUrlMobile: 'media/ordra-film-mobile.mp4',
  videoUrlWebm: 'media/ordra-film.webm', // secours pour les navigateurs sans H.264
  videoPoster: 'media/ordra-film-poster.jpg',

  // Tarifs (HT). `null` = sur devis.
  pricing: {
    currency: '€',
    annualDiscount: 0.2,
    // Abonnement mensuel
    plans: {
      starter: 190,
      pro: 490,
      business: 990,
    },
    // Frais d'installation et de paramétrage (payés une fois)
    setup: {
      starter: 990,
      pro: 2490,
      business: 4900,
    },
    // Offre sur mesure : estimation affichée par le configurateur (« à partir de »)
    custom: {
      base: 1490,           // socle mensuel
      perUser: 12,          // par utilisateur au-delà de 50
      includedUsers: 50,
      setupFrom: 9900,
      modules: [
        { id: 'sso', label: 'SSO & rôles avancés', price: 290 },
        { id: 'integrations', label: 'Intégrations sur mesure', price: 490 },
        { id: 'models', label: 'Modèles IA dédiés', price: 690 },
        { id: 'csm', label: 'Responsable de compte dédié', price: 390 },
        { id: 'sla', label: 'SLA 99,9 % + support 24/7', price: 590 },
        { id: 'onprem', label: 'Hébergement privé (UE)', price: 890 },
      ],
    },
    // Offrir l'installation aux clients qui choisissent l'engagement annuel
    setupWaivedAnnual: true,
  },
};
