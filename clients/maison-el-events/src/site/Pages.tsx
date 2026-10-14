import { useMemo, useState, type ReactNode } from 'react';
import { Backdrop, Visual } from '../components/Visual';
import { Badge, Button, cx, Display, Eyebrow, LinkButton, Modal } from '../components/ui';
import { GALLERY_CATS } from '../lib/constants';
import { faqText, practical } from '../lib/faq';
import { eur } from '../lib/format';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { ArtKind, CatalogItem, GalleryItem, ServiceKey } from '../lib/types';
import { useUi } from '../lib/ui';
import { galKey, SERVICE_ART } from './shared';

/**
 * Ouverture de page. Avec une image : fond plein cadre, texte posé en bas à gauche.
 * Sans image : bloc noir sous la barre de navigation.
 */
export function PageHead({ eyebrow, title, children, imageKey, art = 'table', n }: { eyebrow: string; title: ReactNode[]; children?: ReactNode; imageKey?: string; art?: ArtKind; n?: number }) {
  const body = (
    <>
      <Eyebrow n={n}>{eyebrow}</Eyebrow>
      <Display as="h1" lines={title} className="mt-6 text-[clamp(50px,9vw,104px)] text-shadow" brand={title.length - 1} />
      {children && <div className="mt-8 max-w-[560px] text-[17px] leading-[1.5] text-white/85">{children}</div>}
    </>
  );
  if (!imageKey) return <section className="mx-auto max-w-site px-4 pb-14 pt-[calc(var(--hdr)+56px)] sm:px-6 lg:pb-20">{body}</section>;
  return (
    <section className="relative flex min-h-[68svh] items-end overflow-hidden sm:min-h-[72svh]">
      <Backdrop imageKey={imageKey} art={art} alt="" eager badgePos="trh" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 scrim-t" />
      <div className="relative z-10 mx-auto w-full max-w-site px-4 pb-12 pt-[calc(var(--hdr)+64px)] sm:px-6 sm:pb-16">{body}</div>
    </section>
  );
}

