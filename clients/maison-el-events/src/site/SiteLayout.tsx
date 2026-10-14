import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { cx, LinkButton } from '../components/ui';
import { useImages } from '../lib/images';
import type { Route } from '../lib/router';
import { useStore } from '../lib/store';
import { useUi } from '../lib/ui';
import { useSmoothScroll } from './motion';

const NAV: { r: Route; label: string }[] = [
  { r: 'accueil', label: 'Accueil' },
  { r: 'prestations', label: 'Prestations' },
  { r: 'menu', label: 'Menu' },
  { r: 'galerie', label: 'Galerie' },
  { r: 'tarifs', label: 'Tarifs' },
  { r: 'faq', label: 'FAQ' },
];

/** Emblème : couronne de huit pétales dorés autour du monogramme. */
function Emblem({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <circle cx="24" cy="24" r="22.5" stroke="rgb(var(--brand))" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="17" stroke="rgb(var(--brand))" strokeOpacity=".45" strokeWidth=".8" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d="M24 3.5c1.6 2.2 1.6 4.4 0 6.6-1.6-2.2-1.6-4.4 0-6.6z" fill="rgb(var(--brand))" transform={`rotate(${i * 45} 24 24)`} />
      ))}
      <text x="24" y="29.5" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="15" fontWeight="600" fill="rgb(var(--brand))">EL</text>
    </svg>
  );
}

export function Logo({ light = true }: { light?: boolean }) {
  const { data } = useStore();
  const { get } = useImages();
  const logo = get('logo');
  return (
    <span className="flex items-center gap-3">
      {logo ? <img src={logo} alt={`Logo ${data.settings.businessName}`} className="h-10 w-10 rounded-full object-cover" /> : <Emblem />}
      <span className="leading-none">
        <span className={cx('block font-serif text-[22px] font-semibold tracking-[.02em]', light ? 'text-white' : 'text-ink')}>{data.settings.businessName.replace(/ events$/i, '')}</span>
        <span className="mt-1 block text-[9.5px] font-semibold uppercase tracking-[.32em] text-brand">Events · {data.settings.city}</span>
      </span>
    </span>
  );
}

