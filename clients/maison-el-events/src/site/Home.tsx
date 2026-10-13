import { Icon } from '../components/Icon';
import { Visual } from '../components/Visual';
import { Button, LinkButton, Ornament, SectionTitle } from '../components/ui';
import { eur } from '../lib/format';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import { useUi } from '../lib/ui';
import type { ServiceKey } from '../lib/types';
import { galKey, SERVICE_ART } from './shared';

const STEPS = [
  { t: 'Votre demande', d: 'Vous décrivez votre événement en quelques minutes : date, lieu, nombre d’invités et envies.' },
  { t: 'Notre proposition', d: 'Nous échangeons sur vos besoins, puis vous recevez un devis détaillé.' },
  { t: 'La validation', d: 'Vous validez la proposition. Un acompte peut être demandé pour réserver la date.' },
  { t: 'Le jour J', d: 'La décoration est installée selon le projet défini ensemble. Vous profitez de vos invités.' },
];

const EXAMPLE_REVIEWS = [
  { t: '« Une table exactement comme nous l’avions imaginée, jusque dans les moindres détails. »', who: 'Exemple d’avis · mariage' },
  { t: '« Les mignardises ont fait l’unanimité et la décoration du buffet était superbe. »', who: 'Exemple d’avis · anniversaire' },
  { t: '« Un coin mariés magnifique pour notre henné, merci pour l’écoute et les conseils. »', who: 'Exemple d’avis · henné' },
];

