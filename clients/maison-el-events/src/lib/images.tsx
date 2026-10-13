// Photos importées par la propriétaire : compressées puis gardées dans le navigateur (IndexedDB).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const DB = 'mel-media', STORE = 'images';
let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((res, rej) => {
      try {
        const r = indexedDB.open(DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(STORE);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  }
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export const MAX_UPLOAD_MB = 15;

/** Redimensionne (1600 px max) et compresse en JPEG pour garder le navigateur léger. */
export function compressImage(file: File, max = 1600, quality = 0.82): Promise<string> {
  return new Promise((res, rej) => {
    if (!file.type.startsWith('image/')) return rej(new Error('Ce fichier n’est pas une image. Choisissez un fichier JPG, PNG ou WebP.'));
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return rej(new Error(`Image trop lourde (plus de ${MAX_UPLOAD_MB} Mo). Choisissez une image plus légère.`));
    const reader = new FileReader();
    reader.onerror = () => rej(new Error('Lecture du fichier impossible. Réessayez avec une autre image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error('Image illisible. Essayez un fichier JPG ou PNG.'));
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const ctx = c.getContext('2d');
        if (!ctx) return rej(new Error('Compression impossible sur ce navigateur.'));
        ctx.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface Images {
  get: (key: string | undefined) => string | undefined;
  set: (key: string, file: File) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clearAll: () => Promise<void>;
  count: number;
  persistent: boolean;
}

const Ctx = createContext<Images | null>(null);

export function ImagesProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, string>>({});
  const [persistent, setPersistent] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const keys = (await tx('readonly', (s) => s.getAllKeys())) as string[];
        const vals = (await tx('readonly', (s) => s.getAll())) as string[];
        const m: Record<string, string> = {};
        keys.forEach((k, i) => { m[k] = vals[i]; });
        setMap(m);
      } catch { setPersistent(false); }
    })();
  }, []);

  const set = useCallback(async (key: string, file: File) => {
    const url = await compressImage(file);
    setMap((m) => ({ ...m, [key]: url }));
    try { await tx('readwrite', (s) => s.put(url, key)); } catch { setPersistent(false); }
  }, []);
  const remove = useCallback(async (key: string) => {
    setMap((m) => { const n = { ...m }; delete n[key]; return n; });
    try { await tx('readwrite', (s) => s.delete(key)); } catch { /* mémoire seulement */ }
  }, []);
  const clearAll = useCallback(async () => {
    setMap({});
    try { await tx('readwrite', (s) => s.clear()); } catch { /* mémoire seulement */ }
  }, []);
  const get = useCallback((key: string | undefined) => (key ? map[key] : undefined), [map]);
  const value = useMemo(() => ({ get, set, remove, clearAll, count: Object.keys(map).length, persistent }), [get, set, remove, clearAll, map, persistent]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useImages(): Images {
  const c = useContext(Ctx);
  if (!c) throw new Error('ImagesProvider manquant');
  return c;
}
