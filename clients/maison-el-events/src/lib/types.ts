// Modèle de données de la démo Maison EL Events.
// Toutes les données d'exemple sont fictives (champ `fictif`).

export type StageKey =
  | 'nouveau'
  | 'qualifier'
  | 'preparer'
  | 'envoye'
  | 'relance'
  | 'reservation'
  | 'termine';

export type EventType =
  | 'Mariage'
  | 'Henné'
  | 'Fiançailles'
  | 'Anniversaire'
  | 'Baptême'
  | 'Baby shower'
  | "Événement d'entreprise"
  | 'Autre';

export type ServiceKey =
  | 'deco-tables'
  | 'mariage'
  | 'buffets'
  | 'location'
  | 'traiteur'
  | 'mignardises'
  | 'mocktails';

export type CatalogCategory =
  | 'Décoration'
  | 'Mariage'
  | 'Buffets'
  | 'Location'
  | 'Traiteur'
  | 'Mignardises sucrées'
  | 'Mignardises salées'
  | 'Boissons'
  | 'Frais';

export type Unit = 'par personne' | 'la pièce' | 'forfait' | 'sur devis';

export interface Note { id: string; at: number; text: string }
export interface HistoryEntry { id: string; at: number; text: string }

export interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventType: EventType;
  eventDate: string; // AAAA-MM-JJ, '' si inconnue
  place: string;
  guests: number | null;
  services: ServiceKey[];
  budget: string;
  needs: string;
  tags: string[];
  notes: Note[];
  history: HistoryEntry[];
  stage: StageKey;
  nextAction: string;
  nextActionDate: string;
  lastContact: string;
  createdAt: number;
  source: 'site' | 'simulation' | 'manuel' | 'exemple';
  inspirationIds: string[];
  fictif: true;
}

export interface QuoteLine {
  id: string;
  catalogId?: string;
  label: string;
  qty: number;
  unitPrice: number | null; // null = à chiffrer
  unit: Unit;
}

export type QuoteStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse';

export interface Quote {
  id: string;
  number: string;
  prospectId: string;
  eventType: EventType;
  eventDate: string;
  guests: number | null;
  lines: QuoteLine[];
  extraFees: string;
  conditions: string;
  notes: string;
  status: QuoteStatus;
  createdAt: number;
  updatedAt: number;
}

export type EventStatus = 'option' | 'confirme' | 'termine';

export interface CalEvent {
  id: string;
  prospectId: string | null;
  title: string;
  date: string;
  time: string;
  status: EventStatus;
  place: string;
  guests: number | null;
  notes: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: CatalogCategory;
  description: string;
  ingredients: string;
  allergens: string;
  price: number | null; // null = sur devis
  unit: Unit;
  active: boolean;
  menu?: 'sucre' | 'sale' | 'mocktail';
  imageKey?: string;
}

export interface SiteService {
  id: ServiceKey;
  title: string;
  description: string;
  priceNote: string;
  active: boolean;
  imageKey: string;
}

export type Priority = 'haute' | 'normale' | 'basse';

export interface Task {
  id: string;
  title: string;
  prospectId: string | null;
  due: string;
  priority: Priority;
  kind: 'relance' | 'appel' | 'tache';
  done: boolean;
  createdAt: number;
}

export interface Expense {
  id: string;
  label: string;
  amount: number;
  category: 'Fleurs et décor' | 'Matières premières' | 'Location' | 'Transport' | 'Autre';
  eventId: string | null;
  date: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Mariages' | 'Décoration de tables' | 'Buffets' | 'Traiteur' | 'Événements privés';
  description: string;
  imageKey: string;
  art: ArtKind;
}

export type ArtKind = 'table' | 'arche' | 'buffet' | 'verrine' | 'mocktail' | 'canape' | 'mignardise' | 'salon';

export interface Activity { id: string; at: number; text: string; kind: 'demande' | 'devis' | 'pipeline' | 'tache' | 'agenda' | 'catalogue' | 'reglages' | 'client' }

export interface Settings {
  businessName: string;
  tagline: string;
  city: string;
  email: string;
  phone: string;
  address: string;
  instagram: string;
  tiktok: string;
  hours: string;
  colorBrand: string;
  colorChampagne: string;
  legalForm: string;
  siret: string;
  publisher: string;
  host: string;
  conditions: string;
  quoteFooter: string;
  quoteValidityDays: number;
  depositText: string;
  nextQuoteNumber: number;
}

export interface MediaAlt { [key: string]: string }

export interface Data {
  version: number;
  settings: Settings;
  prospects: Prospect[];
  quotes: Quote[];
  events: CalEvent[];
  catalog: CatalogItem[];
  services: SiteService[];
  tasks: Task[];
  expenses: Expense[];
  gallery: GalleryItem[];
  activity: Activity[];
  alts: MediaAlt;
}
