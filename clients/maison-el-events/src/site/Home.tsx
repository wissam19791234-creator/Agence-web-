import { useState } from 'react';
import { Backdrop, Visual } from '../components/Visual';
import { Button, Display, Eyebrow, LinkButton } from '../components/ui';
import { PRICE_IDS } from '../lib/constants';
import { eur } from '../lib/format';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { ServiceKey } from '../lib/types';
import { useUi } from '../lib/ui';
import { FaqList, PracticalInfo } from './Pages';
import { galKey, SERVICE_ART } from './shared';

const STEPS = [
  { t: 'Votre demande', d: 'Vous décrivez votre événement en quelques minutes : date, lieu, nombre d’invités et envies.' },
  { t: 'Notre proposition', d: 'Nous échangeons sur vos besoins, puis vous recevez un devis détaillé.' },
  { t: 'La validation', d: 'Vous validez la proposition. Un acompte peut être demandé pour réserver la date.' },
  { t: 'Le jour J', d: 'La décoration est installée selon le projet défini ensemble. Vous profitez de vos invités.' },
];

const EXAMPLE_REVIEWS = [
  { t: '« Une table exactement comme nous l’avions imaginée. »', who: 'Mariage' },
  { t: '« Les mignardises ont fait l’unanimité. »', who: 'Anniversaire' },
  { t: '« Un coin mariés magnifique pour notre henné. »', who: 'Henné' },
];

/** Section plein cadre : image en fond, contenu posé en bas à gauche. */
function Chapter({ imageKey, art, alt, children, className = 'min-h-[88svh]', id }: { imageKey: string; art: Parameters<typeof Backdrop>[0]['art']; alt: string; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section className={`relative flex items-end overflow-hidden ${className}`} aria-labelledby={id}>
      <Backdrop imageKey={imageKey} art={art} alt={alt} />
      <div className="relative z-10 mx-auto w-full max-w-site px-4 pb-14 pt-32 sm:px-6 sm:pb-20">{children}</div>
    </section>
  );
}

