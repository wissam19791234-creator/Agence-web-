import { useRef, useState } from 'react';
import { useImages } from '../lib/images';
import type { ArtKind } from '../lib/types';
import { Icon } from './Icon';
import { Button, cx, useToast } from './ui';

// Illustrations au trait, utilisées tant que la propriétaire n'a pas importé ses photos.
const G = '#B79C78', B = '#65172D', S = '#9B7B5C';
function Art({ kind }: { kind: ArtKind }) {
  const common = { fill: 'none', stroke: G, strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const flowers = (cx: number, cy: number, r = 9) => (
    <g>
      {[[-1, 0], [1, 0], [0, -1], [-0.6, 0.8], [0.7, 0.8]].map(([dx, dy], i) => (
        <g key={i}>
          <circle cx={cx + dx * r * 1.4} cy={cy + dy * r * 1.2} r={r} fill={i % 2 ? '#F1E3D3' : '#EBD3CF'} stroke={S} strokeWidth=".8" />
          <circle cx={cx + dx * r * 1.4} cy={cy + dy * r * 1.2} r={r * 0.45} fill="none" stroke={B} strokeOpacity=".45" strokeWidth=".8" />
        </g>
      ))}
    </g>
  );
  switch (kind) {
    case 'table':
      return (
        <g>
          <ellipse cx="200" cy="168" rx="150" ry="58" {...common} fill="#FFFCF8" />
          <ellipse cx="200" cy="168" rx="138" ry="50" {...common} strokeOpacity=".5" />
          {[-110, -55, 0, 55, 110].map((x, i) => (
            <g key={i}>
              <ellipse cx={200 + x} cy={i % 2 ? 196 : 140} rx="17" ry="7" {...common} fill="#fff" />
              <ellipse cx={200 + x} cy={i % 2 ? 196 : 140} rx="10" ry="4" {...common} strokeOpacity=".6" />
            </g>
          ))}
          {flowers(200, 160, 8)}
          {[150, 250].map((x) => <g key={x}><path d={`M${x} 166V120`} {...common} /><path d={`M${x - 12} 124h24`} {...common} /><path d={`M${x - 12} 124v-14M${x} 120v-18M${x + 12} 124v-14`} {...common} /><circle cx={x} cy="98" r="2.5" fill="#E9B866" /><circle cx={x - 12} cy="106" r="2.2" fill="#E9B866" /><circle cx={x + 12} cy="106" r="2.2" fill="#E9B866" /></g>)}
        </g>
      );
    case 'arche':
      return (
        <g>
          <path d="M120 250V130a80 80 0 0 1 160 0v120" {...common} strokeWidth="2" />
          <path d="M132 250V132a68 68 0 0 1 136 0v118" {...common} strokeOpacity=".5" />
          {flowers(132, 120, 10)}{flowers(178, 64, 9)}{flowers(262, 140, 10)}
          <path d="M80 250h240" {...common} />
          {[150, 200, 250].map((x) => <path key={x} d={`M${x - 10} 250v-26h20v26M${x - 12} 224h24`} {...common} strokeOpacity=".7" />)}
        </g>
      );
    case 'buffet':
      return (
        <g>
          <path d="M70 200h260M90 200v52M310 200v52" {...common} strokeWidth="1.8" />
          <path d="M70 200c20 18 40 18 60 0s40 18 60 0 40 18 60 0 40 18 60 0 40 18 60 0" {...common} strokeOpacity=".6" />
          <path d="M120 200v-18h50v18M110 182h70M145 182v-36M125 146h40" {...common} />
          <path d="M215 200v-40h60v40M210 160h70M222 160v-22h46v22M232 138v-16h26v16" {...common} />
          <circle cx="245" cy="116" r="5" fill="#EBD3CF" stroke={S} strokeWidth=".8" />
          {[130, 145, 160].map((x) => <circle key={x} cx={x} cy="141" r="5" fill="#F1E3D3" stroke={S} strokeWidth=".8" />)}
          {flowers(300, 178, 7)}
        </g>
      );
    case 'verrine':
    case 'mignardise':
      return (
        <g>
          <path d="M60 230h280" {...common} />
          {[110, 170, 230, 290].map((x, i) => (
            <g key={x}>
              <path d={`M${x - 20} ${i % 2 ? 150 : 140}h40l-5 80h-30z`} {...common} fill="#FFFCF8" />
              <path d={`M${x - 18} ${i % 2 ? 185 : 175}h36`} stroke={B} strokeOpacity=".35" strokeWidth="9" />
              <path d={`M${x - 17} ${i % 2 ? 203 : 196}h34`} stroke="#E8C9A5" strokeWidth="9" />
              <circle cx={x} cy={i % 2 ? 162 : 152} r="5" fill={i % 2 ? '#EBD3CF' : '#E9B866'} />
            </g>
          ))}
        </g>
      );
    case 'mocktail':
      return (
        <g>
          <path d="M60 240h280" {...common} />
          {[130, 200, 270].map((x, i) => (
            <g key={x}>
              <path d={`M${x - 26} 120h52l-8 116h-36z`} {...common} fill="#FFFCF8" />
              <path d={`M${x - 23} 150h46l-6 82h-34z`} fill={['#EBD3CF', '#F2DDB0', '#D9CBE8'][i]} fillOpacity=".8" stroke="none" />
              <path d={`M${x + 8} 120l18-34`} stroke={B} strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" />
              <circle cx={x - 10} cy="128" r="9" fill="#F7E7A6" stroke={S} strokeWidth=".8" />
            </g>
          ))}
        </g>
      );
    case 'canape':
      return (
        <g>
          <path d="M100 210v-50a20 20 0 0 1 20-20h160a20 20 0 0 1 20 20v50" {...common} strokeWidth="1.8" />
          <path d="M84 180a16 16 0 0 1 32 0v50h168v-50a16 16 0 0 1 32 0v56H84z" {...common} fill="#FFFCF8" strokeWidth="1.8" />
          <path d="M130 196h140" {...common} strokeOpacity=".5" />
          {[56, 344].map((x) => <g key={x}><path d={`M${x} 236V96`} {...common} strokeWidth="1.6" /><path d={`M${x - 12} 236h24M${x - 8} 96h16`} {...common} /><rect x={x - 5} y="70" width="10" height="26" fill="#fff" stroke={G} /><circle cx={x} cy="62" r="4" fill="#E9B866" /></g>)}
          {flowers(200, 128, 8)}
        </g>
      );
    case 'salon':
    default:
      return (
        <g>
          <path d="M70 230h260" {...common} />
          <path d="M150 230v-60h100v60M140 170h120" {...common} />
          <path d="M175 170v-28h50v28M170 142h60M200 142v-20" {...common} />
          <circle cx="200" cy="116" r="4" fill="#E9B866" />
          {[[96, 96], [128, 70], [272, 74], [306, 104]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="18" fill={i % 2 ? '#F1E3D3' : '#EBD3CF'} stroke={S} strokeWidth=".8" /><path d={`M${x} ${y + 18}q4 30-6 60`} {...common} strokeOpacity=".6" /></g>)}
        </g>
      );
  }
}

export function ArtSvg({ kind, className }: { kind: ArtKind; className?: string }) {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`bg-${kind}`} cx="50%" cy="40%" r="80%"><stop offset="0" stopColor="#FFFCF8" /><stop offset="1" stopColor="#EADDCB" /></radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#bg-${kind})`} />
      <rect x="14" y="14" width="372" height="272" fill="none" stroke={G} strokeOpacity=".35" />
      <Art kind={kind} />
    </svg>
  );
}

