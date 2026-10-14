// Données initiales de démonstration. Tous les profils sont fictifs.
import { suggestedLines } from './calc';
import { PRICE_IDS } from './constants';
import { addDays, todayISO, uid } from './format';
import type { CalEvent, CatalogItem, Data, EventType, Expense, FaqItem, GalleryItem, Prospect, Quote, ServiceKey, SiteService, StageKey, Task } from './types';

export const DATA_VERSION = 5;

export function seedCatalog(): CatalogItem[] {
  const base = (o: Partial<CatalogItem> & Pick<CatalogItem, 'id' | 'name' | 'category' | 'price' | 'unit'>): CatalogItem => ({
    description: '', ingredients: '', allergens: '', active: true, ...o,
  });
  return [
    base({ id: PRICE_IDS.decoTable, name: 'Décoration de table', category: 'Décoration', price: 7.5, unit: 'par personne', description: 'Linge de table, vaisselle, décorations diverses, cartes de bienvenue ou de remerciement.', imageKey: 'svc-deco-tables' }),
    base({ id: PRICE_IDS.coinMaries, name: 'Coin mariés', category: 'Mariage', price: 60, unit: 'forfait', description: "Bougeoirs de plus d'un mètre, housses et draps du canapé de style henné.", imageKey: 'coin-maries' }),
    base({ id: PRICE_IDS.sucree, name: 'Mignardise sucrée', category: 'Mignardises sucrées', price: 1, unit: 'la pièce', description: 'Au choix parmi les mignardises sucrées du menu.' }),
    base({ id: PRICE_IDS.salee, name: 'Mignardise salée', category: 'Mignardises salées', price: 1, unit: 'la pièce', description: 'Au choix parmi les mignardises salées du menu.' }),
    base({ id: PRICE_IDS.boisson, name: 'Cocktail ou mocktail', category: 'Boissons', price: 4, unit: 'la pièce', description: 'Au choix parmi les mocktails du menu.' }),
    base({ id: PRICE_IDS.buffet, name: 'Décoration de buffet', category: 'Buffets', price: null, unit: 'sur devis', description: 'Mise en valeur des buffets sucrés et salés. Tarif établi sur devis.' }),
    base({ id: PRICE_IDS.location, name: "Location de matériel et d'éléments décoratifs", category: 'Location', price: null, unit: 'sur devis', description: 'Tarif établi sur devis selon le matériel.' }),
    base({ id: PRICE_IDS.traiteur, name: 'Prestation traiteur', category: 'Traiteur', price: null, unit: 'sur devis', description: 'Composition établie sur devis.' }),
    base({ id: PRICE_IDS.installation, name: 'Installation et déplacement', category: 'Frais', price: null, unit: 'sur devis', description: "Frais d'installation et de déplacement établis sur devis." }),
    // Menu — mignardises sucrées
    base({ id: 'm-bueno', name: 'Verrine Bueno', category: 'Mignardises sucrées', price: 1, unit: 'la pièce', ingredients: 'Bueno, chocolat, crème', menu: 'sucre' }),
    base({ id: 'm-citron', name: 'Verrine citron', category: 'Mignardises sucrées', price: 1, unit: 'la pièce', ingredients: 'Citron, crème, biscuit', menu: 'sucre' }),
    base({ id: 'm-speculos', name: 'Verrine spéculos', category: 'Mignardises sucrées', price: 1, unit: 'la pièce', ingredients: 'Spéculos, crème', menu: 'sucre' }),
    base({ id: 'm-fruits', name: 'Salade de fruits', category: 'Mignardises sucrées', price: 1, unit: 'la pièce', ingredients: 'Fruits frais de saison', menu: 'sucre' }),
    base({ id: 'm-fraise', name: 'Tartelettes fraise', category: 'Mignardises sucrées', price: 1, unit: 'la pièce', ingredients: 'Fraise, crème pâtissière, pâte sablée', menu: 'sucre' }),
    // Menu — mignardises salées
    base({ id: 'm-maki', name: 'Maki fromage concombre', category: 'Mignardises salées', price: 1, unit: 'la pièce', ingredients: 'Fromage frais, concombre', menu: 'sale' }),
    base({ id: 'm-wrap', name: 'Wraps saumon', category: 'Mignardises salées', price: 1, unit: 'la pièce', ingredients: 'Saumon fumé, fromage frais, oignon frit', menu: 'sale' }),
    base({ id: 'm-tomate', name: 'Salade tomate cerise et mozzarella', category: 'Mignardises salées', price: 1, unit: 'la pièce', ingredients: 'Tomate cerise, mozzarella, roquette, sauce balsamique', menu: 'sale' }),
    base({ id: 'm-hotdog', name: 'Mini hot-dog', category: 'Mignardises salées', price: 1, unit: 'la pièce', ingredients: 'Saucisse, sauce maison, oignon frit', menu: 'sale' }),
    base({ id: 'm-thon', name: 'Sandwich thon mayo', category: 'Mignardises salées', price: 1, unit: 'la pièce', ingredients: 'Thon, mayonnaise, salade', menu: 'sale' }),
    base({ id: 'm-burger', name: 'Mini burger cheddar', category: 'Mignardises salées', price: 1, unit: 'la pièce', ingredients: 'Pain, steak, cheddar, sauce maison', menu: 'sale' }),
    // Menu — mocktails
    base({ id: 'm-matcha', name: 'Matcha fraise', category: 'Boissons', price: 4, unit: 'la pièce', ingredients: 'Matcha, fraise, lait végétal', menu: 'mocktail' }),
    base({ id: 'm-the', name: 'Thé glacé pêche citron', category: 'Boissons', price: 4, unit: 'la pièce', ingredients: 'Thé noir, pêche, citron, sucre', menu: 'mocktail' }),
    base({ id: 'm-violette', name: 'Mocktail violet citron', category: 'Boissons', price: 4, unit: 'la pièce', ingredients: 'Citron, fleurs de violette, eau pétillante', menu: 'mocktail' }),
  ];
}

