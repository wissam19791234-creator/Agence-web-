import { Visual } from '../components/Visual';
import { Button, LinkButton } from '../components/ui';
import { PRICE_IDS } from '../lib/constants';
import { eur } from '../lib/format';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { ServiceKey } from '../lib/types';
import { useUi } from '../lib/ui';
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

/** Code-barres décoratif (repère d'étiquette, sans valeur). */
export function Barcode({ className = '' }: { className?: string }) {
  const bars = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 2];
  let x = 0;
  const rects = bars.map((w, i) => { const r = i % 2 === 0 ? <rect key={i} x={x} y="0" width={w * 1.4} height="52" fill="currentColor" /> : null; x += w * 1.4 + 0.9; return r; });
  return <svg viewBox={`0 0 ${Math.ceil(x)} 52`} className={className} aria-hidden="true" preserveAspectRatio="none">{rects}</svg>;
}

export default function Home() {
  const { data } = useStore();
  const { setPrefill, startTour } = useUi();
  const services = data.services.filter((s) => s.active);
  const menu = data.catalog.filter((c) => c.menu && c.active);
  const gallery = data.gallery.slice(0, 4);
  const price = (id: string) => data.catalog.find((c) => c.id === id)?.price ?? 0;
  const devisFor = (id: ServiceKey) => { setPrefill({ services: [id] }); navigate('devis'); };

  return (
    <>
      {/* Hero : le nom de la maison, la photo qui chevauche la typographie */}
      <section className="relative">
        <div className="relative mx-auto max-w-site px-5 pt-4 sm:px-6 lg:pt-8">
          <div className="relative min-h-[520px] sm:min-h-[600px] lg:min-h-[700px]">
            <div className="absolute right-0 top-14 h-[420px] w-[76%] sm:top-8 sm:h-[560px] sm:w-[60%] lg:top-0 lg:h-[700px] lg:w-[54%]">
              <Visual imageKey="cover" art="table" alt="Réception décorée par Maison EL Events" className="h-full w-full" rounded="rounded-none" />
            </div>
            <p className="display relative z-10 pt-1 text-[22vw] text-white [text-shadow:0_2px_30px_rgba(0,0,0,.45)] sm:text-[150px] lg:pt-24 lg:text-[200px]" aria-hidden="true">Maison<br />EL<br />Events</p>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-site px-5 sm:px-6 lg:mt-14">
          <p className="thin text-[14px]">Maison événementielle · {data.settings.city}</p>
          <h1 className="mt-4 max-w-[900px] font-serif text-[40px] leading-[1.02] sm:text-[64px]">Vos plus beaux moments méritent une mise en scène unique</h1>
        </div>
      </section>

      <section className="mx-auto mt-[70px] grid max-w-site gap-8 px-5 sm:px-6 lg:grid-cols-2">
        <p className="max-w-[600px] text-[18px] leading-[1.4] text-white">Maison EL Events imagine et installe la décoration de vos réceptions à {data.settings.city} : tables, espace mariés, buffets, location de matériel et prestations traiteur, avec des mignardises et des mocktails à partager.</p>
        <div className="flex flex-wrap items-start gap-3 lg:justify-end">
          <LinkButton href="#prestations" size="lg" variant="secondary">Découvrir nos prestations</LinkButton>
          <LinkButton href="#devis" size="lg" variant="primary">Créer mon événement</LinkButton>
        </div>
      </section>

      {/* Index des prestations */}
      <section className="mx-auto mt-[120px] max-w-site px-5 sm:px-6" aria-labelledby="home-services">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-smoke/60 pb-6">
          <div><p className="thin text-[14px]">Prestations / {String(services.length).padStart(2, '0')}</p><h2 id="home-services" className="mt-3 font-serif text-[44px] leading-[1.02] sm:text-[64px]">Une réception pensée<br />dans son ensemble</h2></div>
          <a href="#prestations" className="rounded-[24px] px-5 py-2 text-[15px] text-white no-underline ring-1 ring-inset ring-white/60 hover:bg-white hover:text-black">Toutes les prestations</a>
        </div>
        <ol>
          {services.map((s, i) => (
            <li key={s.id} className="group grid grid-cols-[40px_1fr] gap-x-4 gap-y-3 border-b border-line py-7 sm:grid-cols-[60px_1fr_auto_140px] sm:items-center sm:gap-x-8">
              <span className="thin pt-2 text-[14px] text-smoke sm:pt-0">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-[26px] leading-[1.16] tracking-[-.01em] sm:text-[36px]">{s.title}</h3>
                <p className="mt-2 max-w-[560px] text-[15px] leading-[1.4] text-brun-2">{s.description}</p>
              </div>
              <div className="col-start-2 flex flex-wrap items-center gap-x-5 gap-y-1 sm:col-start-auto sm:flex-col sm:items-end">
                <span className="text-[15px] text-white">{s.priceNote}</span>
                <button type="button" onClick={() => devisFor(s.id)} className="text-[14px] text-smoke underline-offset-4 hover:text-white hover:underline">Demander un devis</button>
              </div>
              <Visual imageKey={s.imageKey} art={SERVICE_ART[s.id]} alt={s.title} className="col-span-2 aspect-[16/9] sm:col-span-1 sm:aspect-[4/5] sm:w-[140px] sm:opacity-75 sm:grayscale sm:transition sm:group-hover:opacity-100 sm:group-hover:grayscale-0" rounded="rounded-none" badge={false} />
            </li>
          ))}
        </ol>
      </section>

      {/* Image pleine largeur, texte qui la chevauche */}
      <section className="relative mt-[120px]">
        <Visual imageKey="coin-maries" art="canape" alt="Coin mariés avec canapé de style henné et grands bougeoirs" className="h-[540px] w-full sm:h-[700px]" rounded="rounded-none" badge={false} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent pb-10 pt-44">
          <div className="mx-auto max-w-site px-5 sm:px-6">
            <p className="thin text-[14px]">Coin mariés · {eur(price(PRICE_IDS.coinMaries))}</p>
            <p className="mt-3 max-w-[860px] font-serif text-[38px] leading-[1.02] sm:text-[68px]">Bougeoirs de plus d’un mètre, housses et draps du canapé de style henné.</p>
          </div>
        </div>
      </section>

      {/* Panneau corail : l'étiquette des tarifs (seul accent de la page) */}
      <section className="mx-auto mt-[120px] max-w-site px-5 sm:px-6" aria-labelledby="home-prices">
        <div className="bg-brand px-6 py-10 text-white sm:px-12 sm:py-14">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <p className="thin text-[14px]">Tarifs communiqués</p>
              <h2 id="home-prices" className="mt-3 font-serif text-[44px] leading-[1.02] sm:text-[64px]">Le prix, sans détour</h2>
            </div>
            <Barcode className="h-14 w-44 text-white" />
          </div>
          <dl className="mt-10 grid gap-x-8 gap-y-6 border-t border-white/50 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {[['Décoration de table', eur(price(PRICE_IDS.decoTable)), 'par personne'], ['Mignardises', eur(price(PRICE_IDS.sucree)), 'la pièce'], ['Cocktails et mocktails', eur(price(PRICE_IDS.boisson)), 'la pièce'], ['Coin mariés', eur(price(PRICE_IDS.coinMaries)), 'forfait']].map(([k, v, u]) => (
              <div key={k}><dt className="text-[15px]">{k}</dt><dd className="mt-2 font-serif text-[48px] leading-none">{v}</dd><dd className="thin mt-1 text-[14px]">{u}</dd></div>
            ))}
          </dl>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-[520px] text-[15px] leading-[1.4]">Installation, déplacement et prestations non tarifées : sur devis. Un acompte peut être demandé.</p>
            <LinkButton href="#tarifs" variant="light">Simuler mon budget</LinkButton>
          </div>
        </div>
      </section>

      {/* Menu */}
      <section className="mx-auto mt-[120px] grid max-w-site gap-12 px-5 sm:px-6 lg:grid-cols-[1fr_1.2fr]" aria-labelledby="home-menu">
        <div>
          <p className="thin text-[14px]">Le menu traiteur</p>
          <h2 id="home-menu" className="mt-3 font-serif text-[44px] leading-[1.02] sm:text-[64px]">Mignardises<br />& mocktails</h2>
          <p className="mt-5 max-w-[460px] text-[17px] leading-[1.4] text-brun-2">Des bouchées sucrées et salées à {eur(price(PRICE_IDS.sucree))} la pièce, des mocktails à {eur(price(PRICE_IDS.boisson))}.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="#menu" variant="secondary">Voir le menu complet</LinkButton>
            <Button variant="ghost" onClick={() => { setPrefill({ services: ['mignardises', 'mocktails'], needs: 'Composition personnalisée de mignardises et mocktails : ' }); navigate('devis'); }}>Composition personnalisée</Button>
          </div>
        </div>
        <div className="grid gap-10 sm:grid-cols-2">
          {(['sucre', 'sale'] as const).map((k) => (
            <div key={k}>
              <h3 className="border-b border-smoke/60 pb-3 text-[18px]">Mignardises {k === 'sucre' ? 'sucrées' : 'salées'}</h3>
              <ul>{menu.filter((m) => m.menu === k).slice(0, 4).map((m) => <li key={m.id} className="border-b border-line py-3"><p className="text-[17px]">{m.name}</p><p className="thin text-[14px] text-brun-2">{m.ingredients}</p></li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {/* Galerie */}
      <section className="mx-auto mt-[120px] max-w-site px-5 sm:px-6" aria-labelledby="home-gallery">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="home-gallery" className="font-serif text-[44px] leading-[1.02] sm:text-[64px]">Ambiances</h2>
          <a href="#galerie" className="rounded-[24px] px-5 py-2 text-[15px] text-white no-underline ring-1 ring-inset ring-white/60 hover:bg-white hover:text-black">Voir la galerie</a>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-[1.3fr_1fr_1fr]">
          {gallery.map((g, i) => (
            <a key={g.id} href="#galerie" className={i === 0 ? 'col-span-2 md:col-span-1 md:row-span-2' : i === 3 ? 'col-span-2' : ''} aria-label={`${g.title}, voir la galerie`}>
              <Visual imageKey={galKey(g)} art={g.art} alt={g.title} className={i === 0 ? 'aspect-[4/5] w-full md:h-[calc(100%-26px)] md:aspect-auto' : 'aspect-[4/3] w-full'} rounded="rounded-none" />
              <p className="thin mt-2 text-[14px] text-smoke">{g.category} / {g.title}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Processus */}
      <section className="mx-auto mt-[120px] max-w-site px-5 sm:px-6" aria-labelledby="home-steps">
        <h2 id="home-steps" className="font-serif text-[44px] leading-[1.02] sm:text-[64px]">Réserver, en quatre temps</h2>
        <ol className="mt-12 grid border-t border-smoke/60 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="border-b border-line py-8 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0">
              <span className="display block text-[90px] text-white">{i + 1}</span>
              <h3 className="mt-6 text-[24px] leading-[1.2]">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-[1.4] text-brun-2">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Avis : exemples identifiés */}
      <section className="mx-auto mt-[120px] max-w-site px-5 sm:px-6" aria-labelledby="home-reviews">
        <p className="thin text-[14px]">Avis clients · exemples fictifs pour la démonstration</p>
        <h2 id="home-reviews" className="sr-only">Avis clients (exemples)</h2>
        <ul className="mt-6 border-t border-smoke/60">
          {EXAMPLE_REVIEWS.map((r) => (
            <li key={r.who} className="grid gap-3 border-b border-line py-8 sm:grid-cols-[1fr_200px] sm:items-end">
              <p className="font-serif text-[34px] leading-[1.05] sm:text-[48px]">{r.t}</p>
              <p className="thin text-[14px] text-smoke sm:text-right">Exemple d’avis · {r.who}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[14px] text-smoke">Ces exemples seront remplacés par de vrais avis, avec l’accord des clients.</p>
      </section>

      {/* Appel final */}
      <section className="mx-auto mt-[120px] max-w-site px-5 sm:px-6">
        <p className="display text-[15vw] text-white sm:text-[110px] lg:text-[150px]">Parlons de<br />votre événement</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <LinkButton href="#devis" size="lg" variant="primary">Demander un devis</LinkButton>
          <Button size="lg" variant="secondary" icon="play" onClick={startTour}>Découvrir la démo</Button>
        </div>
      </section>
    </>
  );
}
