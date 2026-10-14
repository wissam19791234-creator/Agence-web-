import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { A11y, Keyboard, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Icon } from '../components/Icon';
import { Visual } from '../components/Visual';
import { Button, cx, Eyebrow, LinkButton, Modal } from '../components/ui';
import { EVENT_TYPES, PRICE_IDS } from '../lib/constants';
import { eur } from '../lib/format';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { EventType, ServiceKey, SiteService } from '../lib/types';
import { useUi } from '../lib/ui';
import { countUp, gsap, reducedMotion, scrollToY, ScrollTrigger, useReveal } from './motion';
import { FaqList, PracticalInfo } from './Pages';

/* ───────────── Données de présentation (issues des informations communiquées) ───────────── */
const STAGES = [
  { img: 'cover', eyebrow: 'Décoration événementielle & traiteur', title: ['Moments', 'inoubliables'], desc: 'Décoration de tables, coin mariés, buffets et traiteur pour vos réceptions à Orléans.', a: { label: 'Créer mon événement', href: '#devis' }, b: { label: 'Nos prestations', href: '#prestations' } },
  { img: 'coin-maries', eyebrow: 'Mariages & henné', title: ['Élégance', 'sur mesure'], desc: 'Bougeoirs de plus d’un mètre, canapé de style henné, housses et draps : un coin mariés pensé dans le détail.', a: { label: 'Réserver le coin mariés', href: '#devis' }, b: { label: 'Simuler mon budget', href: '#budget' } },
  { img: 'menu-mocktail', eyebrow: 'Mignardises & mocktails', title: ['Saveurs', 'partagées'], desc: 'Verrines, tartelettes, makis, mini burgers et mocktails maison pour régaler vos invités.', a: { label: 'Voir le menu', href: '#menu' }, b: { label: 'Demander un devis', href: '#devis' } },
];

const CATEGORY: Record<ServiceKey, 'Décoration' | 'Traiteur' | 'Location'> = {
  'deco-tables': 'Décoration', mariage: 'Décoration', buffets: 'Décoration', location: 'Location', traiteur: 'Traiteur', mignardises: 'Traiteur', mocktails: 'Traiteur',
};
const SPECS: Record<ServiceKey, string[]> = {
  'deco-tables': ['Linge de table', 'Vaisselle', 'Cartes de bienvenue'],
  mariage: ['Bougeoirs + 1 m', 'Canapé style henné', 'Housses & draps'],
  buffets: ['Buffets sucrés', 'Buffets salés', 'Accord avec la salle'],
  location: ['Matériel', 'Éléments décoratifs'],
  traiteur: ['Composition sur mesure', 'Selon vos invités'],
  mignardises: ['Verrines', 'Tartelettes', 'Mini burgers'],
  mocktails: ['Matcha fraise', 'Thé glacé pêche', 'Violet citron'],
};
const TABS = ['Toutes', 'Décoration', 'Traiteur', 'Location'] as const;

const EVENTS: { type: EventType; img: string; d: string }[] = [
  { type: 'Mariage', img: 'gal-arche', d: 'Cérémonie, réception et coin mariés : un décor cohérent, du premier regard au dernier verre.' },
  { type: 'Henné', img: 'coin-maries', d: 'Canapé de style henné, grands bougeoirs et fleurs pour une soirée haute en couleurs.' },
  { type: 'Anniversaire', img: 'evt-anniversaire', d: 'Table gourmande, ballons et fleurs : une fête à votre image, de 20 à 200 invités.' },
  { type: 'Baptême', img: 'evt-bapteme', d: 'Blanc, ivoire et doré : une décoration lumineuse et délicate pour accueillir les invités.' },
  { type: 'Baby shower', img: 'evt-babyshower', d: 'Tons doux, mignardises et mocktails pour un moment tendre entre proches.' },
  { type: "Événement d'entreprise", img: 'evt-entreprise', d: 'Cocktail dînatoire, bouchées salées et mocktails pour vos équipes et vos clients.' },
];

