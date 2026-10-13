import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { hexToRgbTriplet, shadeTriplet } from './format';
import { DATA_VERSION, seed } from './seed';
import type { Data } from './types';

const KEY = 'mel-demo-data';

function loadData(): { data: Data; ok: boolean } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as Data;
      if (d && d.version === DATA_VERSION && Array.isArray(d.prospects)) return { data: d, ok: true };
    }
    return { data: seed(), ok: true };
  } catch {
    return { data: seed(), ok: false };
  }
}

interface Store {
  data: Data;
  /** Applique une modification sur une copie des données, puis enregistre localement. */
  update: (fn: (d: Data) => void) => void;
  reset: () => void;
  storageOk: boolean;
}

const Ctx = createContext<Store | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const first = useRef(loadData());
  const [data, setData] = useState<Data>(first.current.data);
  const [storageOk, setStorageOk] = useState(first.current.ok);

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(data)); setStorageOk(true); } catch { setStorageOk(false); }
    }, 150);
    return () => clearTimeout(t);
  }, [data]);

  // Couleurs de la marque modifiables dans les paramètres.
  useEffect(() => {
    const r = document.documentElement.style;
    const b = hexToRgbTriplet(data.settings.colorBrand), c = hexToRgbTriplet(data.settings.colorChampagne);
    if (b) { r.setProperty('--brand', b); r.setProperty('--brand-soft', shadeTriplet(data.settings.colorBrand, -0.86)!); r.setProperty('--brand-deep', shadeTriplet(data.settings.colorBrand, 0.18)!); }
    if (c) { r.setProperty('--champagne', c); r.setProperty('--champagne-deep', c); }
  }, [data.settings.colorBrand, data.settings.colorChampagne]);

  // Application synchrone : les identifiants créés dans `fn` sont disponibles dès le retour.
  const current = useRef<Data>(data);
  const update = useCallback((fn: (d: Data) => void) => {
    const d = structuredClone(current.current);
    fn(d);
    current.current = d;
    setData(d);
  }, []);
  const reset = useCallback(() => { const s = seed(); current.current = s; setData(s); }, []);
  const value = useMemo(() => ({ data, update, reset, storageOk }), [data, update, reset, storageOk]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('DataProvider manquant');
  return s;
}
