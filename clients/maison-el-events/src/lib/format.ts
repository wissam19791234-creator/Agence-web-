export const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const eurFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eurRound = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/** 7,50 € ; les montants ronds restent sans décimales quand `round` est vrai. */
export function eur(n: number, round = false): string {
  if (round || Number.isInteger(n)) return round ? eurRound.format(n) : eurFmt.format(n).replace(',00', '');
  return eurFmt.format(n);
}

export function todayISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISO(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  if (!iso) return 'Date à définir';
  return parseISO(iso).toLocaleDateString('fr-FR', opts);
}

export const fmtShort = (iso: string) => fmtDate(iso, { day: 'numeric', month: 'short' });

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Nombre de jours entre aujourd'hui et la date (négatif si passée). */
export function daysFromToday(iso: string): number | null {
  if (!iso) return null;
  const a = parseISO(todayISO()).getTime(), b = parseISO(iso).getTime();
  return Math.round((b - a) / 864e5);
}

export function ago(ts: number): string {
  const m = Math.round((Date.now() - ts) / 6e4);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'hier' : `il y a ${d} jours`;
}

export const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim() || 'Sans nom';

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
}

export function isPhone(s: string): boolean {
  const digits = s.replace(/[^\d+]/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export function hexToRgbTriplet(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function shadeTriplet(hex: string, f: number): string | null {
  const t = hexToRgbTriplet(hex);
  if (!t) return null;
  return t.split(' ').map((v) => {
    const x = Number(v);
    const y = f >= 0 ? x + (255 - x) * f : x * (1 + f);
    return Math.round(Math.max(0, Math.min(255, y)));
  }).join(' ');
}