const FEATURES = [
  { t: 'Décoration sur mesure', d: 'Linge de table, vaisselle, décorations diverses et cartes de bienvenue ou de remerciement.', icon: 'M4 20h16M6 20V9l6-5 6 5v11M10 20v-5h4v5' },
  { t: 'Coin mariés signature', d: 'Bougeoirs de plus d’un mètre, housses et draps du canapé de style henné.', icon: 'M12 21s-7-4.4-9.3-8.6C1.1 9.3 3 5.5 6.6 5.5c2 0 3.4 1.2 5.4 3.3 2-2.1 3.4-3.3 5.4-3.3 3.6 0 5.5 3.8 3.9 6.9C19 16.6 12 21 12 21z' },
  { t: 'Mignardises & mocktails', d: 'Sucré, salé et boissons sans alcool, à composer selon le nombre d’invités.', icon: 'M7 3h10l-1.5 8a3.5 3.5 0 0 1-7 0L7 3zM12 14.5V21M8.5 21h7' },
  { t: 'Installation le jour J', d: 'La décoration est installée selon le projet défini ensemble ; déplacement chiffré sur devis.', icon: 'M3 12l2-2 4 4 10-10 2 2-12 12z' },
];

const EXAMPLE_REVIEWS = [
  { t: 'Une table exactement comme nous l’avions imaginée. Les invités n’ont parlé que de la décoration.', who: 'Exemple · Mariage', i: 'M' },
  { t: 'Les mignardises ont fait l’unanimité, et le coin mariés était magnifique en photo.', who: 'Exemple · Henné', i: 'H' },
  { t: 'Réactive, à l’écoute, et un buffet superbe pour l’anniversaire de ma fille.', who: 'Exemple · Anniversaire', i: 'A' },
];