export function seedServices(): SiteService[] {
  return [
    { id: 'deco-tables', title: 'Décoration de tables', description: 'Linge de table, vaisselle, décorations diverses, cartes de bienvenue ou de remerciement.', priceNote: '7,50 € par personne', active: true, imageKey: 'svc-deco-tables' },
    { id: 'mariage', title: 'Décoration de mariage et espace mariés', description: "Mise en scène de votre réception et de l'espace des mariés. Le coin mariés comprend des bougeoirs de plus d'un mètre, les housses et les draps du canapé de style henné.", priceNote: 'Coin mariés : 60 €', active: true, imageKey: 'coin-maries' },
    { id: 'buffets', title: 'Décoration de buffets', description: 'Mise en valeur de vos buffets sucrés et salés, en accord avec la décoration de la salle.', priceNote: 'Sur devis', active: true, imageKey: 'svc-buffets' },
    { id: 'location', title: "Location de matériel et d'éléments décoratifs", description: 'Du matériel et des éléments décoratifs à louer pour composer votre événement.', priceNote: 'Sur devis', active: true, imageKey: 'svc-location' },
    { id: 'traiteur', title: 'Prestations traiteur', description: 'Une offre traiteur à composer selon votre événement et vos invités.', priceNote: 'Sur devis', active: true, imageKey: 'svc-traiteur' },
    { id: 'mignardises', title: 'Mignardises sucrées et salées', description: 'Verrines, tartelettes, makis, wraps, mini burgers… à choisir dans notre menu.', priceNote: '1 € la pièce', active: true, imageKey: 'menu-sucre' },
    { id: 'mocktails', title: 'Mocktails et boissons sans alcool', description: 'Matcha fraise, thé glacé pêche citron, mocktail violet citron.', priceNote: '4 € la pièce', active: true, imageKey: 'menu-mocktail' },
  ];
}

export const WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/**
 * Questions fréquentes construites uniquement à partir des informations communiquées par l'entreprise.
 * Les variables entre accolades sont remplacées à l'affichage par les valeurs du catalogue et des paramètres :
 * {deco} {coin} {sucree} {salee} {boisson} {ville} {acompte} {menu-sucre} {menu-sale} {menu-mocktail} {tiktok}.
 */
