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
];

export function Logo() {
  const { data } = useStore();
  const { get } = useImages();
  const logo = get('logo');
  return (
    <span className="flex items-center gap-3">
      {logo && <img src={logo} alt={`Logo ${data.settings.businessName}`} className="h-9 w-9 rounded-full object-cover" />}
      <span className="font-serif text-[24px] leading-none tracking-[-.01em] text-white">{data.settings.businessName}</span>
    </span>
  );
}

/** Mise en page éditoriale : toile noire, liens fantômes, filets gris, un seul accent corail par écran. */
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
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="min-h-screen overflow-x-clip bg-black text-white">
      <button type="button" onClick={() => document.getElementById('contenu')?.focus()} className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-[40px] focus:bg-white focus:px-4 focus:py-2 focus:text-black">Aller au contenu</button>

      <div className="border-b border-line">
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-2.5 text-[13px] text-smoke sm:px-6">
          <p className="thin">Démonstration Scalify · contenus et données fictifs à valider</p>
          <div className="flex items-center gap-4">
            <a href="#presentation" className="text-white/80 no-underline hover:text-white">Présentation</a>
            <button type="button" onClick={startTour} className="inline-flex items-center gap-1.5 rounded-[40px] px-3 py-1 text-white ring-1 ring-inset ring-white/70 transition hover:bg-white hover:text-black"><Icon name="play" className="h-3 w-3" />Découvrir la démo</button>
          </div>
        </div>
      </div>

      <header className="relative z-30">
        <div className="mx-auto flex h-20 max-w-site items-center justify-between gap-6 px-5 sm:px-6">
          <a href="#accueil" className="no-underline" aria-label={`${s.businessName}, accueil`}><Logo /></a>
          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-7 text-[15px]">
              {NAV.map((n) => (
                <li key={n.r}><a href={`#${n.r}`} aria-current={route === n.r ? 'page' : undefined} className={cx('no-underline transition', route === n.r ? 'text-white underline decoration-1 underline-offset-[6px]' : 'text-white/75 hover:text-white')}>{n.label}</a></li>
              ))}
              <li><a href="#pro" className="text-white/75 no-underline hover:text-white">Espace professionnel</a></li>
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            <LinkButton href="#devis" size="sm" variant="secondary" className="hidden sm:inline-flex">Demander un devis</LinkButton>
            <button type="button" className="h-11 rounded-[40px] px-4 text-[15px] text-white ring-1 ring-inset ring-white/40 lg:hidden" aria-expanded={open} onClick={() => setOpen(true)}>Menu</button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black px-5 pb-8 pt-5 animate-fade lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between"><Logo /><button type="button" className="h-11 rounded-[40px] px-4 text-[15px] ring-1 ring-inset ring-white/40" onClick={() => setOpen(false)}>Fermer</button></div>
          <nav className="mt-12" aria-label="Navigation mobile">
            <ul className="divide-y divide-line border-y border-line">
              {[{ r: 'accueil' as Route, label: 'Accueil' }, ...NAV, { r: 'devis' as Route, label: 'Demander un devis' }].map((n, i) => (
                <li key={n.r}><a href={`#${n.r}`} className="flex items-baseline justify-between py-4 no-underline"><span className="font-serif text-[40px] leading-none">{n.label}</span><span className="thin text-[13px] text-smoke">{String(i + 1).padStart(2, '0')}</span></a></li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto grid gap-3">
            <LinkButton href="#devis" size="lg" variant="primary" className="w-full">Demander un devis</LinkButton>
            <LinkButton href="#pro" variant="secondary" className="w-full">Espace professionnel</LinkButton>
          </div>
        </div>
      )}

      <main id="contenu" tabIndex={-1} className="outline-none">{children}</main>

      <footer className="mt-[120px] border-t border-smoke/60">
        <div className="mx-auto grid max-w-site gap-10 px-5 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <p className="thin text-[14px]">{s.tagline}</p>
            <p className="mt-4 max-w-xs text-[15px] leading-[1.4] text-brun-2">Mariages, henné, anniversaires, baptêmes et réceptions à {s.city} et alentours.</p>
          </div>
          <div>
            <h2 className="thin mb-4 text-[14px] text-smoke">Coordonnées</h2>
            <ul className="space-y-2 text-[15px]">
              <li>{s.address ? `${s.address}, ${s.city}` : <>{s.city} <span className="text-smoke">· adresse à compléter</span></>}</li>
              <li>{s.phone || <span className="text-smoke">Téléphone à compléter</span>}</li>
              <li>{s.email || <span className="text-smoke">E-mail à compléter</span>}</li>
              {s.hours && <li>{s.hours}</li>}
            </ul>
          </div>
          <div>
            <h2 className="thin mb-4 text-[14px] text-smoke">Découvrir</h2>
            <ul className="space-y-2 text-[15px]">
              {NAV.map((n) => <li key={n.r}><a href={`#${n.r}`} className="no-underline hover:text-smoke">{n.label}</a></li>)}
              <li><a href="#devis" className="no-underline hover:text-smoke">Demander un devis</a></li>
            </ul>
          </div>
          <div>
            <h2 className="thin mb-4 text-[14px] text-smoke">Suivre</h2>
            <ul className="space-y-2 text-[15px]">
              {s.tiktok && <li><a href={`https://www.tiktok.com/@${s.tiktok}`} target="_blank" rel="noopener" className="no-underline hover:text-smoke">TikTok · @{s.tiktok}</a></li>}
              {s.instagram ? <li><a href={`https://www.instagram.com/${s.instagram}`} target="_blank" rel="noopener" className="no-underline hover:text-smoke">Instagram · @{s.instagram}</a></li> : <li className="text-smoke">Instagram à compléter</li>}
              <li><a href="#mentions" className="no-underline hover:text-smoke">Mentions légales</a></li>
              <li><a href="#pro" className="no-underline hover:text-smoke">Espace professionnel</a></li>
            </ul>
          </div>
        </div>
        <div className="overflow-hidden px-3" aria-hidden="true">
          <p className="display -mb-[0.16em] whitespace-nowrap text-center text-[21vw] text-[#1C1C1C]">{s.businessName}</p>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-site flex-wrap justify-between gap-2 px-5 py-5 text-[13px] text-smoke sm:px-6">
            <span>© {new Date().getFullYear()} {s.businessName} · {s.city}</span>
            <span className="thin">Démonstration conçue par Scalify</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
