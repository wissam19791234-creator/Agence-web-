import { useEffect, useRef, useState, type ReactNode } from 'react';

// Couleurs de données validées (contraste, daltonisme) sur fond blanc.
// Fond noir : une seule couleur chromatique (corail) et un neutre clair, séparés de plus de 22 ΔE (contrôlé).
export const DATA_COLORS = { a: '#EB516D', b: '#D9D9D9' };
const SINGLE = '#E6E6E6';
const GRID = '#262626', AXIS = '#808080', INK = '#FFFFFF', INK2 = '#A3A3A3';

function useWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    setW(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

const compact = (v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k` : v.toLocaleString('fr-FR'));

function Tip({ x, y, children, w }: { x: number; y: number; children: ReactNode; w: number }) {
  const left = Math.max(4, Math.min(x - 70, w - 144));
  return <div className="pointer-events-none absolute z-10 w-[140px] bg-white px-3 py-2 text-xs text-black" style={{ left, top: Math.max(0, y - 58) }}>{children}</div>;
}

function TableView({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-2 text-xs text-brun-2">
      <summary className="cursor-pointer select-none text-brun-3 hover:text-brand">Voir les données en tableau</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr>{head.map((h) => <th key={h} className="border-b border-line py-1.5 pr-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-line/60 py-1.5 pr-3 tabular-nums">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}

/** Colonnes à une série (évolution dans le temps). */
export function ColumnChart({ data, height = 200, unit = '' }: { data: { label: string; value: number }[]; height?: number; unit?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 30, padB = 26, padT = 18, max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const iw = Math.max(0, w - padL - 6), ih = height - padB - padT, band = data.length ? iw / data.length : 0, bw = Math.min(24, band * 0.5);
  const ticks = [0, max / 2, max];
  const last = data.length - 1;
  return (
    <div ref={ref} className="relative">
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label={`Graphique en colonnes : ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
          {ticks.map((t) => { const y = padT + ih - (t / max) * ih; return <g key={t}><line x1={padL} x2={w - 6} y1={y} y2={y} stroke={GRID} /><text x={padL - 6} y={y + 4} textAnchor="end" fontSize="11" fill={AXIS}>{compact(t)}</text></g>; })}
          {data.map((d, i) => {
            const h = (d.value / max) * ih, x = padL + band * i + (band - bw) / 2, y = padT + ih - h;
            const r = Math.min(4, h);
            return (
              <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${d.label} : ${d.value}${unit}`}>
                <rect x={padL + band * i} y={padT} width={band} height={ih} fill="transparent" />
                {h > 0 && <path d={`M${x},${padT + ih} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${padT + ih} Z`} fill={SINGLE} opacity={hover == null || hover === i ? 1 : 0.45} />}
                <text x={padL + band * i + band / 2} y={height - 8} textAnchor="middle" fontSize="11" fill={AXIS}>{d.label}</text>
                {i === last && <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill={INK}>{d.value}</text>}
              </g>
            );
          })}
          <line x1={padL} x2={w - 6} y1={padT + ih} y2={padT + ih} stroke="#444444" />
        </svg>
      )}
      {hover != null && w > 0 && <Tip w={w} x={padL + band * hover + band / 2} y={padT + ih - (data[hover].value / max) * ih}><b className="block font-medium">{data[hover].label}</b>{data[hover].value}{unit}</Tip>}
      <TableView head={['Période', 'Valeur']} rows={data.map((d) => [d.label, d.value])} />
    </div>
  );
}

/** Barres horizontales à une série (répartition par catégorie). */
export function BarList({ data, format = (v: number) => String(v) }: { data: { label: string; value: number }[]; format?: (v: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (!data.length) return <p className="text-sm text-brun-3">Aucune donnée pour le moment.</p>;
  return (
    <div>
      <ul className="space-y-3">
        {data.map((d) => (
          <li key={d.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 text-[13px]">
            <span className="truncate text-brun-2">{d.label}</span>
            <span className="tabular-nums font-medium text-brun">{format(d.value)}</span>
            <span className="col-span-2 h-2 rounded-full bg-[#1F1F1F]">
              <span className="block h-2 rounded-r-full rounded-l-sm transition-[width] duration-500" style={{ width: `${(d.value / max) * 100}%`, background: SINGLE }} />
            </span>
          </li>
        ))}
      </ul>
      <TableView head={['Catégorie', 'Valeur']} rows={data.map((d) => [d.label, format(d.value)])} />
    </div>
  );
}

/** Deux séries côte à côte (recettes / dépenses), avec légende. */
export function PairBars({ data, a, b, format }: { data: { label: string; a: number; b: number }[]; a: string; b: string; format: (v: number) => string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 220, padL = 40, padB = 30, padT = 14;
  const max = niceMax(Math.max(1, ...data.flatMap((d) => [d.a, d.b])));
  const iw = Math.max(0, w - padL - 6), ih = height - padB - padT, band = data.length ? iw / data.length : 0, bw = Math.min(22, band * 0.3);
  const col = (x: number, v: number, c: string, op: number) => {
    const h = (v / max) * ih, y = padT + ih - h, r = Math.min(4, h);
    return h > 0 ? <path d={`M${x},${padT + ih} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${padT + ih} Z`} fill={c} opacity={op} /> : null;
  };
  return (
    <div ref={ref} className="relative">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-brun-2">
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: DATA_COLORS.a }} />{a}</span>
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: DATA_COLORS.b }} />{b}</span>
      </div>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label={`${a} et ${b} par événement`}>
          {[0, max / 2, max].map((t) => { const y = padT + ih - (t / max) * ih; return <g key={t}><line x1={padL} x2={w - 6} y1={y} y2={y} stroke={GRID} /><text x={padL - 6} y={y + 4} textAnchor="end" fontSize="11" fill={AXIS}>{compact(t)}</text></g>; })}
          {data.map((d, i) => {
            const x0 = padL + band * i + band / 2 - bw - 1, op = hover == null || hover === i ? 1 : 0.55;
            return (
              <g key={d.label} tabIndex={0} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} aria-label={`${d.label} : ${a} ${format(d.a)}, ${b} ${format(d.b)}`}>
                <rect x={padL + band * i} y={padT} width={band} height={ih} fill="transparent" />
                {col(x0, d.a, DATA_COLORS.a, op)}
                {col(x0 + bw + 2, d.b, DATA_COLORS.b, op)}
                <text x={padL + band * i + band / 2} y={height - 10} textAnchor="middle" fontSize="11" fill={INK2}>{d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label}</text>
              </g>
            );
          })}
          <line x1={padL} x2={w - 6} y1={padT + ih} y2={padT + ih} stroke="#444444" />
        </svg>
      )}
      {hover != null && w > 0 && <Tip w={w} x={padL + band * hover + band / 2} y={padT + ih - (Math.max(data[hover].a, data[hover].b) / max) * ih}><b className="block font-medium">{data[hover].label}</b>{a} : {format(data[hover].a)}<br />{b} : {format(data[hover].b)}</Tip>}
      <TableView head={['Événement', a, b]} rows={data.map((d) => [d.label, format(d.a), format(d.b)])} />
    </div>
  );
}
