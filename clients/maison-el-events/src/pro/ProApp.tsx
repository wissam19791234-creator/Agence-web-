import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { cx, IconButton, useConfirm, useToast } from '../components/ui';
import { stageLabel } from '../lib/constants';
import { fullName } from '../lib/format';
import { useImages } from '../lib/images';
import { navigate, type Route } from '../lib/router';
import { useStore } from '../lib/store';
import { useUi } from '../lib/ui';
import { DEMO_BANNER } from '../lib/constants';
import Calendar from './Calendar';
import Catalog from './Catalog';
import Dashboard from './Dashboard';
import Finance from './Finance';
import Media from './Media';
import Pipeline from './Pipeline';
import Prospects, { ProspectDrawer } from './Prospects';
import Quotes, { QuoteEditor } from './Quotes';
import Settings from './Settings';
import Tasks from './Tasks';

const NAV: { r: Route; label: string; icon: IconName }[] = [
  { r: 'pro', label: 'Tableau de bord', icon: 'chart' },
  { r: 'pro-prospects', label: 'Prospects et clients', icon: 'users' },
  { r: 'pro-pipeline', label: 'Pipeline', icon: 'kanban' },
  { r: 'pro-devis', label: 'Devis', icon: 'file' },
  { r: 'pro-calendrier', label: 'Calendrier', icon: 'calendar' },
  { r: 'pro-catalogue', label: 'Catalogue', icon: 'box' },
  { r: 'pro-taches', label: 'Tâches et relances', icon: 'check' },
  { r: 'pro-rentabilite', label: 'Rentabilité', icon: 'euro' },
  { r: 'pro-photos', label: 'Photos et galerie', icon: 'image' },
  { r: 'pro-parametres', label: 'Paramètres', icon: 'settings' },
];

export function ProHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[36px] font-normal leading-[.95] tracking-[-.045em] text-brun sm:text-[48px]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-brun-2">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const Panel = ({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={cx('min-w-0 rounded-card border border-line bg-panel p-5', className)}>
    {(title || actions) && <div className="mb-4 flex items-center justify-between gap-3">{title && <h2 className="mono mono-lg text-ash">{title}</h2>}{actions}</div>}
    {children}
  </section>
);

function Search() {
  const { data } = useStore();
  const { setOpenProspect } = useUi();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const res = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return data.prospects.filter((p) => `${fullName(p)} ${p.email} ${p.eventType} ${p.place}`.toLowerCase().includes(t)).slice(0, 6);
  }, [q, data.prospects]);
  useEffect(() => {
    const c = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', c);
    return () => document.removeEventListener('mousedown', c);
  }, []);
  return (
    <div ref={box} className="relative w-full max-w-md">
      <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brun-3" />
      <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Rechercher un client, un e-mail, un lieu…" aria-label="Rechercher un prospect" className="h-10 w-full rounded-ctl border border-frost/20 bg-[#0B0B0B] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-smoke focus:border-white/60" />
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden border border-line bg-black">
          {res.length ? res.map((p) => (
            <button key={p.id} type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-white/5" onClick={() => { setOpenProspect(p.id); setOpen(false); setQ(''); }}>
              <span className="min-w-0"><span className="block truncate font-medium text-brun">{fullName(p)}</span><span className="block truncate text-xs text-brun-3">{p.eventType} · {p.place || 'lieu à préciser'}</span></span>
              <span className="shrink-0 text-xs text-brun-3">{stageLabel(p.stage)}</span>
            </button>
          )) : <p className="px-4 py-3 text-sm text-brun-3">Aucun résultat pour « {q} ».</p>}
        </div>
      )}
    </div>
  );
}

function Page({ route }: { route: Route }) {
  switch (route) {
    case 'pro-prospects': return <Prospects />;
    case 'pro-pipeline': return <Pipeline />;
    case 'pro-devis': return <Quotes />;
    case 'pro-calendrier': return <Calendar />;
    case 'pro-catalogue': return <Catalog />;
    case 'pro-taches': return <Tasks />;
    case 'pro-rentabilite': return <Finance />;
    case 'pro-photos': return <Media />;
    case 'pro-parametres': return <Settings />;
    default: return <Dashboard />;
  }
}