export function seedFaq(): FaqItem[] {
  const f = (id: string, q: string, a: string): FaqItem => ({ id, q, a, active: true });
  return [
    f('faq-prestations', 'Quelles prestations proposez-vous ?', 'Décoration de tables, décoration de mariage et espace mariés, décoration de buffets, location de matériel et d’éléments décoratifs, prestations traiteur, mignardises sucrées et salées, mocktails et boissons sans alcool.'),
    f('faq-table', 'Combien coûte la décoration de table ?', '{deco} par personne. Elle comprend le linge de table, la vaisselle, des décorations diverses et les cartes de bienvenue ou de remerciement.'),
    f('faq-coin', 'Que comprend le coin mariés ?', 'Le coin mariés est proposé à {coin}. Il comprend des bougeoirs de plus d’un mètre, ainsi que les housses et les draps du canapé de style henné.'),
    f('faq-prix', 'Quel est le prix des mignardises et des mocktails ?', 'Mignardises sucrées : {sucree} la pièce. Mignardises salées : {salee} la pièce. Cocktails et mocktails : {boisson} la pièce.'),
    f('faq-menu', 'Que contient le menu ?', 'Côté sucré : {menu-sucre}. Côté salé : {menu-sale}. Côté boissons : {menu-mocktail}.'),
    f('faq-mesure', 'Peut-on composer un menu sur mesure ?', 'Oui. Indiquez vos préférences et le nombre d’invités dans votre demande : la composition vous est proposée sur devis.'),
    f('faq-installation', 'L’installation et le déplacement sont-ils compris ?', 'Non. Les frais d’installation et de déplacement sont établis sur devis, selon le lieu de la réception.'),
    f('faq-devis', 'La décoration de buffet, la location et le traiteur ont-ils un prix fixe ?', 'Ces prestations sont établies sur devis, selon votre événement et le nombre d’invités.'),
    f('faq-acompte', 'Faut-il verser un acompte ?', '{acompte} Il permet de confirmer la réservation de votre date.'),
    f('faq-evenements', 'Pour quels événements intervenez-vous ?', 'Mariages, henné, fiançailles, anniversaires, baptêmes, baby showers, événements d’entreprise et autres réceptions.'),
    f('faq-zone', 'Où intervenez-vous ?', 'Maison EL Events est basée à {ville}. Pour une réception ailleurs, précisez le lieu dans votre demande : le déplacement est chiffré sur devis.'),
    f('faq-horaires', 'Quels sont vos horaires ?', 'Les horaires d’accueil et les créneaux des prestations traiteur sont indiqués dans la rubrique « Horaires et infos pratiques ». Vous pouvez envoyer une demande de devis à tout moment depuis le site.'),
    f('faq-obtenir', 'Comment obtenir un devis ?', 'Remplissez la demande en cinq étapes (événement, date et lieu, prestations, besoins, coordonnées) ou estimez d’abord votre budget avec le simulateur de la page Tarifs.'),
    f('faq-allergenes', 'Comment sont pris en compte les allergies et régimes alimentaires ?', 'Les ingrédients principaux sont indiqués dans le menu. Signalez toute allergie ou restriction alimentaire dans votre demande pour qu’elle soit prise en compte dans la proposition.'),
  ];
}

export function seedGallery(): GalleryItem[] {
  // Identifiants fixes : la photo de démonstration src/assets/demo/gal-<id>.jpg s'y rattache.
  const g = (id: string, title: string, category: GalleryItem['category'], art: GalleryItem['art'], description: string): GalleryItem => ({ id, title, category, art, description, imageKey: '' });
  return [
    g('table', 'Table de réception', 'Décoration de tables', 'table', 'Photo de démonstration : à remplacer par une photo de vos tables.'),
    g('arche', 'Arche de cérémonie', 'Mariages', 'arche', 'Photo de démonstration : à remplacer par une photo de mariage.'),
    g('buffet', 'Buffet sucré et salé', 'Buffets', 'buffet', 'Photo de démonstration : à remplacer par une photo de buffet.'),
    g('coin-maries', 'Coin mariés', 'Mariages', 'canape', 'Photo de démonstration : à remplacer par une photo du coin mariés.'),
    g('verrines', 'Verrines et tartelettes', 'Traiteur', 'verrine', 'Photo de démonstration : à remplacer par une photo de vos mignardises.'),
    g('mocktails', 'Mocktails', 'Traiteur', 'mocktail', 'Photo de démonstration : à remplacer par une photo de vos boissons.'),
    g('centre', 'Centre de table', 'Décoration de tables', 'table', 'Photo de démonstration : à remplacer par une photo de centre de table.'),
    g('bouchees', 'Bouchées salées', 'Buffets', 'mignardise', 'Photo de démonstration : à remplacer par une photo de plateau.'),
    g('anniversaire', 'Anniversaire', 'Événements privés', 'salon', 'Visuel temporaire : à remplacer par une photo d’événement privé.'),
  ];
}

