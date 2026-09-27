/**
 * Configuration centrale — tout ce qui est propre à votre marque se change ici.
 * Les textes longs (titres, FAQ…) sont dans index.html.
 */
export const CONFIG = {
  brand: 'Ordra',

  // Lien de tous les CTA « Commencer maintenant ». Remplacez par votre URL d'inscription.
  signupUrl: '#tarifs',

  // Vidéo produit. Laisser vide ('') pour afficher l'animatique intégrée.
  // Formats acceptés : fichier .mp4/.webm, lien YouTube ou Vimeo.
  videoUrl: '', // VIDEO_PLACEHOLDER_URL

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
