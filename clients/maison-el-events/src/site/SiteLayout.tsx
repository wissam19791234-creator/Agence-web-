import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { cx, LinkButton } from '../components/ui';
import { useImages } from '../lib/images';
import type { Route } from '../lib/router';
import { useStore } from '../lib/store';
import { useUi } from '../lib/ui';

const NAV: { r: Route; label: string }[] = [
  { r: 'prestations', label: 'Prestations' },
  { r: 'menu', label: 'Menu' },
  { r: 'galerie', label: 'Galerie' },
  { r: 'tarifs', label: 'Tarifs' },
  { r: 'faq', label: 'FAQ' },
];

export function Logo() {
  const { data } = useStore();
  const { get } = useImages();
  const logo = get('logo');
  return (
    <span className="flex items-center gap-3">
      {logo ? <img src={logo} alt={`Logo ${data.settings.businessName}`} className="h-8 w-8 rounded-ctl object-cover" /> : <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-ctl border border-frost/70 bg-charcoal text-[12px] font-medium tracking-[-.02em] text-white">EL</span>}
      <span className="text-[17px] font-medium leading-none tracking-[-.035em] text-white">{data.settings.businessName}</span>
    </span>
  );
}

/** Mise en page « galerie de nuit » : barre de navigation transparente et collante, sections en plein cadre, pied de page minimal. */
export function SiteLayout({ route, children }: { route: Route; children: ReactNode }) {
  const { data } = useStore();
  const { startTour } = useUi();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const s = data.settings;
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
    <div className="min-h-screen overflow-x-clip bg-black text-white">
      <button type="button" onClick={() => document.getElementById('contenu')?.focus()} className="mono sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-ctl focus:bg-white focus:px-4 focus:py-2 focus:text-black">Aller au contenu</button>

      <header className={cx('fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300', scrolled || open ? 'border-frost/15 bg-black/80 backdrop-blur-md' : 'border-frost/10 bg-transparent')}>
        <div className="border-b border-frost/10">
          <div className="mx-auto flex h-[30px] max-w-site items-center justify-between gap-4 px-4 sm:px-6">
            <p className="mono truncate !text-[10px] text-ash"><span className="text-brand">●</span> Démonstration Scalify<span className="hidden sm:inline"> · contenus et données fictifs à valider</span></p>
            <div className="flex shrink-0 items-center gap-4">
              <a href="#presentation" className="mono hidden !text-[10px] text-ash no-underline hover:text-white sm:inline">Présentation</a>
              <button type="button" onClick={startTour} className="mono inline-flex items-center gap-1.5 !text-[10px] text-white hover:text-brand"><Icon name="play" className="h-2.5 w-2.5" />Découvrir la démo</button>
            </div>
          </div>
        </div>
        <div className="mx-auto flex h-[58px] max-w-site items-center justify-between gap-6 px-4 sm:px-6">
          <a href="#accueil" className="no-underline" aria-label={`${s.businessName}, accueil`}><Logo /></a>
          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {NAV.map((n, i) => (
                <li key={n.r}><a href={`#${n.r}`} aria-current={route === n.r ? 'page' : undefined} className={cx('mono mono-lg no-underline transition', route === n.r ? 'text-white' : 'text-ash hover:text-white')}><span className={cx('mr-1.5', route === n.r ? 'text-brand' : 'text-smoke')}>{String(i + 1).padStart(2, '0')}</span>{n.label}</a></li>
              ))}
              <li><a href="#pro" className="mono mono-lg text-ash no-underline hover:text-white">Espace pro</a></li>
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <LinkButton href="#devis" size="sm" variant="primary" className="hidden sm:inline-flex">Demander un devis</LinkButton>
            <button type="button" className="mono mono-lg h-9 rounded-ctl border border-frost/60 bg-charcoal px-3.5 text-white lg:hidden" aria-expanded={open} onClick={() => setOpen(true)}>Menu</button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black px-4 pb-8 pt-4 animate-fade lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between"><Logo /><button type="button" className="mono mono-lg h-9 rounded-ctl border border-frost/60 bg-charcoal px-3.5" onClick={() => setOpen(false)}>Fermer</button></div>
          <nav className="mt-10" aria-label="Navigation mobile">
            <ul className="border-t border-frost/15">
              {[{ r: 'accueil' as Route, label: 'Accueil' }, ...NAV, { r: 'devis' as Route, label: 'Demander un devis' }].map((n, i) => (
                <li key={n.r} className="border-b border-frost/15"><a href={`#${n.r}`} className="flex items-end justify-between py-4 no-underline"><span className="display text-[44px]">{n.label}</span><span className="mono text-brand">{String(i + 1).padStart(2, '0')}</span></a></li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto grid gap-2.5 pt-6">
            <LinkButton href="#devis" size="lg" variant="primary" className="w-full">Demander un devis</LinkButton>
            <LinkButton href="#pro" size="lg" variant="secondary" className="w-full">Espace professionnel</LinkButton>
          </div>
        </div>
      )}

      <main id="contenu" tabIndex={-1} className="outline-none">{children}</main>

      <footer className="mt-24 border-t border-frost/15">
        <div className="mx-auto flex max-w-site flex-wrap items-start justify-between gap-x-10 gap-y-8 px-4 py-10 sm:px-6">
          <div className="max-w-xs">
            <Logo />
            <p className="mono mt-4 text-ash">{s.tagline} · {s.city}</p>
          </div>
          <nav aria-label="Pied de page">
            <ul className="mono mono-lg grid grid-cols-2 gap-x-10 gap-y-2.5 sm:grid-cols-3">
              {NAV.map((n) => <li key={n.r}><a href={`#${n.r}`} className="text-ash no-underline hover:text-white">{n.label}</a></li>)}
              <li><a href="#devis" className="text-ash no-underline hover:text-white">Devis</a></li>
              {s.tiktok && <li><a href={`https://www.tiktok.com/@${s.tiktok}`} target="_blank" rel="noopener" className="text-ash no-underline hover:text-white">TikTok ↗</a></li>}
              {s.instagram && <li><a href={`https://www.instagram.com/${s.instagram}`} target="_blank" rel="noopener" className="text-ash no-underline hover:text-white">Instagram ↗</a></li>}
              <li><a href="#mentions" className="text-ash no-underline hover:text-white">Mentions légales</a></li>
              <li><a href="#pro" className="text-ash no-underline hover:text-white">Espace pro</a></li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-frost/10">
          <div className="mx-auto flex max-w-site flex-wrap justify-between gap-x-6 gap-y-1 px-4 py-4 sm:px-6">
            <span className="mono !text-[10px] text-smoke">© {new Date().getFullYear()} {s.businessName} · {[s.address, s.phone, s.email].some(Boolean) ? [s.address && `${s.address}, ${s.city}`, s.phone, s.email].filter(Boolean).join(' · ') : 'Coordonnées à compléter'}</span>
            <span className="mono !text-[10px] text-smoke">Démonstration conçue par Scalify</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
