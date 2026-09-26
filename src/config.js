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

  // Tarifs (HT, par mois). `null` = sur devis.
  pricing: {
    currency: '€',
    annualDiscount: 0.2,
    plans: {
      starter: 49,
      pro: 129,
      enterprise: null,
    },
  },
};