/* ───────────── Prestations ───────────── */
export function Services() {
  const { data } = useStore();
  const { setPrefill } = useUi();
  const list = data.services.filter((s) => s.active);
  const devisFor = (id: ServiceKey) => { setPrefill({ services: [id] }); navigate('devis'); };
  return (
    <>
      <PageHead n={1} eyebrow={`Prestations / ${String(list.length).padStart(2, '0')}`} title={['Nos', 'prestations']} imageKey="svc-deco-tables" art="table">
        Décoration, location et traiteur pour vos réceptions à {data.settings.city}. Les tarifs connus sont indiqués ; les autres prestations sont établies sur devis.
      </PageHead>
      <ol className="mx-auto mt-6 max-w-site px-4 sm:px-6">
        {list.map((s, i) => (
          <li key={s.id} className="grid gap-8 border-b border-frost/15 py-12 md:grid-cols-2 md:items-center md:gap-14">
            <Visual imageKey={s.imageKey} art={SERVICE_ART[s.id]} alt={s.title} className={cx('aspect-[4/3] w-full', i % 2 === 1 && 'md:order-2')} />
            <div>
              <Eyebrow n={i + 1}>{s.priceNote}</Eyebrow>
              <h2 className="mt-5 text-[38px] font-serif leading-[1.06] sm:text-[52px]">{s.title}</h2>
              <p className="mt-5 max-w-[520px] text-[17px] leading-[1.5] text-ash">{s.description}</p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                <Button onClick={() => devisFor(s.id)}>Demander un devis</Button>
                {(s.id === 'mignardises' || s.id === 'mocktails') ? <LinkButton href="#menu" variant="secondary">Voir le menu</LinkButton> : <LinkButton href="#tarifs" variant="secondary">Tarifs et simulateur</LinkButton>}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mono mx-auto mt-8 max-w-site px-4 text-ash sm:px-6">Installation et déplacement : sur devis · Un acompte peut être demandé</p>
    </>
  );
}

/* ───────────── Menu ───────────── */
function MenuSection({ n, title, price, items, imageKey, art }: { n: number; title: string; price: string; items: CatalogItem[]; imageKey: string; art: 'verrine' | 'mignardise' | 'mocktail' }) {
  return (
    <section className="grid gap-10 border-t border-frost/15 py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] lg:gap-16">
      <div className="min-w-0">
        <Eyebrow n={n}>{price}</Eyebrow>
        <h2 className="mt-5 text-[44px] font-serif leading-[1.06] sm:text-[68px]">{title}</h2>
        <ul className="mt-10 border-t border-frost/15">
          {items.map((m) => (
            <li key={m.id} className="flex items-baseline gap-6 border-b border-frost/15 py-5">
              <div className="min-w-0 flex-1">
                <p className="text-[21px] leading-[1.2] tracking-[-.025em]">{m.name}</p>
                {m.ingredients && <p className="mt-1.5 text-[15px] text-ash">{m.ingredients}</p>}
                {m.allergens && <p className="mono mt-1.5 text-smoke">Allergènes : {m.allergens}</p>}
              </div>
              <span className="mono mono-lg shrink-0 text-brand tabular">{m.price != null ? eur(m.price) : 'Sur devis'}</span>
            </li>
          ))}
        </ul>
      </div>
      <Visual imageKey={imageKey} art={art} alt={`${title} de Maison EL Events`} className="aspect-[4/5] w-full lg:sticky lg:top-[calc(var(--hdr)+24px)]" />
    </section>
  );
}

export function MenuPage() {
  const { data } = useStore();
  const { setPrefill } = useUi();
  const items = data.catalog.filter((c) => c.menu && c.active);
  const price = (k: 'sucre' | 'sale' | 'mocktail') => { const p = items.find((i) => i.menu === k)?.price; return p != null ? `${eur(p)} ${k === 'mocktail' ? 'le verre' : 'la pièce'}` : 'Sur devis'; };
  return (
    <>
      <PageHead n={2} eyebrow="Le menu traiteur" title={['Notre', 'menu']} imageKey="menu-mocktail" art="mocktail">Mignardises sucrées et salées, mocktails : une sélection pour vos buffets et vos réceptions, à adapter à votre événement.</PageHead>
      <div className="mx-auto max-w-site px-4 sm:px-6">
        <MenuSection n={1} title="Mignardises sucrées" price={price('sucre')} items={items.filter((i) => i.menu === 'sucre')} imageKey="menu-sucre" art="verrine" />
        <MenuSection n={2} title="Mignardises salées" price={price('sale')} items={items.filter((i) => i.menu === 'sale')} imageKey="menu-sale" art="mignardise" />
        <MenuSection n={3} title="Mocktails" price={price('mocktail')} items={items.filter((i) => i.menu === 'mocktail')} imageKey="menu-mocktail" art="mocktail" />
        <div className="rounded-box border border-frost/20 bg-navy-card p-6 sm:p-10">
          <Display lines={['Une composition', 'sur mesure ?']} className="text-[clamp(40px,8vw,72px)]" brand={1} />
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.5] text-ash">Indiquez vos préférences et le nombre d’invités : la composition vous sera proposée sur devis.</p>
          <Button className="mt-8" size="lg" onClick={() => { setPrefill({ services: ['mignardises', 'mocktails'], needs: 'Composition personnalisée : ' }); navigate('devis'); }}>Demander une composition personnalisée</Button>
        </div>
      </div>
    </>
  );
}

/* ───────────── Galerie ───────────── */
export function Gallery() {
  const { data } = useStore();
  const [cat, setCat] = useState<string>('Tous');
  const [open, setOpen] = useState<GalleryItem | null>(null);
  const list = useMemo(() => data.gallery.filter((g) => cat === 'Tous' || g.category === cat), [data.gallery, cat]);
  return (
    <>
      <PageHead n={3} eyebrow={`Galerie / ${String(data.gallery.length).padStart(2, '0')}`} title={['Ambiances']} imageKey="gal-arche" art="arche">Mariages, tables, buffets et événements privés. Les visuels de démonstration seront remplacés par les photos de Maison EL Events depuis l’espace professionnel.</PageHead>
      <section className="mx-auto mt-6 max-w-site px-4 sm:px-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer la galerie">
          {['Tous', ...GALLERY_CATS].map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={cx('h-10 rounded-full border px-5 text-[13px] font-semibold transition', cat === c ? 'border-brand bg-brand text-navy shadow-gold' : 'border-white/20 text-white/80 hover:border-brand hover:text-brand')}>{c}</button>
          ))}
        </div>
        {list.length ? (
          <ul className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {list.map((g, i) => (
              <li key={g.id} className="mb-6 break-inside-avoid">
                <button type="button" onClick={() => setOpen(g)} className="group block w-full text-left">
                  <Visual imageKey={galKey(g)} art={g.art} alt={g.title} className={cx('transition duration-300 group-hover:opacity-90', i % 3 === 1 ? 'aspect-[3/4]' : 'aspect-[4/5]')} />
                  <span className="mt-3 flex items-baseline justify-between gap-3"><span className="text-[18px] tracking-[-.025em]">{g.title}</span><span className="mono shrink-0 text-ash">{g.category}</span></span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-10 text-ash">Aucune photo dans cette catégorie pour le moment.</p>}
      </section>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''} size="lg">
        {open && <>
          <Visual imageKey={galKey(open)} art={open.art} alt={open.title} className="aspect-[4/5] sm:aspect-[16/10]" />
          <p className="mono mt-4 text-brand">{open.category}</p>
          <p className="mt-1 text-ash">{open.description}</p>
        </>}
      </Modal>
    </>
  );
}

/* ───────────── FAQ et infos pratiques ───────────── */
export function FaqList({ limit, className }: { limit?: number; className?: string }) {
  const { data } = useStore();
  const items = data.faq.filter((f) => f.active).slice(0, limit);
  return (
    <div className={cx('border-t border-frost/15', className)}>
      {items.map((f, i) => (
        <details key={f.id} className="group border-b border-frost/15">
          <summary className="flex cursor-pointer list-none items-start gap-4 py-5 [&::-webkit-details-marker]:hidden">
            <span className="mono mt-1.5 w-7 shrink-0 text-brand">{String(i + 1).padStart(2, '0')}</span>
            <span className="min-w-0 flex-1 text-[19px] leading-[1.25] tracking-[-.025em] sm:text-[22px]">{f.q}</span>
            <span aria-hidden="true" className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-ctl border border-frost/30 text-[16px] leading-none text-ash transition group-open:rotate-45 group-open:border-brand group-open:text-brand">+</span>
          </summary>
          <p className="pb-6 pl-11 pr-11 text-[16px] leading-[1.55] text-ash">{faqText(f.a, data)}</p>
        </details>
      ))}
    </div>
  );
}

export function PracticalInfo({ className }: { className?: string }) {
  const { data } = useStore();
  const p = practical(data);
  return (
    <section className={cx('rounded-card border border-frost/20 bg-navy-card p-5 sm:p-7', className)} aria-labelledby="infos-t">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="infos-t" className="font-serif text-[28px] leading-none">Horaires et infos pratiques</h2>
        {p.pending && <Badge tone="warn">À confirmer</Badge>}
      </div>
      <h3 className="mono mt-6 text-ash">Accueil et réponses</h3>
      <dl className="mt-2 divide-y divide-frost/10 border-y border-frost/10">
        {p.hours.map((h) => (
          <div key={h.day} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-[15px]">{h.day}</dt>
            <dd className={cx('mono mono-lg text-right tabular', h.set ? 'text-white' : 'text-smoke')}>{h.value}</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {p.rows.map((r) => (
          <div key={r.k}>
            <dt className="mono text-ash">{r.k}</dt>
            <dd className={cx('mt-1 text-[15px] leading-[1.45]', r.set ? 'text-white' : 'text-smoke')}>{r.v}</dd>
          </div>
        ))}
      </dl>
      {p.pending && <p className="mt-6 text-[13px] leading-[1.5] text-smoke">{p.hoursKnown ? 'Les informations « à confirmer » seront complétées par Maison EL Events.' : 'Aucun horaire public n’a été trouvé : ces informations seront renseignées par Maison EL Events depuis l’espace professionnel (Paramètres).'}</p>}
    </section>
  );
}

export function Faq() {
  const { data } = useStore();
  return (
    <>
      <PageHead n={5} eyebrow={`Questions fréquentes / ${String(data.faq.filter((f) => f.active).length).padStart(2, '0')}`} title={['Questions', 'fréquentes']} imageKey="faq" art="table">Tarifs, coin mariés, menu, installation, acompte, zone et horaires : l’essentiel avant de demander votre devis.</PageHead>
      <section className="mx-auto mt-10 grid max-w-site gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <FaqList />
        <div className="lg:sticky lg:top-[calc(var(--hdr)+24px)]">
          <PracticalInfo />
          <div className="mt-4 rounded-card border border-brand/50 bg-brand/10 p-5 sm:p-7">
            <p className="text-[22px] font-serif leading-[1.1]">Une autre question ?</p>
            <p className="mt-2 text-[15px] text-ash">Décrivez votre événement : la réponse vous parviendra avec votre devis.</p>
            <div className="mt-5 flex flex-wrap gap-2.5"><LinkButton href="#devis">Demander un devis</LinkButton><LinkButton href="#tarifs" variant="secondary">Simuler mon budget</LinkButton></div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ───────────── Mentions légales ───────────── */
export function Legal() {
  const { data } = useStore();
  const s = data.settings;
  const v = (x: string) => x || <span className="text-smoke">À compléter</span>;
  return (
    <>
      <PageHead eyebrow="Informations" title={['Mentions', 'légales']}>Informations à compléter par l’entreprise avant toute mise en ligne.</PageHead>
      <section className="mx-auto max-w-site space-y-12 px-4 text-[16px] leading-[1.5] text-ash sm:px-6">
        <div className="border-t border-frost/15 pt-8"><h2 className="font-serif text-[32px] text-white">Éditeur du site</h2>
          <dl className="mt-5 grid max-w-[720px] gap-x-6 gap-y-3 sm:grid-cols-[240px_1fr]">
            <dt className="mono pt-1 text-white">Nom commercial</dt><dd>{s.businessName}</dd>
            <dt className="mono pt-1 text-white">Forme juridique</dt><dd>{v(s.legalForm)}</dd>
            <dt className="mono pt-1 text-white">SIRET</dt><dd>{v(s.siret)}</dd>
            <dt className="mono pt-1 text-white">Adresse</dt><dd>{s.address ? `${s.address}, ${s.city}` : v('')}</dd>
            <dt className="mono pt-1 text-white">Contact</dt><dd>{s.email || s.phone ? [s.email, s.phone].filter(Boolean).join(' · ') : v('')}</dd>
            <dt className="mono pt-1 text-white">Directeur de la publication</dt><dd>{v(s.publisher)}</dd>
          </dl></div>
        <div className="border-t border-frost/15 pt-8"><h2 className="font-serif text-[32px] text-white">Hébergement</h2><p className="mt-3">{v(s.host)}</p></div>
        <div className="border-t border-frost/15 pt-8"><h2 className="font-serif text-[32px] text-white">Données personnelles</h2><p className="mt-3 max-w-[600px]">Dans cette démonstration, les informations saisies restent enregistrées dans votre navigateur et ne sont transmises à personne. La politique de confidentialité définitive sera rédigée avec l’entreprise avant la mise en ligne.</p></div>
      </section>
    </>
  );
}
