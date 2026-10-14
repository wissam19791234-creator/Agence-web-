import type { EventStatus, EventType, Priority, QuoteStatus, ServiceKey, StageKey } from './types';

export const STAGES: { key: StageKey; label: string; short: string; dot: string }[] = [
  { key: 'nouveau', label: 'Nouveau prospect', short: 'Nouveau', dot: '#6EA8FE' },
  { key: 'qualifier', label: 'Demande à qualifier', short: 'À qualifier', dot: '#A78BFA' },
  { key: 'preparer', label: 'Devis à préparer', short: 'Devis à préparer', dot: '#F0B95B' },
  { key: 'envoye', label: 'Devis envoyé — simulation', short: 'Devis envoyé (simulation)', dot: '#4FD1C5' },
  { key: 'relance', label: 'Relance à effectuer', short: 'Relance', dot: '#FF8A65' },
  { key: 'reservation', label: 'Réservation confirmée — simulation', short: 'Réservation (simulation)', dot: '#C59B5F' },
  { key: 'termine', label: 'Événement terminé', short: 'Terminé', dot: '#8C8D8E' },
];
export const stageLabel = (k: StageKey) => STAGES.find((s) => s.key === k)?.label ?? k;
export const stageDot = (k: StageKey) => STAGES.find((s) => s.key === k)?.dot ?? '#808080';

export const EVENT_TYPES: EventType[] = ['Mariage', 'Henné', 'Fiançailles', 'Anniversaire', 'Baptême', 'Baby shower', "Événement d'entreprise", 'Autre'];

export const SERVICE_LABELS: Record<ServiceKey, string> = {
  'deco-tables': 'Décoration de tables',
  mariage: 'Décoration de mariage et espace mariés',
  buffets: 'Décoration de buffets',
  location: 'Location de matériel et décor',
  traiteur: 'Prestations traiteur',
  mignardises: 'Mignardises sucrées et salées',
  mocktails: 'Mocktails et boissons sans alcool',
};
export const SERVICE_KEYS = Object.keys(SERVICE_LABELS) as ServiceKey[];

export const QUOTE_STATUS: Record<QuoteStatus, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé — simulation',
  accepte: 'Accepté — simulation',
  refuse: 'Refusé',
};

export const EVENT_STATUS: Record<EventStatus, string> = {
  option: 'Option (date souhaitée)',
  confirme: 'Confirmé — simulation',
  termine: 'Terminé',
};

export const PRIORITY: Record<Priority, string> = { haute: 'Haute', normale: 'Normale', basse: 'Basse' };

export const GALLERY_CATS = ['Mariages', 'Décoration de tables', 'Buffets', 'Traiteur', 'Événements privés'] as const;

/** Identifiants des tarifs de référence utilisés par le simulateur et les devis. */
export const PRICE_IDS = {
  decoTable: 'cat-deco-table',
  coinMaries: 'cat-coin-maries',
  sucree: 'cat-mignardise-sucree',
  salee: 'cat-mignardise-salee',
  boisson: 'cat-boisson',
  buffet: 'cat-buffet',
  location: 'cat-location',
  traiteur: 'cat-traiteur',
  installation: 'cat-installation',
} as const;

export const DEMO_BANNER = 'MODE DÉMONSTRATION — Données fictives, aucune action commerciale réelle.';