export default function Home() {
  const { data } = useStore();
  const { setPrefill, startTour } = useUi();
  const [guests, setGuests] = useState(100);
  const services = data.services.filter((s) => s.active);
  const menu = data.catalog.filter((c) => c.menu && c.active);
  const gallery = data.gallery.slice(0, 5);
  const price = (id: string) => data.catalog.find((c) => c.id === id)?.price ?? 0;
  const devisFor = (id: ServiceKey) => { setPrefill({ services: [id] }); navigate('devis'); };
  const city = data.settings.city;
  const figures: [string, number, string][] = [
    ['Décoration de table', price(PRICE_IDS.decoTable), 'par personne'],
    ['Mignardises', price(PRICE_IDS.sucree), 'la pièce'],
    ['Cocktails et mocktails', price(PRICE_IDS.boisson), 'la pièce'],
    ['Coin mariés', price(PRICE_IDS.coinMaries), 'forfait'],
  ];

  return (
    <>
      {/* 01 — Ouverture plein écran */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        <Backdrop imageKey="cover" art="table" alt="Table de réception dressée : bougies, roses et vaisselle dorée" eager badgePos="trh" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 scrim-t" />
        <div className="relative z-10 mx-auto w-full max-w-site px-4 pb-16 pt-[calc(var(--hdr)+64px)] sm:px-6 sm:pb-20">
          <Eyebrow n={1}>Maison événementielle · {city}</Eyebrow>
          <Display as="p" hidden lines={['Maison', 'EL Events']} className="mt-6 text-[clamp(64px,17vw,184px)]" marks={[46, 34]} brand={1} />
          <h1 className="mt-7 max-w-[600px] text-[21px] leading-[1.2] tracking-[-.03em] sm:text-[26px]">Vos plus beaux moments méritent une mise en scène unique</h1>
          <p className="mt-3 max-w-[520px] text-[15px] leading-[1.5] text-white/75">Décoration de tables, coin mariés, buffets, location de décor et traiteur à {city}.</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <LinkButton href="#devis" size="lg">Créer mon événement</LinkButton>
            <LinkButton href="#prestations" size="lg" variant="secondary">Nos prestations</LinkButton>
          </div>
        </div>
      </section>

      {/* Fiche technique : les tarifs communiqués */}
      <section aria-label="Tarifs communiqués" className="border-y border-frost/15">
        <dl className="mx-auto grid max-w-site grid-cols-2 gap-px bg-frost/15 lg:grid-cols-4">
          {figures.map(([k, v, u]) => (
            <div key={k} className="bg-black px-4 py-6 sm:px-6 sm:py-8">
              <dt className="mono text-ash">{k}</dt>
              <dd className="mt-3 text-[40px] leading-none tracking-[-.05em] tabular sm:text-[60px]">{eur(v)}</dd>
              <dd className="mono mt-2 text-brand">{u}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 02 — Index des prestations */}
      <section className="mx-auto max-w-site px-4 pt-24 sm:px-6" aria-labelledby="home-services">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <Eyebrow n={2}>Prestations / {String(services.length).padStart(2, '0')}</Eyebrow>
            <Display id="home-services" lines={['Une réception', 'pensée en entier']} className="mt-6 text-[clamp(46px,8.5vw,96px)]" />
          </div>
          <p className="max-w-[520px] text-[17px] leading-[1.5] text-ash lg:justify-self-end">Maison EL Events imagine et installe la décoration de vos réceptions à {city} : tables, espace mariés, buffets, location de matériel et prestations traiteur, avec des mignardises et des mocktails à partager.</p>
        </div>
        <ol className="mt-14 border-t border-frost/15">
          {services.map((s, i) => (
            <li key={s.id} className="group grid grid-cols-[34px_1fr] gap-x-4 gap-y-3 border-b border-frost/15 py-6 sm:grid-cols-[56px_1fr_auto_132px] sm:items-center sm:gap-x-8">
              <span className="mono pt-2 text-brand sm:pt-0">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <h3 className="text-[25px] leading-[1.05] tracking-[-.04em] sm:text-[34px]">{s.title}</h3>
                <p className="mt-2 max-w-[560px] text-[15px] leading-[1.45] text-ash">{s.description}</p>
              </div>
              <div className="col-start-2 flex flex-wrap items-center gap-x-5 gap-y-2 sm:col-start-auto sm:flex-col sm:items-end">
                <span className="mono mono-lg text-white">{s.priceNote}</span>
                <button type="button" onClick={() => devisFor(s.id)} className="mono text-ash underline-offset-4 hover:text-brand hover:underline">Demander un devis →</button>
              </div>
              <Visual imageKey={s.imageKey} art={SERVICE_ART[s.id]} alt={s.title} className="hidden aspect-[4/5] w-[132px] transition duration-300 group-hover:scale-[1.02] sm:block" badge={false} />
            </li>
          ))}
        </ol>
      </section>

      {/* 03 — Coin mariés */}
      <Chapter imageKey="coin-maries" art="canape" alt="Coin mariés : canapé de style henné, grands bougeoirs et arche fleurie" id="home-coin" className="mt-24 min-h-[92svh]">
        <Eyebrow n={3}>Coin mariés · {eur(price(PRICE_IDS.coinMaries))} le forfait</Eyebrow>
        <Display id="home-coin" lines={['Coin', 'mariés']} className="mt-6 text-[clamp(60px,13vw,140px)]" brand={0} />
        <p className="mt-6 max-w-[480px] text-[17px] leading-[1.5] text-white/85">Bougeoirs de plus d’un mètre, housses et draps du canapé de style henné.</p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <Button size="lg" onClick={() => devisFor('mariage')}>Réserver le coin mariés</Button>
          <LinkButton href="#galerie" size="lg" variant="light">Voir la galerie</LinkButton>
        </div>
      </Chapter>

      {/* 04 — Menu */}
      <Chapter imageKey="menu-sucre" art="verrine" alt="Verrines, tartelettes aux fraises et salade de fruits sur un plateau" id="home-menu" className="min-h-[88svh]">
        <Eyebrow n={4}>Le menu traiteur</Eyebrow>
        <Display id="home-menu" lines={['Mignardises', '& mocktails']} className="mt-6 text-[clamp(48px,10.5vw,124px)]" brand={1} />
        <p className="mt-6 max-w-[480px] text-[17px] leading-[1.5] text-white/85">Des bouchées sucrées et salées à {eur(price(PRICE_IDS.sucree))} la pièce, des mocktails à {eur(price(PRICE_IDS.boisson))}.</p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <LinkButton href="#menu" size="lg" variant="secondary">Voir le menu complet</LinkButton>
          <Button size="lg" variant="light" onClick={() => { setPrefill({ services: ['mignardises', 'mocktails'], needs: 'Composition personnalisée de mignardises et mocktails : ' }); navigate('devis'); }}>Composition personnalisée</Button>
        </div>
      </Chapter>
      <section className="mx-auto max-w-site px-4 sm:px-6" aria-label="Extrait du menu">
        <div className="grid gap-px overflow-hidden rounded-b-card border-x border-b border-frost/15 bg-frost/15 sm:grid-cols-3">
          {([['sucre', 'Sucré'], ['sale', 'Salé'], ['mocktail', 'Mocktails']] as const).map(([k, label]) => (
            <div key={k} className="bg-black p-5 sm:p-6">
              <h3 className="mono flex justify-between text-ash"><span>{label}</span><span className="text-brand">{eur(menu.find((m) => m.menu === k)?.price ?? 0)}</span></h3>
              <ul className="mt-4 space-y-3">{menu.filter((m) => m.menu === k).slice(0, 4).map((m) => <li key={m.id}><p className="text-[17px] tracking-[-.02em]">{m.name}</p><p className="text-[13.5px] text-smoke">{m.ingredients}</p></li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {/* 05 — Mini simulateur */}
      <section className="mx-auto mt-24 max-w-site px-4 sm:px-6" aria-labelledby="home-prices">
        <div className="relative overflow-hidden rounded-box border border-frost/20">
          <div className="absolute inset-0 opacity-50"><Visual imageKey="gal-centre" art="table" alt="" className="h-full w-full" rounded="" badge={false} /></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
          <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:p-14">
            <div>
              <Eyebrow n={5}>Tarifs communiqués</Eyebrow>
              <Display id="home-prices" lines={['Le prix,', 'sans détour']} className="mt-6 text-[clamp(46px,8vw,92px)]" brand={1} />
              <p className="mt-6 max-w-[460px] text-[15px] leading-[1.5] text-ash">Installation, déplacement et prestations non tarifées : sur devis. Un acompte peut être demandé.</p>
            </div>
            <div className="rounded-card border border-frost/25 bg-black/70 p-5 backdrop-blur-sm sm:p-6">
              <label htmlFor="home-guests" className="mono flex justify-between text-ash"><span>Nombre d’invités</span><span className="text-white tabular">{guests}</span></label>
              <input id="home-guests" type="range" min={10} max={300} step={5} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-4 w-full accent-[rgb(var(--brand))]" />
              <div className="mt-5 flex items-end justify-between gap-4 border-t border-frost/15 pt-5">
                <div><p className="mono text-ash">Décoration de table</p><p className="mono mt-1 text-smoke">{guests} × {eur(price(PRICE_IDS.decoTable))}</p></div>
                <p className="text-[44px] leading-none tracking-[-.05em] text-brand tabular sm:text-[56px]">{eur(guests * price(PRICE_IDS.decoTable))}</p>
              </div>
              <LinkButton href="#tarifs" className="mt-6 w-full" size="lg">Simuler mon budget complet</LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* 06 — Galerie */}
      <section className="mx-auto mt-24 max-w-site px-4 sm:px-6" aria-labelledby="home-gallery">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><Eyebrow n={6}>Galerie</Eyebrow><Display id="home-gallery" lines={['Ambiances']} className="mt-6 text-[clamp(46px,8.5vw,96px)]" /></div>
          <LinkButton href="#galerie" variant="secondary">Voir la galerie</LinkButton>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
          {gallery.map((g, i) => (
            <a key={g.id} href="#galerie" className={i === 0 ? 'col-span-2 row-span-2' : ''} aria-label={`${g.title}, voir la galerie`}>
              <Visual imageKey={galKey(g)} art={g.art} alt={g.title} className={i === 0 ? 'aspect-square w-full' : 'aspect-[4/3] w-full md:aspect-auto md:h-[calc(100%-28px)]'} badge={i === 0} />
              <p className="mono mt-2 text-ash"><span className="text-brand">{String(i + 1).padStart(2, '0')}</span> {g.title}</p>
            </a>
          ))}
        </div>
      </section>

      {/* 07 — Questions fréquentes + horaires */}
      <Chapter imageKey="faq" art="table" alt="Bougies allumées sur une table de réception" id="home-faq" className="mt-24 min-h-[70svh]">
        <Eyebrow n={7}>Questions fréquentes · infos pratiques</Eyebrow>
        <Display id="home-faq" lines={['Tout savoir', 'avant de réserver']} className="mt-6 text-[clamp(46px,9vw,108px)]" brand={1} />
      </Chapter>
      <section className="mx-auto grid max-w-site gap-12 px-4 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <FaqList limit={6} />
          <LinkButton href="#faq" variant="secondary" className="mt-6">Toutes les questions</LinkButton>
        </div>
        <PracticalInfo />
      </section>

      {/* 08 — Processus */}
      <section className="mx-auto mt-24 max-w-site px-4 sm:px-6" aria-labelledby="home-steps">
        <Eyebrow n={8}>Processus</Eyebrow>
        <Display id="home-steps" lines={['Réserver,', 'en quatre temps']} className="mt-6 text-[clamp(46px,8.5vw,96px)]" />
        <ol className="mt-12 grid gap-px overflow-hidden rounded-card border border-frost/15 bg-frost/15 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="bg-black p-6">
              <span className="display block text-[88px] text-brand">{i + 1}</span>
              <h3 className="mt-8 text-[22px] tracking-[-.03em]">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-[1.45] text-ash">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Avis : exemples identifiés */}
      <section className="mx-auto mt-24 max-w-site px-4 sm:px-6" aria-labelledby="home-reviews">
        <Eyebrow>Avis clients · exemples fictifs pour la démonstration</Eyebrow>
        <h2 id="home-reviews" className="sr-only">Avis clients (exemples)</h2>
        <ul className="mt-6 border-t border-frost/15">
          {EXAMPLE_REVIEWS.map((r) => (
            <li key={r.who} className="grid gap-3 border-b border-frost/15 py-7 sm:grid-cols-[1fr_220px] sm:items-end">
              <p className="text-[30px] leading-[1.02] tracking-[-.045em] sm:text-[46px]">{r.t}</p>
              <p className="mono text-ash sm:text-right">Exemple d’avis · {r.who}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[14px] text-smoke">Ces exemples seront remplacés par de vrais avis, avec l’accord des clients.</p>
      </section>

      {/* 09 — Appel final */}
      <Chapter imageKey="gal-arche" art="arche" alt="Arche fleurie et allée de cérémonie bordée de lanternes" className="mt-24 min-h-[90svh]">
        <Eyebrow n={9}>Votre événement</Eyebrow>
        <Display lines={['Parlons de', 'votre', 'événement']} className="mt-6 text-[clamp(56px,12vw,140px)]" brand={2} />
        <div className="mt-10 flex flex-wrap gap-2.5">
          <LinkButton href="#devis" size="lg">Demander un devis</LinkButton>
          <Button size="lg" variant="secondary" icon="play" onClick={startTour}>Découvrir la démo</Button>
        </div>
      </Chapter>
    </>
  );
}
