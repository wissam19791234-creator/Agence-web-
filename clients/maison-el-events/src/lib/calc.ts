import { PRICE_IDS } from './constants';
import { uid } from './format';
import type { CatalogItem, Prospect, Quote, QuoteLine } from './types';

export const lineTotal = (l: QuoteLine): number | null => (l.unitPrice == null ? null : Math.round(l.qty * l.unitPrice * 100) / 100);

export function quoteTotals(q: Pick<Quote, 'lines'>) {
  let known = 0, unpriced = 0;
  for (const l of q.lines) {
    const t = lineTotal(l);
    if (t == null) unpriced++;
    else known += t;
  }
  return { known: Math.round(known * 100) / 100, unpriced };
}

export const priceOf = (catalog: CatalogItem[], id: string): number | null => catalog.find((c) => c.id === id)?.price ?? null;

export interface SimInput {
  guests: number;
  sweet: number;
  savory: number;
  drinks: number;
  coin: boolean;
}

/** Total connu = invités × déco + mignardises × prix + boissons × prix + coin mariés. */
export function simulate(catalog: CatalogItem[], s: SimInput) {
  const p = {
    deco: priceOf(catalog, PRICE_IDS.decoTable) ?? 0,
    sweet: priceOf(catalog, PRICE_IDS.sucree) ?? 0,
    savory: priceOf(catalog, PRICE_IDS.salee) ?? 0,
    drink: priceOf(catalog, PRICE_IDS.boisson) ?? 0,
    coin: priceOf(catalog, PRICE_IDS.coinMaries) ?? 0,
  };
  const rows = [
    { id: PRICE_IDS.decoTable, label: 'Décoration de table', qty: s.guests, unit: p.deco, total: s.guests * p.deco, unitLabel: 'par personne' },
    { id: PRICE_IDS.sucree, label: 'Mignardises sucrées', qty: s.sweet, unit: p.sweet, total: s.sweet * p.sweet, unitLabel: 'la pièce' },
    { id: PRICE_IDS.salee, label: 'Mignardises salées', qty: s.savory, unit: p.savory, total: s.savory * p.savory, unitLabel: 'la pièce' },
    { id: PRICE_IDS.boisson, label: 'Cocktails et mocktails', qty: s.drinks, unit: p.drink, total: s.drinks * p.drink, unitLabel: 'la pièce' },
    { id: PRICE_IDS.coinMaries, label: 'Coin mariés', qty: s.coin ? 1 : 0, unit: p.coin, total: s.coin ? p.coin : 0, unitLabel: 'forfait' },
  ].map((r) => ({ ...r, total: Math.round(r.total * 100) / 100 }));
  const total = Math.round(rows.reduce((a, r) => a + r.total, 0) * 100) / 100;
  return { rows, total, prices: p };
}

function lineFrom(catalog: CatalogItem[], id: string, qty: number, labelOverride?: string): QuoteLine | null {
  const c = catalog.find((x) => x.id === id);
  if (!c) return null;
  return { id: uid('l'), catalogId: c.id, label: labelOverride ?? c.name, qty, unitPrice: c.price, unit: c.unit };
}

/** Lignes proposées à partir des prestations demandées. Les quantités sont à ajuster. */
export function suggestedLines(catalog: CatalogItem[], p: Pick<Prospect, 'services' | 'guests'>): QuoteLine[] {
  const g = p.guests && p.guests > 0 ? p.guests : 1;
  const out: (QuoteLine | null)[] = [];
  const has = (k: string) => p.services.includes(k as never);
  if (has('deco-tables')) out.push(lineFrom(catalog, PRICE_IDS.decoTable, g));
  if (has('mariage')) out.push(lineFrom(catalog, PRICE_IDS.coinMaries, 1));
  if (has('mignardises')) {
    out.push(lineFrom(catalog, PRICE_IDS.sucree, g));
    out.push(lineFrom(catalog, PRICE_IDS.salee, g));
  }
  if (has('mocktails')) out.push(lineFrom(catalog, PRICE_IDS.boisson, g));
  if (has('buffets')) out.push(lineFrom(catalog, PRICE_IDS.buffet, 1));
  if (has('location')) out.push(lineFrom(catalog, PRICE_IDS.location, 1));
  if (has('traiteur')) out.push(lineFrom(catalog, PRICE_IDS.traiteur, 1));
  out.push(lineFrom(catalog, PRICE_IDS.installation, 1));
  return out.filter((x): x is QuoteLine => !!x);
}

/** Montant estimé d'un prospect : dernier devis, sinon estimation à partir des tarifs connus. */
export function estimateFor(p: Prospect, quotes: Quote[], catalog: CatalogItem[]): { amount: number; fromQuote: boolean } {
  const qs = quotes.filter((q) => q.prospectId === p.id && q.status !== 'refuse').sort((a, b) => b.updatedAt - a.updatedAt);
  if (qs[0]) return { amount: quoteTotals(qs[0]).known, fromQuote: true };
  const lines = suggestedLines(catalog, p);
  return { amount: quoteTotals({ lines }).known, fromQuote: false };
}