/* ───────────── 1. Ouverture épinglée en trois temps ───────────── */
function Hero() {
  const runway = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [stage, setStage] = useState(0);
  const static_ = reducedMotion();

  useLayoutEffect(() => {
    if (static_ || !runway.current) return;
    const ctx = gsap.context(() => {
      const layers = gsap.utils.toArray<HTMLElement>('[data-hero-layer]');
      gsap.set(layers, { opacity: (i: number) => (i === 0 ? 1 : 0), scale: 1.12 });
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: runway.current, start: 'top top', end: 'bottom bottom', scrub: 1 } });
      tl.to(layers[0], { scale: 1, duration: 0.36 }, 0)
        .to(layers[1], { opacity: 1, duration: 0.06 }, 0.3).to(layers[1], { scale: 1, duration: 0.36 }, 0.3)
        .to(layers[2], { opacity: 1, duration: 0.06 }, 0.63).to(layers[2], { scale: 1, duration: 0.37 }, 0.63);
      ScrollTrigger.create({
        trigger: runway.current, start: 'top top', end: 'bottom bottom',
        onUpdate: (self) => {
          const p = self.progress;
          setStage(p < 0.33 ? 0 : p < 0.67 ? 1 : 2);
          if (bar.current) bar.current.style.transform = `scaleX(${0.15 + p * 0.85})`;
        },
      });
    }, runway);
    return () => ctx.revert();
  }, [static_]);

  const goStage = (i: number) => {
    const el = runway.current; if (!el) return;
    scrollToY(el.offsetTop + (el.offsetHeight - window.innerHeight) * (i / 3 + 0.08));
  };
  const s = STAGES[stage];

  return (
    <section ref={runway} className={cx('relative', static_ ? 'h-[100svh]' : 'h-[300vh]')} aria-label="Présentation">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {STAGES.map((x, i) => (
          <div key={x.img} data-hero-layer className="absolute inset-0 will-change-transform" style={{ opacity: i === 0 ? 1 : 0 }}>
            <Visual imageKey={x.img} art="table" alt={x.title.join(' ')} className="h-full w-full" rounded="" eager badge={false} />
          </div>
        ))}
        {/* Pas de voile plein écran : un léger dégradé localisé pour la lisibilité. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-navy/70 to-transparent" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_75%_60%_at_100%_100%,rgba(7,15,23,.72),transparent_70%)] max-sm:[background:linear-gradient(to_top,rgba(7,15,23,.85),transparent_60%)]" />

        <div className="absolute bottom-28 left-5 right-5 z-10 text-left sm:bottom-[110px] sm:left-auto sm:right-10 sm:max-w-[600px] sm:text-right lg:right-20">
          <div key={stage} className="animate-rise">
            <p className="mono text-brand text-shadow-sm sm:justify-end">{s.eyebrow}</p>
            <h1 className="mt-4 font-serif text-[clamp(46px,7.2vw,80px)] font-medium leading-[1.02] text-white text-shadow">{s.title[0]} <em className="text-gold-light">{s.title[1]}</em></h1>
            <p className="mt-5 max-w-[480px] text-[16px] leading-[1.6] text-white/[.92] text-shadow-sm sm:ml-auto">{s.desc}</p>
            <div className="mt-8 flex flex-wrap gap-3 sm:justify-end">
              <LinkButton href={s.a.href} size="lg" iconRight="arrow">{s.a.label}</LinkButton>
              {s.b.href === '#budget'
                ? <Button size="lg" variant="secondary" onClick={() => { const b = document.getElementById('budget'); if (b) scrollToY(b.getBoundingClientRect().top + window.scrollY - 40); }}>{s.b.label}</Button>
                : <LinkButton href={s.b.href} size="lg" variant="secondary">{s.b.label}</LinkButton>}
            </div>
          </div>
        </div>

        <p className="absolute bottom-11 left-5 z-10 flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[.2em] text-white text-shadow-sm sm:left-10 lg:left-20">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z" /><circle cx="12" cy="9.8" r="2.3" /></svg>
          Orléans · Loiret
        </p>
        <div className="absolute bottom-10 right-5 z-10 flex items-center gap-4 sm:right-10 lg:right-20">
          <div className="flex gap-3">
            {STAGES.map((_, i) => (
              <button key={i} type="button" onClick={() => goStage(i)} aria-label={`Étape ${i + 1}`} aria-current={stage === i ? 'step' : undefined}
                className={cx('text-[13px] tabular transition', stage === i ? 'font-bold text-brand' : 'text-white/70 hover:text-white')}>{String(i + 1).padStart(2, '0')}</button>
            ))}
          </div>
          <span className="relative hidden h-[2px] w-28 overflow-hidden bg-white/25 sm:block"><span ref={bar} className="absolute inset-0 origin-left bg-brand" style={{ transform: 'scaleX(.15)' }} /></span>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 2. Savoir-faire et tarifs animés ───────────── */
function About() {
  const { data } = useStore();
  const price = (id: string) => data.catalog.find((c) => c.id === id)?.price ?? 0;
  const stats = [
    { v: price(PRICE_IDS.decoTable), l: 'Décoration de table', u: 'par personne' },
    { v: price(PRICE_IDS.sucree), l: 'Mignardise', u: 'la pièce' },
    { v: price(PRICE_IDS.boisson), l: 'Mocktail', u: 'la pièce' },
    { v: price(PRICE_IDS.coinMaries), l: 'Coin mariés', u: 'forfait' },
  ];
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    const kills = stats.map((s, i) => refs.current[i] ? countUp(refs.current[i]!, s.v, (n) => eur(Math.round(n * 100) / 100)) : () => {});
    return () => kills.forEach((k) => k());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.map((s) => s.v).join()]);

  return (
    <section className="bg-alabaster py-24 text-ink sm:py-32" aria-labelledby="about-t">
      <div className="mx-auto grid max-w-site items-center gap-14 px-6 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-[70px]">
        <div data-reveal className="relative aspect-[4/3.6] overflow-hidden rounded-box shadow-lg">
          <div data-parallax className="absolute -inset-y-[8%] inset-x-0"><Visual imageKey="about" art="table" alt="Composition florale en cours sur une table de réception" className="h-full w-full" rounded="" badge={false} /></div>
          <p className="absolute left-7 top-6 font-serif text-[34px] italic leading-none text-white [text-shadow:0_4px_18px_rgba(0,0,0,.6)] sm:text-[40px]">Fait main</p>
          <span className="mono absolute bottom-4 right-4 rounded-full bg-navy/60 px-3 py-1 !text-[9.5px] text-white/85 backdrop-blur">Visuel de démonstration</span>
        </div>
        <div>
          <div data-reveal><Eyebrow className="!text-[#8A6530]">Notre savoir-faire</Eyebrow></div>
          <h2 id="about-t" data-reveal className="mt-5 font-serif text-[clamp(34px,4.2vw,54px)] leading-[1.12] text-ink">L’art de recevoir, <em className="text-gold-dark">dans le moindre détail</em></h2>
          <p data-reveal className="mt-6 max-w-[560px] text-[16px] leading-[1.7] text-ink-muted">Maison EL Events imagine et installe la décoration de vos réceptions à {data.settings.city} : tables, espace mariés, buffets, location de matériel et prestations traiteur, avec des mignardises et des mocktails à partager. Des tarifs clairs, une installation le jour J, et un décor à votre image.</p>
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-navy/10 pt-10 sm:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.l} data-reveal>
                <dd className="font-serif text-[40px] font-semibold leading-none text-ink tabular"><span ref={(el) => { refs.current[i] = el; }}>{eur(s.v)}</span></dd>
                <dt className="mt-3 text-[13px] font-medium text-ink">{s.l}</dt>
                <dd className="text-[12px] text-ink-muted">{s.u}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 3. Prestations : onglets, cartes, fiche détail ───────────── */
function Fleet() {
  const { data } = useStore();
  const { setPrefill } = useUi();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Toutes');
  const [open, setOpen] = useState<SiteService | null>(null);
  const list = data.services.filter((s) => s.active && (tab === 'Toutes' || CATEGORY[s.id] === tab));
  const devisFor = (id: ServiceKey) => { setPrefill({ services: [id] }); setOpen(null); navigate('devis'); };
  useEffect(() => { ScrollTrigger.refresh(); }, [tab]);

  return (
    <section className="bg-navy py-24 sm:py-32" aria-labelledby="fleet-t">
      <div className="mx-auto max-w-site px-6 sm:px-8">
        <div className="text-center">
          <div data-reveal className="flex justify-center"><Eyebrow>Prestations signature</Eyebrow></div>
          <h2 id="fleet-t" data-reveal className="mt-5 font-serif text-[clamp(34px,4.2vw,54px)] leading-[1.12]">Un décor complet, <em className="text-brand">pensé pour vous</em></h2>
          <div data-reveal className="mt-10 flex flex-wrap justify-center gap-2.5" role="tablist" aria-label="Catégories de prestations">
            {TABS.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={cx('rounded-full border px-5 py-2.5 text-[13px] font-semibold tracking-[.03em] transition-all duration-300', tab === t ? 'border-brand bg-brand text-navy shadow-gold' : 'border-white/20 text-white/80 hover:border-brand hover:text-brand')}>{t}</button>
            ))}
          </div>
        </div>
        <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <article key={s.id} className="group relative flex flex-col overflow-hidden rounded-box border border-white/10 bg-navy-card transition-all duration-500 ease-lux hover:-translate-y-2 hover:border-brand hover:shadow-deep">
              <button type="button" onClick={() => setOpen(s)} className="absolute inset-0 z-10" aria-label={`Voir le détail : ${s.title}`} />
              <div className="relative aspect-[4/3] overflow-hidden">
                <Visual imageKey={s.imageKey} art="table" alt={s.title} className="h-full w-full transition-transform duration-[800ms] ease-lux group-hover:scale-[1.08]" rounded="" badge={false} />
                <span className="mono absolute left-4 top-4 rounded-full bg-navy/70 px-3 py-1.5 !text-[10px] text-brand backdrop-blur">{CATEGORY[s.id]}</span>
              </div>
              <div className="flex flex-1 flex-col gap-6 p-6">
                <div><h3 className="font-serif text-[25px] leading-[1.2]">{s.title}</h3>
                <p className="mt-3 text-[12px] font-medium uppercase tracking-[.12em] text-white/55">{SPECS[s.id].join(' • ')}</p></div>
                <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                  <p className="text-[15px] text-white/90"><span className="text-[12px] text-white/55">Tarif · </span><span className="font-semibold text-brand">{s.priceNote}</span></p>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-brand/50 text-brand transition-all duration-500 ease-lux group-hover:rotate-[-45deg] group-hover:bg-brand group-hover:text-navy"><Icon name="arrow" className="h-4 w-4" /></span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''} size="lg"
        footer={open && <><Button variant="secondary" onClick={() => setOpen(null)}>Fermer</Button><Button iconRight="arrow" onClick={() => devisFor(open.id)}>Demander un devis</Button></>}>
        {open && <>
          <Visual imageKey={open.imageKey} art="table" alt={open.title} className="aspect-[16/9]" rounded="rounded-card" />
          <p className="mono mt-5 text-brand">{CATEGORY[open.id]} · {open.priceNote}</p>
          <p className="mt-3 text-[16px] leading-[1.7] text-white/80">{open.description}</p>
          <ul className="mt-5 flex flex-wrap gap-2">{SPECS[open.id].map((x) => <li key={x} className="rounded-full border border-white/15 px-3 py-1.5 text-[13px] text-white/80">{x}</li>)}</ul>
          <p className="mt-5 text-[13px] text-white/55">Installation et déplacement : sur devis. Un acompte peut être demandé.</p>
        </>}
      </Modal>
    </section>
  );
}

