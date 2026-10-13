import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { cx, LinkButton } from '../components/ui';
import { useImages } from '../lib/images';
import type { Route } from '../lib/router';
import { useStore } from '../lib/store';
import { useUi } from '../lib/ui';

const NAV: { r: Route; label: string }[] = [
  { r: 'accueil', label: 'Accueil' },
  { r: 'prestations', label: 'Prestations' },
  { r: 'menu', label: 'Menu' },
  { r: 'galerie', label: 'Galerie' },
  { r: 'tarifs', label: 'Tarifs' },
];

export function Logo({ light = false }: { light?: boolean }) {
  const { data } = useStore();
  const { get } = useImages();
  const logo = get('logo');
  const [first, ...rest] = data.settings.businessName.split(' ');
  return (
    <span className="flex items-center gap-3">
      {logo ? <img src={logo} alt={`Logo ${data.settings.businessName}`} className="h-11 w-11 rounded-full object-cover" /> : (
        <span className={cx('grid h-11 w-11 place-items-center rounded-full font-serif text-[17px] font-semibold tracking-wide ring-1 ring-offset-2', light ? 'bg-cream/10 text-cream ring-champagne/70 ring-offset-brand' : 'bg-brand text-champagne ring-champagne ring-offset-cream')} aria-hidden="true">EL</span>
      )}
      <span className="leading-none">
        <span className={cx('block font-serif text-[21px] font-medium tracking-[.01em]', light ? 'text-cream' : 'text-brun')}>{first} <span className="font-semibold">{rest.join(' ')}</span></span>
        <span className={cx('mt-1 block text-[9.5px] font-medium uppercase tracking-[.32em]', light ? 'text-champagne' : 'text-champagne-deep')}>{data.settings.city}</span>
      </span>
    </span>
  );
}

export function SiteLayout({ route, children }: { route: Route; children: ReactNode }) {
  const { data } = useStore();
  const { startTour } = useUi();
  const [open, setOpen] = useState(false);
  const s = data.settings;
  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open]);

  return (
    <div className="min-h-screen bg-cream">
      <button type="button" onClick={() => document.getElementById('contenu')?.focus()} className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-cream">Aller au contenu</button>
      <div className="bg-brun text-[12.5px] text-cream/85">
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-center sm:justify-between sm:px-6">
          <p>Site de démonstration conçu par Scalify · contenus et données fictifs à valider</p>
          <div className="flex items-center gap-3">
            <a href="#presentation" className="underline-offset-4 hover:text-champagne hover:underline">Présentation</a>
            <button type="button" onClick={startTour} className="inline-flex items-center gap-1.5 rounded-full bg-champagne px-3 py-1 font-medium text-brun transition hover:bg-cream"><Icon name="play" className="h-3 w-3" />Découvrir la démo</button>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-[74px] max-w-site items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#accueil" className="no-underline" aria-label={`${s.businessName}, accueil`}><Logo /></a>
          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {NAV.map((n) => (
                <li key={n.r}><a href={`#${n.r}`} aria-current={route === n.r ? 'page' : undefined} className={cx('relative text-[14px] tracking-[.02em] text-brun-2 no-underline transition hover:text-brand', route === n.r && 'text-brand after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:bg-brand')}>{n.label}</a></li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <a href="#pro" className="hidden text-[13px] text-brun-2 underline-offset-4 hover:text-brand hover:underline md:inline">Espace professionnel</a>
            <LinkButton href="#devis" size="sm" className="hidden sm:inline-flex">Demander un devis</LinkButton>
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full text-brun lg:hidden" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" className="h-6 w-6" /></button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-brun/40 animate-fade" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(86vw,360px)] flex-col bg-cream p-6 shadow-lift animate-rise">
            <div className="flex items-center justify-between"><Logo /><button type="button" aria-label="Fermer le menu" className="grid h-11 w-11 place-items-center rounded-full" onClick={() => setOpen(false)}><Icon name="x" className="h-6 w-6" /></button></div>
            <nav className="mt-10" aria-label="Navigation mobile">
              <ul className="space-y-1">
                {NAV.map((n) => <li key={n.r}><a href={`#${n.r}`} className={cx('block rounded-xl px-3 py-3 font-serif text-2xl no-underline', route === n.r ? 'bg-brand-soft text-brand' : 'text-brun')}>{n.label}</a></li>)}
              </ul>
            </nav>
            <div className="mt-auto space-y-3">
              <LinkButton href="#devis" size="lg" className="w-full">Demander un devis</LinkButton>
              <LinkButton href="#pro" variant="secondary" className="w-full" icon="kanban">Espace professionnel</LinkButton>
            </div>
          </div>
        </div>
      )}

      <main id="contenu" tabIndex={-1} className="outline-none">{children}</main>

      <footer className="mt-24 bg-brand text-cream/85">
        <div className="mx-auto grid max-w-site gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed">{s.tagline} à {s.city}. Mariages, henné, anniversaires, baptêmes et réceptions.</p>
          </div>
          <div>
            <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[.26em] text-champagne">Coordonnées</h2>
            <ul className="space-y-2.5 text-sm">
              <li className="flex gap-2.5"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />{s.address ? `${s.address}, ${s.city}` : <span>{s.city} <span className="text-cream/55">· adresse à compléter</span></span>}</li>
              <li className="flex gap-2.5"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />{s.phone || <span className="text-cream/55">Téléphone à compléter</span>}</li>
              <li className="flex gap-2.5"><Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />{s.email || <span className="text-cream/55">E-mail à compléter</span>}</li>
              {s.hours && <li className="flex gap-2.5"><Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />{s.hours}</li>}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[.26em] text-champagne">Découvrir</h2>
            <ul className="space-y-2.5 text-sm">
              {NAV.slice(1).map((n) => <li key={n.r}><a href={`#${n.r}`} className="no-underline hover:text-white">{n.label}</a></li>)}
              <li><a href="#devis" className="no-underline hover:text-white">Demander un devis</a></li>
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[.26em] text-champagne">Suivre et informations</h2>
            <ul className="space-y-2.5 text-sm">
              {s.tiktok && <li><a href={`https://www.tiktok.com/@${s.tiktok}`} target="_blank" rel="noopener" className="no-underline hover:text-white">TikTok · @{s.tiktok}</a></li>}
              {s.instagram ? <li><a href={`https://www.instagram.com/${s.instagram}`} target="_blank" rel="noopener" className="no-underline hover:text-white">Instagram · @{s.instagram}</a></li> : <li className="text-cream/55">Instagram à compléter</li>}
              <li><a href="#mentions" className="no-underline hover:text-white">Mentions légales (à compléter)</a></li>
              <li><a href="#pro" className="no-underline hover:text-white">Espace professionnel</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-cream/10">
          <div className="mx-auto flex max-w-site flex-wrap justify-between gap-2 px-4 py-5 text-xs text-cream/60 sm:px-6">
            <span>© {new Date().getFullYear()} {s.businessName} · {s.city}</span>
            <span>Démonstration conçue par Scalify</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