export function ProApp({ route }: { route: Route }) {
  const { data, reset, storageOk } = useStore();
  const { get } = useImages();
  const { navOpen, setNavOpen, startTour, editQuote, setOpenProspect, setEditQuote, stopTour } = useUi();
  const confirm = useConfirm();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => setNavOpen(false), [route, setNavOpen]);
  useEffect(() => { if (route !== 'pro-devis') setEditQuote(null); }, [route, setEditQuote]);
  const logo = get('logo');

  const doReset = async () => {
    if (await confirm({ title: 'Réinitialiser les données de démonstration ?', message: 'Les prospects, devis, événements, tâches, tarifs et paramètres modifiés seront remplacés par les données d’exemple d’origine. Les photos importées sont conservées.', confirm: 'Réinitialiser', danger: true })) {
      reset(); setOpenProspect(null); setEditQuote(null); stopTour(); toast('Données de démonstration réinitialisées.');
    }
  };

  const nav = (
    <nav aria-label="Espace professionnel" className="flex h-full flex-col">
      <a href="#pro" className="flex items-center gap-3 px-4 py-5 no-underline">
        {logo ? <img src={logo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-ctl border border-frost/70 bg-charcoal text-sm text-white">EL</span>}
        {!collapsed && <span className="min-w-0"><span className="block truncate text-lg leading-tight text-white">{data.settings.businessName}</span><span className="mono block text-smoke">Espace professionnel</span></span>}
      </a>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-2.5">
        {NAV.map((n) => {
          const on = route === n.r;
          return (
            <li key={n.r}>
              <a href={`#${n.r}`} aria-current={on ? 'page' : undefined} title={collapsed ? n.label : undefined}
                className={cx('flex items-center gap-3 rounded-card px-3 py-2.5 text-[13.5px] no-underline transition', on ? 'bg-charcoal text-white ring-1 ring-inset ring-frost/40' : 'text-white/70 hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-0')}>
                <Icon name={n.icon} className={cx('h-[18px] w-[18px] shrink-0', on && 'text-brand')} />{!collapsed && n.label}
              </a>
            </li>
          );
        })}
      </ul>
      <div className="space-y-1 border-t border-cream/10 p-2.5">
        <button type="button" onClick={startTour} className={cx('flex w-full items-center gap-3 rounded-card px-3 py-2.5 text-[13.5px] text-white hover:bg-white/5', collapsed && 'justify-center px-0')} title="Découvrir la démo"><Icon name="play" className="h-4 w-4 shrink-0" />{!collapsed && 'Découvrir la démo'}</button>
        <button type="button" onClick={doReset} className={cx('flex w-full items-center gap-3 rounded-card px-3 py-2.5 text-[13.5px] text-white/70 hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-0')} title="Réinitialiser les données"><Icon name="refresh" className="h-4 w-4 shrink-0" />{!collapsed && 'Réinitialiser les données'}</button>
        <a href="#accueil" className={cx('flex items-center gap-3 rounded-card px-3 py-2.5 text-[13.5px] text-white/70 no-underline hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-0')} title="Voir le site"><Icon name="external" className="h-4 w-4 shrink-0" />{!collapsed && 'Voir le site public'}</a>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-black text-brun">
      <div className="mono sticky top-0 z-50 bg-brand px-4 py-1.5 text-center !text-[10.5px] text-black" role="note">{DEMO_BANNER}</div>
      <div className="flex">
        <aside className={cx('sticky top-[29px] hidden h-[calc(100vh-29px)] shrink-0 border-r border-line bg-black transition-[width] duration-200 lg:block', collapsed ? 'w-[72px]' : 'w-64')}>{nav}</aside>
        {navOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="absolute inset-0 bg-brun/40 animate-fade" onClick={() => setNavOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-[min(80vw,290px)] border-r border-line bg-black animate-rise">{nav}</aside>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <header className="sticky top-[29px] z-40 flex h-16 items-center gap-3 border-b border-line bg-black/90 px-4 backdrop-blur sm:px-6">
            <IconButton icon="menu" label="Ouvrir la navigation" className="lg:hidden" onClick={() => setNavOpen(true)} />
            <IconButton icon={collapsed ? 'right' : 'left'} label={collapsed ? 'Déplier le menu latéral' : 'Replier le menu latéral'} className="hidden lg:inline-grid" onClick={() => setCollapsed(!collapsed)} />
            <Search />
            <div className="ml-auto hidden items-center gap-2 sm:flex">
              <button type="button" onClick={startTour} className="mono mono-lg inline-flex h-10 items-center gap-2 rounded-ctl border border-frost/70 bg-charcoal px-4 text-white hover:bg-white hover:text-black"><Icon name="play" className="h-3.5 w-3.5" />Découvrir la démo</button>
            </div>
          </header>
          {!storageOk && <p className="mx-4 mt-4 rounded-card bg-[#2A2112] px-4 py-2.5 text-sm text-warn sm:mx-6">Le navigateur bloque l’enregistrement local : vos modifications seront perdues à la fermeture de la page.</p>}
          <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
            {editQuote ? <QuoteEditor id={editQuote} onClose={() => setEditQuote(null)} /> : <Page route={route} />}
          </main>
        </div>
      </div>
      <ProspectDrawer />
    </div>
  );
}

export function goPro(r: Route) { navigate(r); }