/* ───────────── 4. Expérience : visuel plein cadre + points forts ───────────── */
function Split() {
  const [open, setOpen] = useState(false);
  return (
    <section className="grid lg:min-h-[700px] lg:grid-cols-[1fr_1.05fr]" aria-labelledby="split-t">
      <div className="relative min-h-[460px] overflow-hidden">
        <div data-parallax className="absolute -inset-y-[8%] inset-x-0"><Visual imageKey="gal-centre" art="table" alt="Table ronde dressée vue du dessus : fleurs, bougies et assiettes dorées" className="h-full w-full" rounded="" badge={false} /></div>
        <button type="button" onClick={() => setOpen(true)} className="group absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-navy shadow-gold transition hover:scale-105" aria-label="Voir les ambiances en diaporama">
          <span className="absolute inset-0 rounded-full border border-brand [animation:pulse-ring_2.2s_ease-out_infinite]" />
          <span className="absolute inset-0 rounded-full border border-brand [animation:pulse-ring_2.2s_ease-out_1.1s_infinite]" />
          <Icon name="play" className="relative h-7 w-7 translate-x-0.5" />
        </button>
        <span className="mono absolute bottom-4 left-4 rounded-full bg-navy/60 px-3 py-1 !text-[9.5px] text-white/85 backdrop-blur">Visuel de démonstration</span>
      </div>
      <div className="flex flex-col justify-center bg-parchment px-6 py-20 text-ink sm:px-14 lg:px-20 lg:py-24">
        <div data-reveal><Eyebrow className="!text-[#8A6530]">Votre événement</Eyebrow></div>
        <h2 id="split-t" data-reveal className="mt-5 font-serif text-[clamp(34px,4vw,52px)] leading-[1.12]">Un décor pensé <em className="text-gold-dark">de A à Z</em></h2>
        <ul className="mt-10 grid gap-8">
          {FEATURES.map((f) => (
            <li key={f.t} data-reveal className="flex gap-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold-dark/40 bg-white text-gold-dark"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={f.icon} /></svg></span>
              <span><span className="block font-serif text-[22px] font-semibold leading-tight">{f.t}</span><span className="mt-1.5 block text-[15px] leading-[1.65] text-ink-muted">{f.d}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <Slideshow open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

function Slideshow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useStore();
  const items = data.gallery;
  const [i, setI] = useState(0);
  useEffect(() => { if (!open) return; setI(0); const t = setInterval(() => setI((x) => (x + 1) % items.length), 3800); return () => clearInterval(t); }, [open, items.length]);
  const g = items[i];
  return (
    <Modal open={open} onClose={onClose} title="Ambiances" size="xl">
      {g && <>
        <div className="relative aspect-[16/10] overflow-hidden rounded-card">
          {items.map((x, k) => <div key={x.id} className={cx('absolute inset-0 transition-opacity duration-1000', k === i ? 'opacity-100' : 'opacity-0')}><Visual imageKey={x.imageKey || `gal-${x.id}`} art={x.art} alt={x.title} className="h-full w-full" rounded="" badge={k === i} /></div>)}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p><span className="mono text-brand">{g.category}</span><span className="ml-3 font-serif text-[22px]">{g.title}</span></p>
          <div className="flex gap-2"><Button size="sm" variant="secondary" icon="left" onClick={() => setI((i - 1 + items.length) % items.length)} aria-label="Précédent">Préc.</Button><Button size="sm" variant="secondary" iconRight="right" onClick={() => setI((i + 1) % items.length)}>Suiv.</Button></div>
        </div>
      </>}
    </Modal>
  );
}

/* ───────────── 5. Événements : carrousel ───────────── */
function Events() {
  const { setPrefill } = useUi();
  const prev = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const ask = (t: EventType) => { setPrefill({ eventType: EVENT_TYPES.includes(t) ? t : 'Autre' }); navigate('devis'); };
  return (
    <section className="overflow-hidden bg-alabaster py-24 text-ink sm:py-32" aria-labelledby="events-t">
      <div className="mx-auto grid max-w-site items-center gap-12 px-6 sm:px-8 lg:grid-cols-[380px_1fr] lg:gap-[60px]">
        <div>
          <div data-reveal><Eyebrow className="!text-[#8A6530]">Vos événements</Eyebrow></div>
          <h2 id="events-t" data-reveal className="mt-5 font-serif text-[clamp(34px,4vw,52px)] leading-[1.12]">Chaque célébration <em className="text-gold-dark">a son style</em></h2>
          <p data-reveal className="mt-6 text-[16px] leading-[1.7] text-ink-muted">Mariages, hennés, anniversaires, baptêmes, baby showers ou cocktails d’entreprise : la décoration et le buffet s’adaptent à votre réception.</p>
          <div data-reveal className="mt-8 flex gap-3">
            <button ref={prev} type="button" aria-label="Événement précédent" className="grid h-12 w-12 place-items-center rounded-full border border-navy/20 text-ink transition hover:border-gold-dark hover:bg-gold-dark hover:text-white disabled:opacity-30"><Icon name="left" className="h-4 w-4" /></button>
            <button ref={next} type="button" aria-label="Événement suivant" className="grid h-12 w-12 place-items-center rounded-full border border-navy/20 text-ink transition hover:border-gold-dark hover:bg-gold-dark hover:text-white disabled:opacity-30"><Icon name="right" className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="min-w-0" data-reveal>
          {ready && (
            <Swiper modules={[Navigation, A11y, Keyboard]} navigation={{ prevEl: prev.current, nextEl: next.current }} keyboard={{ enabled: true }}
              spaceBetween={24} slidesPerView={1.15} breakpoints={{ 640: { slidesPerView: 2.1 }, 1100: { slidesPerView: 2.6 } }}
              className="!overflow-visible !pb-12" a11y={{ prevSlideMessage: 'Précédent', nextSlideMessage: 'Suivant' }}>
              {EVENTS.map((e) => (
                <SwiperSlide key={e.type} className="!h-auto">
                  <article className="group flex h-full flex-col overflow-hidden rounded-box bg-white shadow-[0_20px_45px_rgba(7,15,23,.14)] transition-all duration-500 ease-lux hover:-translate-y-1.5 hover:shadow-[0_28px_60px_rgba(7,15,23,.2)]">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Visual imageKey={e.img} art="table" alt={e.type} className="h-full w-full transition-transform duration-[800ms] ease-lux group-hover:scale-[1.06]" rounded="" badge={false} />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 to-transparent p-6 pt-20">
                        <h3 className="font-serif text-[28px] leading-none text-white">{e.type === "Événement d'entreprise" ? 'Entreprise' : e.type}</h3>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="text-[14.5px] leading-[1.65] text-ink-muted">{e.d}</p>
                      <button type="button" onClick={() => ask(e.type)} className="mt-5 inline-flex items-center gap-2 self-start text-[13px] font-semibold uppercase tracking-[.12em] text-gold-dark transition group-hover:gap-3">Demander un devis <Icon name="arrow" className="h-4 w-4" /></button>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────── 6. Bannière panoramique : simulateur de budget ───────────── */
function Step({ label, value, set, max }: { label: string; value: number; set: (n: number) => void; max: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[14px] text-white/85">{label}</span>
      <span className="flex items-center gap-1 rounded-full border border-white/20 bg-white/5 p-1">
        <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-white/10 disabled:opacity-30" aria-label={`Moins : ${label}`} disabled={value <= 0} onClick={() => set(Math.max(0, value - 1))}>−</button>
        <span className="w-6 text-center text-[15px] font-semibold tabular" aria-live="polite">{value}</span>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-white/10 disabled:opacity-30" aria-label={`Plus : ${label}`} disabled={value >= max} onClick={() => set(Math.min(max, value + 1))}>+</button>
      </span>
    </div>
  );
}

function Check({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-[14px] text-white/85">{label}
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--brand))]" />
    </label>
  );
}

function Budget() {
  const { data } = useStore();
  const { setPrefill } = useUi();
  const price = (id: string) => data.catalog.find((c) => c.id === id)?.price ?? 0;
  const [guests, setGuests] = useState(80);
  const [deco, setDeco] = useState(true);
  const [mign, setMign] = useState(3);
  const [mock, setMock] = useState(1);
  const [coin, setCoin] = useState(false);
  const rows = useMemo(() => [
    deco && { k: 'Décoration de table', v: guests * price(PRICE_IDS.decoTable), d: `${guests} × ${eur(price(PRICE_IDS.decoTable))}` },
    mign > 0 && { k: 'Mignardises', v: guests * mign * price(PRICE_IDS.sucree), d: `${guests * mign} pièces × ${eur(price(PRICE_IDS.sucree))}` },
    mock > 0 && { k: 'Mocktails', v: guests * mock * price(PRICE_IDS.boisson), d: `${guests * mock} verres × ${eur(price(PRICE_IDS.boisson))}` },
    coin && { k: 'Coin mariés', v: price(PRICE_IDS.coinMaries), d: 'forfait' },
  ].filter(Boolean) as { k: string; v: number; d: string }[], [guests, deco, mign, mock, coin, data.catalog]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = rows.reduce((a, r) => a + r.v, 0);
  const out = useRef<HTMLSpanElement>(null);
  const shown = useRef({ v: total });
  useEffect(() => {
    if (!out.current) return;
    if (reducedMotion()) { out.current.textContent = eur(total); return; }
    const t = gsap.to(shown.current, { v: total, duration: 0.7, ease: 'power3.out', onUpdate: () => { if (out.current) out.current.textContent = eur(Math.round(shown.current.v)); } });
    return () => { t.kill(); };
  }, [total]);
  const ask = () => {
    const services: ServiceKey[] = [...(deco ? ['deco-tables' as const] : []), ...(mign ? ['mignardises' as const] : []), ...(mock ? ['mocktails' as const] : []), ...(coin ? ['mariage' as const] : [])];
    setPrefill({ guests, services, needs: `Estimation du site : ${rows.map((r) => `${r.k} (${r.d})`).join(', ')} — total indicatif ${eur(total)}.` });
    navigate('devis');
  };
  return (
    <section id="budget" className="relative overflow-hidden py-24 sm:py-32" aria-labelledby="budget-t">
      <div data-parallax className="absolute -inset-y-[10%] inset-x-0"><Visual imageKey="cta-sunset" art="table" alt="Terrasse de réception au coucher du soleil au-dessus de la Loire" className="h-full w-full" rounded="" badge={false} /></div>
      <div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/50 to-navy/20" />
      <div className="relative mx-auto grid max-w-site items-center gap-12 px-6 sm:px-8 lg:grid-cols-[1fr_460px]">
        <div>
          <div data-reveal><Eyebrow>Simulateur de budget</Eyebrow></div>
          <h2 id="budget-t" data-reveal className="mt-5 font-serif text-[clamp(38px,5vw,64px)] leading-[1.05] text-shadow">Votre réception, <em className="text-gold-light">au juste prix</em></h2>
          <p data-reveal className="mt-6 max-w-[480px] text-[16px] leading-[1.7] text-white/85 text-shadow-sm">Les tarifs communiqués par Maison EL Events, appliqués à votre nombre d’invités. Installation, déplacement et prestations non tarifées : sur devis.</p>
          <span className="mono mt-8 inline-block rounded-full bg-navy/50 px-3 py-1 !text-[9.5px] text-white/80 backdrop-blur">Visuel de démonstration</span>
        </div>
        <div data-reveal className="rounded-box border border-white/15 bg-navy/70 p-6 shadow-lg backdrop-blur-xl sm:p-8" aria-live="polite">
          <label htmlFor="budget-guests" className="flex items-baseline justify-between"><span className="mono text-brand">Invités</span><span className="font-serif text-[34px] leading-none tabular">{guests}</span></label>
          <input id="budget-guests" type="range" min={10} max={300} step={5} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-4 w-full accent-[rgb(var(--brand))]" />
          <div className="mt-6 grid gap-4 border-t border-white/10 pt-6">
            <Check label={`Décoration de table (${eur(price(PRICE_IDS.decoTable))} / pers.)`} on={deco} set={setDeco} />
            <Step label="Mignardises par invité" value={mign} set={setMign} max={8} />
            <Step label="Mocktails par invité" value={mock} set={setMock} max={4} />
            <Check label={`Coin mariés (${eur(price(PRICE_IDS.coinMaries))})`} on={coin} set={setCoin} />
          </div>
          <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/10 pt-6">
            <span><span className="mono block text-white/60">Total indicatif</span><span className="text-[12px] text-white/50">hors installation et déplacement</span></span>
            <span ref={out} className="font-serif text-[46px] font-semibold leading-none text-brand tabular">{eur(total)}</span>
          </div>
          <Button size="lg" className="mt-6 w-full" iconRight="arrow" onClick={ask}>Recevoir mon devis</Button>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 7. Le menu ───────────── */
function MenuTrio() {
  const { data } = useStore();
  const menu = data.catalog.filter((c) => c.menu && c.active);
  const cols = [['sucre', 'Sucré', 'menu-sucre'], ['sale', 'Salé', 'menu-sale'], ['mocktail', 'Mocktails', 'menu-mocktail']] as const;
  return (
    <section className="bg-navy py-24 sm:py-32" aria-labelledby="menu-t">
      <div className="mx-auto max-w-site px-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div data-reveal><Eyebrow>Le menu traiteur</Eyebrow></div>
            <h2 id="menu-t" data-reveal className="mt-5 font-serif text-[clamp(34px,4.2vw,54px)] leading-[1.12]">Mignardises <em className="text-brand">& mocktails</em></h2>
          </div>
          <div data-reveal><LinkButton href="#menu" variant="secondary" iconRight="arrow">Voir le menu complet</LinkButton></div>
        </div>
        <div className="mt-14 grid gap-7 md:grid-cols-3">
          {cols.map(([k, label, img]) => {
            const items = menu.filter((m) => m.menu === k);
            const p = items[0]?.price;
            return (
              <article key={k} data-reveal className="group overflow-hidden rounded-box border border-white/10 bg-navy-card">
                <div className="relative aspect-[16/11] overflow-hidden"><Visual imageKey={img} art="verrine" alt={label} className="h-full w-full transition-transform duration-[800ms] ease-lux group-hover:scale-[1.06]" rounded="" badge={false} /></div>
                <div className="p-6">
                  <div className="flex items-baseline justify-between"><h3 className="font-serif text-[28px]">{label}</h3><span className="text-[14px] font-semibold text-brand">{p != null ? `${eur(p)} ${k === 'mocktail' ? 'le verre' : 'la pièce'}` : 'Sur devis'}</span></div>
                  <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">{items.slice(0, 5).map((m) => <li key={m.id} className="py-2.5"><p className="text-[15px]">{m.name}</p><p className="text-[13px] text-white/50">{m.ingredients}</p></li>)}</ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────── 8. Avis (exemples) ───────────── */
function Reviews() {
  const [i, setI] = useState(0);
  useEffect(() => { if (reducedMotion()) return; const t = setInterval(() => setI((x) => (x + 1) % EXAMPLE_REVIEWS.length), 6000); return () => clearInterval(t); }, []);
  const r = EXAMPLE_REVIEWS[i];
  return (
    <section className="border-t border-white/10 bg-navy py-24 text-center sm:py-32" aria-labelledby="rev-t">
      <div className="mx-auto max-w-[900px] px-6">
        <h2 id="rev-t" className="sr-only">Avis clients (exemples)</h2>
        <svg viewBox="0 0 48 36" className="mx-auto h-10 w-12 text-brand" fill="currentColor" aria-hidden="true"><path d="M0 36V22C0 9.6 6.2 2.3 18.6 0l2.2 4.4C13.6 6.5 10.2 10.8 10 17h9v19H0zm27 0V22c0-12.4 6.2-19.7 18.6-22L48 4.4C40.6 6.5 37.2 10.8 37 17h9v19H27z" /></svg>
        <div key={i} className="animate-rise">
          <p className="mt-8 font-serif text-[clamp(26px,3.4vw,40px)] italic leading-[1.3] text-white">« {r.t} »</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-brand/60 font-serif text-[20px] text-brand">{r.i}</span>
            <span className="text-left"><span className="block text-[14px] font-semibold">Avis d’exemple</span><span className="mono !text-[10px] text-white/55">{r.who}</span></span>
          </div>
        </div>
        <div className="mt-10 flex justify-center gap-2.5">
          {EXAMPLE_REVIEWS.map((_, k) => <button key={k} type="button" aria-label={`Avis ${k + 1}`} aria-current={k === i ? 'true' : undefined} onClick={() => setI(k)} className={cx('h-2 rounded-full transition-all duration-500', k === i ? 'w-8 bg-brand' : 'w-2 bg-white/30 hover:bg-white/60')} />)}
        </div>
        <p className="mt-8 text-[13px] text-white/45">Avis fictifs pour la démonstration : ils seront remplacés par de vrais avis, avec l’accord des clients.</p>
      </div>
    </section>
  );
}

/* ───────────── 9. Questions fréquentes ───────────── */
function FaqBlock() {
  return (
    <section className="border-t border-white/10 bg-navy py-24 sm:py-32" aria-labelledby="faq-t">
      <div className="mx-auto grid max-w-site gap-12 px-6 sm:px-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <div data-reveal><Eyebrow>Questions fréquentes</Eyebrow></div>
          <h2 id="faq-t" data-reveal className="mb-10 mt-5 font-serif text-[clamp(34px,4.2vw,54px)] leading-[1.12]">Tout savoir <em className="text-brand">avant de réserver</em></h2>
          <div data-reveal><FaqList limit={6} /></div>
          <div data-reveal><LinkButton href="#faq" variant="secondary" className="mt-8" iconRight="arrow">Toutes les questions</LinkButton></div>
        </div>
        <div data-reveal><PracticalInfo /></div>
      </div>
    </section>
  );
}

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  return (
    <div ref={root}>
      <Hero />
      <About />
      <Fleet />
      <Split />
      <Events />
      <Budget />
      <MenuTrio />
      <Reviews />
      <FaqBlock />
    </div>
  );
}

