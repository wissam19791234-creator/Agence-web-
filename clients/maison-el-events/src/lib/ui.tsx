// État d'interface partagé : fiche ouverte, devis en édition, parcours de démonstration.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { RequestInput } from './actions';

export interface TourState {
  active: boolean;
  step: number; // 1 à 8
  prospectId: string | null;
  quoteId: string | null;
  taskId: string | null;
  eventId: string | null;
  startedAt: number;
  minimized: boolean;
}

const TOUR_KEY = 'mel-demo-tour';
const emptyTour: TourState = { active: false, step: 1, prospectId: null, quoteId: null, taskId: null, eventId: null, startedAt: 0, minimized: false };

function loadTour(): TourState {
  try { const t = JSON.parse(sessionStorage.getItem(TOUR_KEY) || 'null'); return t && typeof t.step === 'number' ? { ...emptyTour, ...t } : emptyTour; } catch { return emptyTour; }
}

interface Ui {
  openProspect: string | null;
  setOpenProspect: (id: string | null) => void;
  editQuote: string | null;
  setEditQuote: (id: string | null) => void;
  calendarFocus: string | null;
  setCalendarFocus: (iso: string | null) => void;
  highlight: string | null;
  flash: (id: string) => void;
  prefill: Partial<RequestInput> | null;
  setPrefill: (p: Partial<RequestInput> | null) => void;
  tour: TourState;
  setTour: (t: Partial<TourState>) => void;
  startTour: () => void;
  stopTour: () => void;
  navOpen: boolean;
  setNavOpen: (v: boolean) => void;
}

const Ctx = createContext<Ui | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [openProspect, setOpenProspect] = useState<string | null>(null);
  const [editQuote, setEditQuote] = useState<string | null>(null);
  const [calendarFocus, setCalendarFocus] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<Partial<RequestInput> | null>(null);
  const [tour, setTourState] = useState<TourState>(loadTour);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => { try { sessionStorage.setItem(TOUR_KEY, JSON.stringify(tour)); } catch { /* facultatif */ } }, [tour]);

  const flash = useCallback((id: string) => { setHighlight(id); setTimeout(() => setHighlight((h) => (h === id ? null : h)), 4200); }, []);
  const setTour = useCallback((t: Partial<TourState>) => setTourState((s) => ({ ...s, ...t })), []);
  const startTour = useCallback(() => setTourState({ ...emptyTour, active: true, startedAt: Date.now() }), []);
  const stopTour = useCallback(() => setTourState((s) => ({ ...s, active: false })), []);

  const value = useMemo(() => ({ openProspect, setOpenProspect, editQuote, setEditQuote, calendarFocus, setCalendarFocus, highlight, flash, prefill, setPrefill, tour, setTour, startTour, stopTour, navOpen, setNavOpen }),
    [openProspect, editQuote, calendarFocus, highlight, flash, prefill, tour, setTour, startTour, stopTour, navOpen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi(): Ui {
  const c = useContext(Ctx);
  if (!c) throw new Error('UiProvider manquant');
  return c;
}
