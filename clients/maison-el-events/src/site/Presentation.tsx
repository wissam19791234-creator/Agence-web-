import { Icon, type IconName } from '../components/Icon';
import { Button, LinkButton, SectionTitle } from '../components/ui';
import type { Route } from '../lib/router';
import { useUi } from '../lib/ui';

const BLOCKS: { icon: IconName; t: string; d: string; r: Route; cta: string }[] = [
  { icon: 'grid', t: 'Le site présente vos prestations', d: 'Prestations, menu traiteur avec prix exacts, galerie filtrable et page tarifs : vos clients trouvent l’essentiel avant même de vous écrire.', r: 'prestations', cta: 'Voir les prestations' },
  { icon: 'mail', t: 'Un prospect envoie sa demande', d: 'Le formulaire en plusieurs étapes recueille la date, le lieu, le nombre d’invités, les prestations et des photos d’inspiration.', r: 'devis', cta: 'Voir le formulaire' },
  { icon: 'users', t: 'Les demandes sont centralisées', d: 'Chaque demande crée une fiche client avec ses coordonnées, son historique, des notes internes, des tags et la prochaine action.', r: 'pro-prospects', cta: 'Voir les fiches' },
  { icon: 'euro', t: 'Les devis se calculent à partir de vos tarifs', d: 'Les lignes connues (7,50 € par personne, 1 € la mignardise, 4 € le mocktail, 60 € le coin mariés) s’ajoutent seules ; le reste se chiffre à la main.', r: 'pro-devis', cta: 'Voir les devis' },
  { icon: 'calendar', t: 'Les événements sont organisés', d: 'Le calendrier affiche les dates en option et les réservations, reliées aux fiches clients.', r: 'pro-calendrier', cta: 'Voir le calendrier' },
  { icon: 'kanban', t: 'Le suivi commercial est simplifié', d: 'Le pipeline montre où en est chaque demande ; les tâches de relance rappellent qui recontacter et quand.', r: 'pro-pipeline', cta: 'Voir le pipeline' },
];

const AVAILABLE = [
  'Site public : accueil, prestations, menu, galerie filtrable, tarifs, mentions légales',
  'Simulateur de budget avec les tarifs communiqués',
  'Formulaire de devis en 5 étapes, avec photos d’inspiration',
  'Fiches prospects : création, modification, suppression, notes, tags, historique',
  'Pipeline en 7 colonnes, déplaçable à la souris ou au menu',
  'Éditeur de devis : lignes du catalogue, quantités, lignes personnalisées, aperçu, duplication',
  'Calendrier mensuel, hebdomadaire et en liste, relié aux fiches',
  'Catalogue administrable (prix, unités, photos, statut actif)',
  'Tâches et relances avec échéances et priorités',
  'Rentabilité indicative par événement (données d’exemple)',
  'Paramètres : nom, logo, couleurs, coordonnées, conditions des devis',
  'Import de vos photos à la place des visuels temporaires',
  'Parcours de démonstration guidé et réinitialisation des données',
];

const TO_CONNECT = [
  'Hébergement, nom de domaine et référencement (indexation par Google)',
  'Envoi réel des demandes par e-mail (service d’envoi à configurer)',
  'Base de données en ligne et comptes sécurisés, par exemple Supabase',
  'Stockage en ligne des photos importées',
  'Impression et export PDF des devis (désactivés dans cet aperçu)',
  'Envoi des devis et des relances par e-mail ou SMS',
  'Paiement d’acompte en ligne (prestataire de paiement à configurer)',
  'Synchronisation avec un agenda externe',
  'Vrais avis clients, coordonnées et mentions légales de l’entreprise',
];

export default function Presentation() {
  const { startTour } = useUi();
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-site px-4 py-16 sm:px-6 lg:py-24">
          <p className="thin text-[14px]">Présentation privée · proposition Scalify</p>
          <h1 className="display mt-6 max-w-[1000px] text-[13vw] sm:text-[90px] lg:text-[110px]">Un site et un espace de gestion pensés pour Maison EL Events</h1>
          <p className="mt-8 max-w-[600px] text-[18px] leading-[1.4] text-brun-2">Cette page explique, étape par étape, comment le site attire les demandes et comment l’espace professionnel aide à les transformer en événements. Tout est testable : les données sont fictives et restent dans votre navigateur.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" variant="primary" icon="play" onClick={startTour}>Parcourir la démonstration guidée</Button>
            <LinkButton href="#accueil" size="lg" variant="secondary">Voir le site</LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-site px-4 py-16 sm:px-6 lg:py-20">
        <SectionTitle eyebrow="Fonctionnement" title="Du premier message au jour J" />
        <ol className="mt-12 grid border-t border-smoke/60 md:grid-cols-2 lg:grid-cols-3">
          {BLOCKS.map((b, i) => (
            <li key={b.t} className="flex flex-col border-b border-line py-8 md:pr-8">
              <div className="flex items-center gap-3"><Icon name={b.icon} className="h-5 w-5 text-smoke" /><span className="thin text-[14px] text-smoke">Étape {String(i + 1).padStart(2, '0')}</span></div>
              <h2 className="mt-5 text-[24px] leading-[1.2] text-brun">{b.t}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-brun-2">{b.d}</p>
              <LinkButton href={`#${b.r}`} variant="secondary" size="sm" className="mt-5 self-start" iconRight="arrow">{b.cta}</LinkButton>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-16 lg:py-20" aria-labelledby="features-t">
        <div className="mx-auto max-w-site px-4 sm:px-6">
          <SectionTitle eyebrow="Transparence" title={<span id="features-t">Fonctionnalités disponibles</span>}>Ce qui fonctionne déjà dans cette démonstration, et ce qu’il reste à connecter pour une utilisation réelle.</SectionTitle>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="border-t border-white pt-6">
              <h3 className="font-serif text-[32px] leading-[1.05] text-brun">Disponible dans cette démonstration</h3>
              <ul className="mt-5 space-y-2.5 text-[15px] text-brun-2">{AVAILABLE.map((a) => <li key={a} className="flex gap-2.5 border-b border-line pb-2.5"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-white" />{a}</li>)}</ul>
            </div>
            <div className="bg-brand p-6 text-white">
              <h3 className="font-serif text-[32px] leading-[1.05]">À connecter pour la production</h3>
              <ul className="mt-5 space-y-2.5 text-[15px]">{TO_CONNECT.map((a) => <li key={a} className="flex gap-2.5 border-b border-white/30 pb-2.5"><span className="shrink-0">—</span>{a}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
