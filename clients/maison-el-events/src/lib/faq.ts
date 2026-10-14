import { PRICE_IDS } from './constants';
import { eur } from './format';
import type { Data } from './types';

const list = (names: string[]) => (names.length ? names.map((n, i) => (i ? n.charAt(0).toLowerCase() + n.slice(1) : n)).join(', ') : 'à compléter');

/** Remplace les variables {deco}, {coin}… par les valeurs actuelles du catalogue et des paramètres. */
export function faqText(text: string, d: Data): string {
  const price = (id: string) => { const p = d.catalog.find((c) => c.id === id)?.price; return p != null ? eur(p) : 'sur devis'; };
  const menu = (k: 'sucre' | 'sale' | 'mocktail') => list(d.catalog.filter((c) => c.menu === k && c.active).map((c) => c.name));
  const vars: Record<string, string> = {
    deco: price(PRICE_IDS.decoTable), coin: price(PRICE_IDS.coinMaries), sucree: price(PRICE_IDS.sucree), salee: price(PRICE_IDS.salee),
    boisson: price(PRICE_IDS.boisson), ville: d.settings.city, acompte: d.settings.depositText, tiktok: d.settings.tiktok ? `@${d.settings.tiktok}` : 'TikTok',
    'menu-sucre': menu('sucre'), 'menu-sale': menu('sale'), 'menu-mocktail': menu('mocktail'),
  };
  return text.replace(/\{([a-z-]+)\}/g, (m, k: string) => vars[k] ?? m);
}

export const FAQ_VARS = '{deco} {coin} {sucree} {salee} {boisson} {ville} {acompte} {menu-sucre} {menu-sale} {menu-mocktail} {tiktok}';

/** Infos pratiques : ce qui est renseigné, sinon « à confirmer ». */
export function practical(d: Data) {
  const s = d.settings;
  const known = s.openingHours.some((h) => h.hours.trim());
  return {
    hours: s.openingHours.map((h) => ({ day: h.day, value: h.hours.trim() || 'À confirmer', set: !!h.hours.trim() })),
    hoursKnown: known,
    rows: [
      { k: 'Prestations traiteur', v: s.cateringHours.trim() || 'Créneaux à confirmer', set: !!s.cateringHours.trim() },
      { k: 'Délai pour réserver', v: s.bookingLead.trim() || 'À confirmer', set: !!s.bookingLead.trim() },
      { k: 'Zone', v: `${s.zone || s.city} · déplacement sur devis`, set: true },
      { k: 'Acompte', v: s.depositText, set: true },
      { k: 'Contact', v: [s.phone, s.email, s.tiktok && `TikTok @${s.tiktok}`].filter(Boolean).join(' · ') || 'À compléter', set: !!(s.phone || s.email || s.tiktok) },
    ],
    pending: !known || !s.cateringHours.trim() || !s.bookingLead.trim(),
  };
}