interface PSeed {
  first: string; last: string; type: EventType; days: number | null; place: string; guests: number; services: ServiceKey[];
  stage: StageKey; createdDaysAgo: number; source: Prospect['source']; tags: string[]; next: string; nextIn: number | null; contactAgo: number | null; needs: string; budget?: string;
}

const P: PSeed[] = [
  { first: 'Inès', last: 'Morel', type: 'Mariage', days: 68, place: 'Orléans', guests: 120, services: ['deco-tables', 'mariage', 'mignardises'], stage: 'reservation', createdDaysAgo: 120, source: 'exemple', tags: ['Mariage', 'Grand format'], next: "Confirmer le nombre d'invités", nextIn: 20, contactAgo: 6, needs: 'Tons bordeaux et ivoire, table d’honneur.', budget: 'Environ 2 000 €' },
  { first: 'Sarah', last: 'Benali', type: 'Henné', days: 26, place: 'Saran', guests: 80, services: ['mariage', 'mignardises', 'mocktails'], stage: 'envoye', createdDaysAgo: 34, source: 'exemple', tags: ['Henné'], next: 'Relancer le devis', nextIn: 3, contactAgo: 4, needs: 'Coin mariés avec canapé, mocktails pour les invités.' },
  { first: 'Julie', last: 'Garnier', type: 'Anniversaire', days: 40, place: 'Olivet', guests: 35, services: ['deco-tables', 'mignardises'], stage: 'preparer', createdDaysAgo: 12, source: 'exemple', tags: ['Anniversaire', '30 ans'], next: 'Préparer le devis', nextIn: 2, contactAgo: 2, needs: 'Décoration champêtre, mignardises sucrées surtout.' },
  { first: 'Thomas', last: 'Lefèvre', type: "Événement d'entreprise", days: 55, place: 'Orléans', guests: 60, services: ['buffets', 'traiteur', 'mocktails'], stage: 'qualifier', createdDaysAgo: 8, source: 'exemple', tags: ['Entreprise'], next: 'Appeler pour qualifier le besoin', nextIn: 0, contactAgo: null, needs: 'Cocktail de fin d’année pour l’équipe.' },
  { first: 'Amina', last: 'Diallo', type: 'Baptême', days: 33, place: 'Fleury-les-Aubrais', guests: 50, services: ['deco-tables', 'buffets'], stage: 'nouveau', createdDaysAgo: 1, source: 'site', tags: [], next: 'Répondre à la demande', nextIn: 1, contactAgo: null, needs: 'Décoration blanche et dorée.' },
  { first: 'Camille', last: 'Roux', type: 'Baby shower', days: 19, place: 'Saint-Jean-de-Braye', guests: 25, services: ['mignardises', 'mocktails'], stage: 'nouveau', createdDaysAgo: 2, source: 'site', tags: [], next: 'Répondre à la demande', nextIn: 1, contactAgo: null, needs: 'Petit format, tons pastel.' },
  { first: 'Nora', last: 'Haddad', type: 'Fiançailles', days: 47, place: 'Orléans', guests: 70, services: ['deco-tables', 'mariage'], stage: 'relance', createdDaysAgo: 22, source: 'exemple', tags: ['Fiançailles'], next: 'Relancer le devis envoyé', nextIn: -1, contactAgo: 9, needs: 'Ambiance chic, beaucoup de bougies.' },
  { first: 'Léa', last: 'Fontaine', type: 'Mariage', days: -12, place: 'Orléans', guests: 100, services: ['deco-tables', 'mariage', 'mocktails'], stage: 'termine', createdDaysAgo: 150, source: 'exemple', tags: ['Mariage'], next: 'Demander un avis', nextIn: 2, contactAgo: 10, needs: 'Mariage en blanc et champagne.' },
  { first: 'Yasmine', last: 'Belkacem', type: 'Anniversaire', days: -30, place: 'Olivet', guests: 40, services: ['deco-tables', 'mignardises'], stage: 'termine', createdDaysAgo: 75, source: 'exemple', tags: ['Anniversaire'], next: '', nextIn: null, contactAgo: 28, needs: 'Anniversaire surprise.' },
  { first: 'Hugo', last: 'Marchand', type: 'Autre', days: 80, place: '', guests: 30, services: ['traiteur', 'mignardises'], stage: 'qualifier', createdDaysAgo: 5, source: 'exemple', tags: ['Communion'], next: 'Préciser le lieu de réception', nextIn: 2, contactAgo: 3, needs: 'Communion, repas en famille.' },
  { first: 'Manon', last: 'Petit', type: 'Mariage', days: 120, place: 'Orléans', guests: 150, services: ['deco-tables', 'mariage', 'mignardises', 'mocktails'], stage: 'nouveau', createdDaysAgo: 3, source: 'simulation', tags: ['Simulation'], next: 'Proposer un échange', nextIn: 2, contactAgo: null, needs: 'Simulation enregistrée depuis la page Tarifs.' },
];