/** Emplacement d'image : photo importée si elle existe, sinon visuel temporaire signalé comme tel. */
export function Visual({ imageKey, art, alt, className, badge = true, rounded = 'rounded-2xl' }: { imageKey?: string; art: ArtKind; alt: string; className?: string; badge?: boolean; rounded?: string }) {
  const { get } = useImages();
  const url = get(imageKey);
  return (
    <div className={cx('relative overflow-hidden bg-ivoire', rounded, className)}>
      {url ? <img src={url} alt={alt} className="h-full w-full object-cover" loading="lazy" decoding="async" /> : (
        <>
          <ArtSvg kind={art} className="h-full w-full" />
          <span className="sr-only">{alt} (visuel temporaire)</span>
          {badge && <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[.14em] text-brun-2 ring-1 ring-line">Visuel temporaire</span>}
        </>
      )}
    </div>
  );
}

/** Import / remplacement / suppression d'une photo pour un emplacement donné. */
export function ImageSlotEditor({ imageKey, art, label }: { imageKey: string; art: ArtKind; label: string }) {
  const { get, set, remove } = useImages();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const has = !!get(imageKey);
  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try { await set(imageKey, f); toast(`Photo « ${label} » enregistrée.`); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return (
    <div className="rounded-2xl border border-line bg-white p-3">
      <Visual imageKey={imageKey} art={art} alt={label} className="aspect-[4/3]" rounded="rounded-xl" />
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-brun">{label}</p>
          <p className="text-xs text-brun-3">{has ? 'Photo importée' : 'Visuel temporaire'}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label={`Importer une photo pour ${label}`} />
          <Button size="sm" variant="secondary" icon="upload" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Import…' : has ? 'Remplacer' : 'Importer'}</Button>
          {has && <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-brun-3 hover:bg-[#F8E7E7] hover:text-danger" aria-label={`Retirer la photo ${label}`} onClick={() => { remove(imageKey); toast('Photo retirée : le visuel temporaire est rétabli.', 'info'); }}><Icon name="trash" className="h-4 w-4" /></button>}
        </div>
      </div>
    </div>
  );
}