export default function Home() {
  const { data } = useStore();
  const { setPrefill, startTour } = useUi();
  const services = data.services.filter((s) => s.active);
  const menu = data.catalog.filter((c) => c.menu && c.active);
  const gallery = data.gallery.slice(0, 5);
  const devisFor = (id: ServiceKey) => { setPrefill({ services: [id] }); navigate('devis'); };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-site items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:gap-16 lg:pb-24 lg:pt-16">
          <div className="animate-rise">
            <p className="mb-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[.3em] text-champagne-deep"><span className="h-px w-10 bg-champagne-deep/60" />Maison événementielle · {data.settings.city}</p>
            <h1 className="font-serif text-[2.9rem] font-medium leading-[1.02] text-brun sm:text-6xl lg:text-[4.4rem]">
              Vos plus beaux moments méritent une <em className="font-medium italic text-brand">mise en scène</em> unique
            </h1>
            <p className="mt-7 max-w-xl text-[16.5px] leading-relaxed text-brun-2">
              Maison EL Events imagine et installe la décoration de vos réceptions à {data.settings.city} : tables, espace mariés, buffets, location de matériel et prestations traiteur, avec des mignardises et des mocktails faits pour être partagés.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <LinkButton href="#prestations" size="lg" variant="secondary">Découvrir nos prestations</LinkButton>
              <LinkButton href="#devis" size="lg" iconRight="arrow">Créer mon événement</LinkButton>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6">
              {[['Décoration de table', `${eur(7.5)} / pers.`], ['Mignardises', `${eur(1)} pièce`], ['Coin mariés', eur(60)]].map(([k, v]) => (
                <div key={k}><dt className="text-[11px] uppercase tracking-[.16em] text-brun-3">{k}</dt><dd className="mt-1 font-serif text-2xl text-brun">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -right-3 -top-3 hidden h-full w-full rounded-[28px] border border-champagne sm:block" aria-hidden="true" />
            <Visual imageKey="cover" art="table" alt="Table de réception décorée par Maison EL Events" className="relative aspect-[4/5] shadow-lift" rounded="rounded-[28px]" />
            <p className="absolute -bottom-6 left-6 rounded-2xl bg-cream px-5 py-3 font-script text-[30px] leading-none text-brand shadow-soft">l’art de recevoir</p>
          </div>
        </div>
      </section>

      {/* Prestations */}
      <section className="mx-auto max-w-site px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="home-services">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle eyebrow="Nos prestations" title={<span id="home-services">Une réception pensée dans son ensemble</span>}>Choisissez une prestation ou composez votre événement complet, de la table au buffet.</SectionTitle>
          <LinkButton href="#prestations" variant="secondary" iconRight="arrow">Toutes les prestations</LinkButton>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <li key={s.id} className="group flex flex-col overflow-hidden rounded-[22px] border border-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-soft">
              <Visual imageKey={s.imageKey} art={SERVICE_ART[s.id]} alt={s.title} className="aspect-[4/3]" rounded="rounded-none" badge={false} />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-serif text-[22px] font-medium leading-tight text-brun">{s.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-brun-2">{s.description}</p>
                <p className="mt-auto pt-4 text-[13px] font-medium text-brand">{s.priceNote}</p>
                <button type="button" onClick={() => devisFor(s.id)} className="mt-3 inline-flex items-center gap-1.5 self-start text-[13px] text-brun-2 underline-offset-4 hover:text-brand hover:underline">Demander un devis<Icon name="arrow" className="h-3.5 w-3.5" /></button>
              </div>
            </li>
          ))}
          <li className="flex flex-col justify-between rounded-[22px] bg-brand p-6 text-cream">
            <div>
              <p className="font-script text-4xl text-champagne">sur mesure</p>
              <p className="mt-3 font-serif text-[26px] leading-tight">Composez votre événement complet</p>
              <p className="mt-3 text-sm leading-relaxed text-cream/80">Décoration, mignardises, mocktails : estimez votre budget en quelques clics.</p>
            </div>
            <LinkButton href="#tarifs" variant="light" className="mt-6 self-start" iconRight="arrow">Simuler mon budget</LinkButton>
          </li>
        </ul>
      </section>

      {/* Galerie */}
      <section className="bg-ivoire py-16 lg:py-24" aria-labelledby="home-gallery">
        <div className="mx-auto max-w-site px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle eyebrow="Galerie" title={<span id="home-gallery">Ambiances et réalisations</span>}>Les visuels ci-dessous sont temporaires : ils seront remplacés par les photographies de Maison EL Events.</SectionTitle>
            <LinkButton href="#galerie" variant="secondary" iconRight="arrow">Voir la galerie</LinkButton>
          </div>
          <div className="mt-12 grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:grid-cols-4 md:gap-4">
            {gallery.map((g, i) => (
              <a key={g.id} href="#galerie" className={i === 0 ? 'col-span-2 row-span-2' : ''} aria-label={`${g.title}, voir la galerie`}>
                <Visual imageKey={galKey(g)} art={g.art} alt={g.title} className="h-full w-full transition duration-500 hover:opacity-90" badge={i === 0} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Menu */}
      <section className="mx-auto grid max-w-site gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-24" aria-labelledby="home-menu">
        <div>
          <SectionTitle eyebrow="Le menu traiteur" title={<span id="home-menu">Mignardises & mocktails</span>}>Des bouchées sucrées et salées à 1 € la pièce et des mocktails à 4 €, pour accompagner votre réception.</SectionTitle>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="#menu" iconRight="arrow">Voir le menu complet</LinkButton>
            <Button variant="secondary" onClick={() => { setPrefill({ services: ['mignardises', 'mocktails'], needs: 'Composition personnalisée de mignardises et mocktails : ' }); navigate('devis'); }}>Composition personnalisée</Button>
          </div>
        </div>
        <div className="relative rounded-[26px] border border-champagne bg-white p-7 shadow-soft sm:p-10">
          <div className="absolute inset-3 rounded-[20px] border border-line" aria-hidden="true" />
          <div className="relative">
            <p className="text-center font-script text-4xl text-brand">Menu</p>
            <Ornament className="mx-auto mt-2" />
            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              {(['sucre', 'sale'] as const).map((k) => (
                <div key={k}>
                  <h3 className="text-center text-[11px] font-medium uppercase tracking-[.26em] text-champagne-deep">Mignardises {k === 'sucre' ? 'sucrées' : 'salées'} · {eur(1)}</h3>
                  <ul className="mt-4 space-y-3">
                    {menu.filter((m) => m.menu === k).slice(0, 3).map((m) => (
                      <li key={m.id} className="text-center"><p className="font-serif text-lg leading-tight text-brun">{m.name}</p><p className="text-xs italic text-brun-3">{m.ingredients}</p></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-line pt-6 text-center">
              <h3 className="text-[11px] font-medium uppercase tracking-[.26em] text-champagne-deep">Mocktails · {eur(4)}</h3>
              <p className="mt-2 font-serif text-lg text-brun">{menu.filter((m) => m.menu === 'mocktail').map((m) => m.name).join(' · ')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Processus */}
      <section className="bg-white py-16 lg:py-24" aria-labelledby="home-steps">
        <div className="mx-auto max-w-site px-4 sm:px-6">
          <SectionTitle eyebrow="Réserver" title={<span id="home-steps">Comment se passe une réservation ?</span>} align="center" />
          <ol className="mt-14 grid gap-8 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="relative border-t border-champagne pt-6">
                <span className="font-serif text-5xl italic text-champagne-deep">{i + 1}</span>
                <h3 className="mt-3 font-serif text-2xl text-brun">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brun-2">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Avis d'exemple */}
      <section className="mx-auto max-w-site px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="home-reviews">
        <SectionTitle eyebrow="Avis" title={<span id="home-reviews">La place de vos avis clients</span>} align="center">
          Exemples affichés pour la démonstration : ils seront remplacés par de vrais avis, après autorisation des clients.
        </SectionTitle>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {EXAMPLE_REVIEWS.map((r) => (
            <li key={r.who} className="relative rounded-[22px] border border-dashed border-champagne-deep/40 bg-white p-7">
              <span className="absolute right-5 top-5 rounded-full bg-[#FBF1DF] px-2.5 py-0.5 text-[11px] font-medium text-warn">Exemple fictif</span>
              <p className="text-champagne-deep" aria-hidden="true">★★★★★</p>
              <p className="mt-4 font-serif text-xl leading-snug text-brun">{r.t}</p>
              <p className="mt-5 text-xs uppercase tracking-[.16em] text-brun-3">{r.who}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Appel final */}
      <section className="px-4 sm:px-6">
        <div className="relative mx-auto max-w-site overflow-hidden rounded-[30px] bg-brand px-6 py-14 text-center text-cream sm:px-12 lg:py-20">
          <div className="absolute inset-4 rounded-[24px] border border-champagne/30" aria-hidden="true" />
          <div className="relative">
            <p className="font-script text-5xl text-champagne">Parlons de votre événement</p>
            <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-cream/85">Décrivez votre projet : vous recevrez une proposition adaptée à votre date, votre lieu et vos invités.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="#devis" size="lg" variant="light" iconRight="arrow">Demander un devis</LinkButton>
              <Button size="lg" variant="ghost" className="text-cream ring-1 ring-inset ring-cream/40 hover:bg-cream/10 hover:text-cream" icon="play" onClick={startTour}>Découvrir la démo</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