export function seed(): Data {
  const today = todayISO();
  const now = Date.now();
  const catalog = seedCatalog();
  const prospects: Prospect[] = [];
  const quotes: Quote[] = [];
  const events: CalEvent[] = [];
  let n = 1;

  for (const s of P) {
    const id = uid('p');
    const created = now - s.createdDaysAgo * 864e5;
    const slug = `${s.first}.${s.last}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const p: Prospect = {
      id, firstName: s.first, lastName: s.last, email: `${slug}@exemple.test`, phone: `06 00 00 00 ${String(n).padStart(2, '0')}`,
      eventType: s.type, eventDate: s.days == null ? '' : addDays(today, s.days), place: s.place, guests: s.guests, services: s.services,
      budget: s.budget ?? '', needs: s.needs, tags: s.tags, notes: [], stage: s.stage, nextAction: s.next,
      nextActionDate: s.nextIn == null ? '' : addDays(today, s.nextIn), lastContact: s.contactAgo == null ? '' : addDays(today, -s.contactAgo),
      createdAt: created, source: s.source, inspirationIds: [], fictif: true,
      history: [{ id: uid('h'), at: created, text: s.source === 'site' ? 'Demande reçue depuis le formulaire du site (exemple).' : s.source === 'simulation' ? 'Simulation enregistrée depuis la page Tarifs (exemple).' : 'Fiche créée (exemple).' }],
    };
    if (s.first === 'Inès') p.notes.push({ id: uid('n'), at: created + 864e5, text: 'Souhaite voir une table témoin avant de valider les couleurs.' });
    if (s.first === 'Nora') p.notes.push({ id: uid('n'), at: now - 9 * 864e5, text: 'Hésite entre deux dates, relancer en fin de semaine.' });
    prospects.push(p);

    if (['envoye', 'relance', 'reservation', 'termine'].includes(s.stage)) {
      const status: Quote['status'] = s.stage === 'reservation' || s.stage === 'termine' ? 'accepte' : 'envoye';
      const qid = uid('q');
      const qCreated = now - Math.max(1, s.createdDaysAgo - 5) * 864e5;
      quotes.push({
        id: qid, number: `DEV-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`, prospectId: id, eventType: s.type, eventDate: p.eventDate,
        guests: s.guests, lines: suggestedLines(catalog, p), extraFees: "Frais d'installation et de déplacement : sur devis.",
        conditions: 'Un acompte peut être demandé pour confirmer la réservation.', notes: '', status, createdAt: qCreated, updatedAt: qCreated,
      });
      p.history.push({ id: uid('h'), at: qCreated, text: `Devis ${quotes[quotes.length - 1].number} créé (simulation).` });
      n++;
    }
    if (s.stage === 'reservation' || s.stage === 'termine' || s.stage === 'envoye' || s.stage === 'relance') {
      events.push({
        id: uid('e'), prospectId: id, title: `${s.type} — ${s.first} ${s.last}`, date: p.eventDate, time: '', place: s.place, guests: s.guests, notes: '',
        status: s.stage === 'termine' ? 'termine' : s.stage === 'reservation' ? 'confirme' : 'option',
      });
    }
  }

  const pid = (first: string) => prospects.find((p) => p.firstName === first)!.id;
  const tasks: Task[] = [
    { id: uid('t'), title: 'Relancer Nora Haddad au sujet du devis', prospectId: pid('Nora'), due: addDays(today, -1), priority: 'haute', kind: 'relance', done: false, createdAt: now - 3 * 864e5 },
    { id: uid('t'), title: 'Appeler Thomas Lefèvre pour qualifier le besoin', prospectId: pid('Thomas'), due: today, priority: 'normale', kind: 'appel', done: false, createdAt: now - 864e5 },
    { id: uid('t'), title: 'Préparer le devis de Julie Garnier', prospectId: pid('Julie'), due: addDays(today, 2), priority: 'normale', kind: 'tache', done: false, createdAt: now - 864e5 },
    { id: uid('t'), title: 'Relance devis henné — Sarah Benali', prospectId: pid('Sarah'), due: addDays(today, 3), priority: 'haute', kind: 'relance', done: false, createdAt: now - 2 * 864e5 },
    { id: uid('t'), title: "Confirmer le nombre d'invités avec Inès Morel", prospectId: pid('Inès'), due: addDays(today, 20), priority: 'basse', kind: 'appel', done: false, createdAt: now - 5 * 864e5 },
    { id: uid('t'), title: 'Remercier Léa Fontaine et demander un avis', prospectId: pid('Léa'), due: addDays(today, -3), priority: 'normale', kind: 'relance', done: true, createdAt: now - 10 * 864e5 },
  ];

  const ev = (first: string) => events.find((e) => e.prospectId === pid(first))?.id ?? null;
  const ex = (label: string, amount: number, category: Expense['category'], first: string, daysAgo: number): Expense => ({ id: uid('x'), label, amount, category, eventId: ev(first), date: addDays(today, -daysAgo) });
  const expenses: Expense[] = [
    ex('Fleurs fraîches', 180, 'Fleurs et décor', 'Léa', 14),
    ex('Ingrédients mocktails', 95, 'Matières premières', 'Léa', 13),
    ex('Carburant et péage', 38, 'Transport', 'Léa', 12),
    ex('Bougies et petits décors', 64, 'Fleurs et décor', 'Yasmine', 31),
    ex('Ingrédients mignardises', 72, 'Matières premières', 'Yasmine', 31),
    ex('Fleurs et feuillages', 210, 'Fleurs et décor', 'Inès', 2),
  ];

  const activity: Data['activity'] = [
    { id: uid('a'), at: now - 864e5, text: 'Nouvelle demande du site : Amina Diallo (baptême, exemple).', kind: 'demande' },
    { id: uid('a'), at: now - 2 * 864e5, text: 'Nouvelle demande du site : Camille Roux (baby shower, exemple).', kind: 'demande' },
    { id: uid('a'), at: now - 3 * 864e5, text: 'Simulation enregistrée : Manon Petit (mariage, exemple).', kind: 'demande' },
    { id: uid('a'), at: now - 4 * 864e5, text: 'Devis envoyé à Sarah Benali (simulation).', kind: 'devis' },
  ];

  return {
    version: DATA_VERSION,
    settings: {
      businessName: 'Maison EL Events', tagline: 'Décoration événementielle & traiteur', city: 'Orléans',
      email: '', phone: '', address: '', instagram: '', tiktok: 'maisonelevents',
      openingHours: WEEK.map((day) => ({ day, hours: '' })), cateringHours: '', bookingLead: '', zone: 'Orléans',
      colorBrand: '#EB516D', colorChampagne: '#D9B46A',
      legalForm: '', siret: '', publisher: '', host: '',
      conditions: "Les tarifs s'appliquent aux prestations listées. Les frais d'installation et de déplacement sont établis sur devis. Un acompte peut être demandé pour confirmer la réservation.",
      quoteFooter: 'Devis établi par Maison EL Events, Orléans.',
      quoteValidityDays: 0, depositText: 'Un acompte peut être demandé.', nextQuoteNumber: n,
    },
    prospects, quotes, events, catalog, services: seedServices(), tasks, expenses, gallery: seedGallery(), activity, faq: seedFaq(), alts: {},
  };
}
