/**
 * Configuration centrale — tout ce qui est propre à votre marque se change ici.
 * Les textes longs (titres, FAQ…) sont dans index.html.
 */
export const CONFIG = {
  brand: 'Ordra',

  // Lien des CTA « Commencer maintenant ».
  // '#inscription' ouvre le formulaire intégré ; sinon mettez l'URL de votre app.
  signupUrl: '#inscription',

  // Où envoyer les formulaires (inscription et contact) : URL qui accepte un POST JSON
  // (Formspree, Make, Zapier, votre API…). Vide = démonstration sans envoi.
  formEndpoint: '',

  // Page de remerciement après un envoi réussi (site publié).
  thankYouPage: 'merci.html',

  // Google Analytics 4 (ex. 'G-XXXXXXX'). Chargé seulement après accord du visiteur.
  gaId: '',

  // Informations de l'entreprise : footer, contact, carte, données structurées, pages légales.
  company: {
    legalName: '[Raison sociale]',
    siteUrl: 'https://www.votre-domaine.fr',
    email: 'contact@votre-domaine.fr',
    phone: '',
    street: '[Adresse]',
    postalCode: '[Code postal]',
    city: '[Ville]',
    country: 'France',
    responseTime: 'Réponse sous 24 h ouvrées',
    openingHours: 'Du lundi au vendredi, 9 h – 18 h',
  },

  // Preuves : laissez vide tant que vous n'avez pas de vraies données.
  // Les emplacements vides s'affichent comme « à compléter ».
  testimonials: [
    // { quote: '…', name: 'Prénom Nom', role: 'Fonction', company: 'Entreprise', rating: 5 },
  ],
  caseStudies: [
    // { sector: 'Négoce B2B', company: 'Entreprise', challenge: '…', solution: '…', result: '…', metric: '−12 h / semaine' },
  ],
  team: [
    // { name: 'Prénom Nom', role: 'Fondateur', photo: 'equipe/prenom.jpg' },
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
      starter: 89,
      pro: 249,
      enterprise: null,
    },
    // Frais d'installation et de paramétrage (payés une fois)
    setup: {
      starter: 490,
      pro: 1490,
      enterprise: null,
    },
    // Offrir l'installation aux clients qui choisissent l'engagement annuel
    setupWaivedAnnual: true,
  },
};
