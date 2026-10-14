import { useEffect, useState } from 'react';

// Routes en ancre simple (#menu, #pro-devis…) : lisibles, partageables, compatibles avec l'aperçu hébergé.
export type Route =
  | 'accueil' | 'prestations' | 'menu' | 'galerie' | 'tarifs' | 'faq' | 'devis' | 'presentation' | 'mentions'
  | 'pro' | 'pro-prospects' | 'pro-pipeline' | 'pro-devis' | 'pro-calendrier' | 'pro-catalogue'
  | 'pro-taches' | 'pro-rentabilite' | 'pro-photos' | 'pro-parametres';

export const PUBLIC_META: Record<string, { title: string; description: string }> = {
  accueil: { title: 'Maison EL Events — Décoration événementielle à Orléans', description: 'Décoration de mariage, décoration de table, buffets, location de décoration et traiteur événementiel à Orléans.' },
  prestations: { title: 'Prestations — Décoration de mariage et de table à Orléans | Maison EL Events', description: 'Décoration de tables, espace mariés, buffets, location de décoration, traiteur, mignardises et mocktails à Orléans.' },
  menu: { title: 'Menu traiteur — Mignardises et mocktails | Maison EL Events', description: 'Mignardises sucrées et salées à 1 € la pièce, mocktails à 4 € : le menu traiteur événementiel de Maison EL Events à Orléans.' },
  galerie: { title: 'Galerie — Décoration événementielle | Maison EL Events', description: 'Mariages, décorations de tables, buffets et événements privés : la galerie de Maison EL Events à Orléans.' },
  tarifs: { title: 'Tarifs et simulateur de devis | Maison EL Events', description: 'Décoration de table 7,50 € par personne, mignardises 1 € la pièce, mocktails 4 €, coin mariés 60 € : estimez votre événement.' },
  faq: { title: 'Questions fréquentes et infos pratiques | Maison EL Events', description: 'Tarifs, coin mariés, mignardises, installation, acompte, zone et horaires : les réponses aux questions fréquentes sur Maison EL Events à Orléans.' },
  devis: { title: 'Demander un devis — Décoration et traiteur à Orléans | Maison EL Events', description: 'Décrivez votre événement en quelques étapes pour recevoir une proposition de décoration et de traiteur à Orléans.' },
  presentation: { title: 'Présentation de la solution — Maison EL Events', description: 'Présentation privée du site et de l’espace professionnel proposés à Maison EL Events.' },
  mentions: { title: 'Mentions légales | Maison EL Events', description: 'Mentions légales de Maison EL Events (informations à compléter).' },
};

const ALL: Route[] = ['accueil', 'prestations', 'menu', 'galerie', 'tarifs', 'faq', 'devis', 'presentation', 'mentions', 'pro', 'pro-prospects', 'pro-pipeline', 'pro-devis', 'pro-calendrier', 'pro-catalogue', 'pro-taches', 'pro-rentabilite', 'pro-photos', 'pro-parametres'];

function read(): Route {
  const h = decodeURIComponent(location.hash.replace(/^#/, '')) as Route;
  return ALL.includes(h) ? h : 'accueil';
}

export function navigate(r: Route) {
  if (read() === r && location.hash) { window.scrollTo({ top: 0 }); return; }
  location.hash = r;
}

export function useRoute(): Route {
  const [r, setR] = useState<Route>(read);
  useEffect(() => {
    const on = () => { setR(read()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    const meta = PUBLIC_META[r] ?? { title: 'Espace professionnel (démo) — Maison EL Events', description: 'Espace professionnel de démonstration : données fictives.' };
    document.title = meta.title;
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); }
    m.setAttribute('content', meta.description);
    // Pages privées (présentation, espace pro) exclues des moteurs de recherche.
    let rb = document.querySelector('meta[name="robots"]');
    if (r === 'presentation' || isPro(r)) {
      if (!rb) { rb = document.createElement('meta'); rb.setAttribute('name', 'robots'); document.head.appendChild(rb); }
      rb.setAttribute('content', 'noindex, nofollow');
    } else rb?.remove();
  }, [r]);
  return r;
}

export const isPro = (r: Route) => r === 'pro' || r.startsWith('pro-');