/** Mise en page « luxe discret » : en-tête pleine largeur transparent puis givré, pied de page en quatre colonnes. */
export function SiteLayout({ route, children }: { route: Route; children: ReactNode }) {
  const { data } = useStore();
  const { startTour } = useUi();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const s = data.settings;
  useSmoothScroll();
  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="min-h-screen overflow-x-clip bg-navy text-white">
      <button type="button" onClick={() => document.getElementById('contenu')?.focus()} className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-navy">Aller au contenu</button>

      <header className={cx('fixed inset-x-0 top-0 z-[1000] transition-all duration-500 ease-lux', scrolled || open ? 'border-b border-brand/20 bg-navy/[.88] shadow-[0_10px_30px_rgba(0,0,0,.35)] backdrop-blur-xl' : 'border-b border-transparent')}>
        <div className={cx('flex items-center justify-center gap-3 overflow-hidden px-4 text-center text-[10.5px] tracking-[.06em] text-white/70 transition-all duration-500', scrolled ? 'h-0 opacity-0' : 'h-7 border-b border-white/10 opacity-100')}>
          <span className="truncate">Démonstration Scalify · visuels et données fictifs</span>
          <button type="button" onClick={startTour} className="hidden shrink-0 items-center gap-1 font-semibold text-brand hover:text-gold-light sm:inline-flex"><Icon name="play" className="h-2.5 w-2.5" />Visite guidée</button>
        </div>
        <div className={cx('flex items-center justify-between gap-6 px-4 transition-all duration-500 sm:px-8 xl:px-12', scrolled ? 'h-[64px]' : 'h-[68px] sm:h-[76px]')}>
          <a href="#accueil" className="shrink-0 no-underline" aria-label={`${s.businessName}, accueil`}><Logo /></a>
          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {NAV.map((n) => (
                <li key={n.r}>
                  <a href={`#${n.r}`} aria-current={route === n.r ? 'page' : undefined}
                    className={cx('group relative py-2 text-[14px] font-medium tracking-[.03em] no-underline transition', route === n.r ? 'text-brand' : 'text-white/85 hover:text-brand')}>
                    {n.label}
                    <span className={cx('absolute bottom-0 left-1/2 h-[1.5px] -translate-x-1/2 bg-brand transition-all duration-500 ease-lux', route === n.r ? 'w-full' : 'w-0 group-hover:w-full')} />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2.5">
            <a href="#pro" title="Espace professionnel" aria-label="Espace professionnel" className="hidden h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur transition hover:border-brand hover:text-brand sm:grid"><Icon name="users" className="h-4 w-4" /></a>
            <LinkButton href="#devis" size="sm" className="hidden !h-10 !px-6 sm:inline-flex" iconRight="arrow">Demander un devis</LinkButton>
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/5 lg:hidden" aria-expanded={open} aria-label="Ouvrir le menu" onClick={() => setOpen(true)}><Icon name="menu" className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[1100] flex flex-col bg-navy px-5 pb-8 pt-5 animate-fade lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" data-lenis-prevent>
          <div className="flex items-center justify-between"><Logo /><button type="button" aria-label="Fermer le menu" className="grid h-10 w-10 place-items-center rounded-full border border-white/25" onClick={() => setOpen(false)}><Icon name="x" className="h-5 w-5" /></button></div>
          <nav className="mt-10" aria-label="Navigation mobile">
            <ul className="border-t border-white/10">
              {[...NAV, { r: 'devis' as Route, label: 'Demander un devis' }].map((n, i) => (
                <li key={n.r} className="border-b border-white/10"><a href={`#${n.r}`} className="flex items-center justify-between py-4 no-underline"><span className="font-serif text-[34px] leading-none">{n.label}</span><span className="mono text-brand">{String(i + 1).padStart(2, '0')}</span></a></li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto grid gap-2.5 pt-6">
            <LinkButton href="#devis" size="lg" className="w-full" iconRight="arrow">Demander un devis</LinkButton>
            <LinkButton href="#pro" size="lg" variant="secondary" className="w-full">Espace professionnel</LinkButton>
          </div>
        </div>
      )}

      <main id="contenu" tabIndex={-1} className="outline-none">{children}</main>

      <footer className="border-t border-brand/15 bg-navy">
        <div className="mx-auto grid max-w-site gap-12 px-6 py-20 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-16">
          <div>
            <Logo />
            <p className="mt-6 max-w-sm text-[15px] leading-[1.7] text-white/70">Décoration de tables, coin mariés, buffets, location de décor et traiteur pour vos mariages, hennés, anniversaires et réceptions à {s.city}.</p>
            {s.tiktok && <a href={`https://www.tiktok.com/@${s.tiktok}`} target="_blank" rel="noopener" className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[13px] text-white/85 no-underline transition hover:border-brand hover:text-brand">TikTok · @{s.tiktok} <Icon name="external" className="h-3.5 w-3.5" /></a>}
          </div>
          <div>
            <h2 className="mono text-brand">Découvrir</h2>
            <ul className="mt-5 space-y-3 text-[15px]">{NAV.slice(1).map((n) => <li key={n.r}><a href={`#${n.r}`} className="text-white/75 no-underline transition hover:text-brand">{n.label}</a></li>)}</ul>
          </div>
          <div>
            <h2 className="mono text-brand">Prestations</h2>
            <ul className="mt-5 space-y-3 text-[15px] text-white/75">{data.services.filter((x) => x.active).slice(0, 6).map((x) => <li key={x.id}>{x.title.replace(/ et .*/, '')}</li>)}</ul>
          </div>
          <div>
            <h2 className="mono text-brand">Contact</h2>
            <ul className="mt-5 space-y-3 text-[15px] text-white/75">
              <li>{s.address ? `${s.address}, ${s.city}` : <>{s.city} <span className="text-white/45">· adresse à compléter</span></>}</li>
              <li>{s.phone || <span className="text-white/45">Téléphone à compléter</span>}</li>
              <li>{s.email || <span className="text-white/45">E-mail à compléter</span>}</li>
            </ul>
            <LinkButton href="#devis" className="mt-7" iconRight="arrow">Demander un devis</LinkButton>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-site flex-wrap justify-between gap-x-6 gap-y-2 px-6 py-6 text-[12.5px] text-white/50 sm:px-8">
            <span>© {new Date().getFullYear()} {s.businessName} · <a href="#mentions" className="text-white/60 no-underline hover:text-brand">Mentions légales</a> · <a href="#pro" className="text-white/60 no-underline hover:text-brand">Espace pro</a></span>
            <span>Démonstration · visuels générés et données fictifs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
