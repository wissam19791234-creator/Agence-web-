import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Visual } from '../components/Visual';
import { Button, cx, LinkButton, Modal, Ornament, SectionTitle } from '../components/ui';
import { GALLERY_CATS } from '../lib/constants';
import { eur } from '../lib/format';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { CatalogItem, GalleryItem, ServiceKey } from '../lib/types';
import { useUi } from '../lib/ui';
import { galKey, SERVICE_ART } from './shared';

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-line bg-ivoire">
      <div className="mx-auto max-w-site px-4 pb-14 pt-14 sm:px-6 lg:pb-20 lg:pt-20">
        <SectionTitle as="h1" eyebrow={eyebrow} title={title}>{children}</SectionTitle>
      </div>
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
      <PageHead eyebrow="Nos prestations" title="Décoration, location et traiteur pour vos réceptions">
        Des prestations à choisir séparément ou à réunir pour votre événement à {data.settings.city}. Les tarifs connus sont indiqués ; les autres prestations sont établies sur devis.
      </PageHead>
      <section className="mx-auto max-w-site px-4 py-16 sm:px-6">
        <ol className="space-y-6">
          {list.map((s, i) => (
            <li key={s.id} className="grid overflow-hidden rounded-[26px] border border-line bg-white md:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
              <Visual imageKey={s.imageKey} art={SERVICE_ART[s.id]} alt={s.title} className={cx('aspect-[16/10] md:aspect-auto md:min-h-[300px]', i % 2 === 1 && 'md:order-2')} rounded="rounded-none" />
              <div className="flex flex-col justify-center p-7 sm:p-10">
                <p className="font-serif text-lg italic text-champagne-deep">{String(i + 1).padStart(2, '0')}</p>
                <h2 className="mt-1 font-serif text-3xl font-medium leading-tight text-brun sm:text-[34px]">{s.title}</h2>
                <p className="mt-4 max-w-prose text-[15.5px] leading-relaxed text-brun-2">{s.description}</p>
                <p className="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-medium text-brand">{s.priceNote}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={() => devisFor(s.id)} iconRight="arrow">Demander un devis</Button>
                  {(s.id === 'mignardises' || s.id === 'mocktails') ? <LinkButton href="#menu" variant="secondary">Voir le menu</LinkButton> : <LinkButton href="#tarifs" variant="secondary">Tarifs et simulateur</LinkButton>}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-10 flex items-start gap-2.5 text-sm text-brun-3"><Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />Les frais d'installation et de déplacement sont établis sur devis. Un acompte peut être demandé.</p>
      </section>
    </>
  );
}

/* ───────────── Menu ───────────── */
function MenuSection({ title, price, items, imageKey, art }: { title: string; price: string; items: CatalogItem[]; imageKey: string; art: 'verrine' | 'mignardise' | 'mocktail' }) {
  return (
    <section className="relative grid overflow-hidden rounded-[28px] border border-champagne bg-white lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative p-7 sm:p-11">
        <div className="pointer-events-none absolute inset-3 rounded-[22px] border border-line" aria-hidden="true" />
        <div className="relative">
          <h2 className="text-center font-script text-[44px] leading-none text-brand">{title}</h2>
          <p className="mt-3 text-center text-[12px] font-medium uppercase tracking-[.3em] text-champagne-deep">{price}</p>
          <Ornament className="mx-auto mt-3" />
          <ul className="mx-auto mt-8 max-w-xl divide-y divide-line">
            {items.map((m) => (
              <li key={m.id} className="flex items-baseline gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[22px] leading-tight text-brun">{m.name}</p>
                  {m.ingredients && <p className="mt-1 text-sm italic text-brun-3">{m.ingredients}</p>}
                  {m.allergens && <p className="mt-1 text-xs text-brun-2"><span className="font-medium">Allergènes :</span> {m.allergens}</p>}
                </div>
                <span className="shrink-0 font-serif text-xl tabular text-brand">{m.price != null ? eur(m.price) : 'Sur devis'}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Visual imageKey={imageKey} art={art} alt={`${title} de Maison EL Events`} className="order-first aspect-[16/9] lg:order-none lg:aspect-auto" rounded="rounded-none" />
    </section>
  );
}

export function MenuPage() {
  const { data } = useStore();
  const { setPrefill } = useUi();
  const items = data.catalog.filter((c) => c.menu && c.active);
  const price = (k: 'sucre' | 'sale' | 'mocktail') => { const p = items.find((i) => i.menu === k)?.price; return p != null ? `${eur(p)} ${k === 'mocktail' ? '' : 'la pièce'}`.trim() : 'Sur devis'; };
  return (
    <>
      <PageHead eyebrow="Notre menu" title="Mignardises sucrées, salées et mocktails">Une sélection pour vos buffets et vos réceptions. Chaque composition peut être adaptée à votre événement.</PageHead>
      <div className="mx-auto max-w-site space-y-8 px-4 py-16 sm:px-6">
        <MenuSection title="Mignardises sucrées" price={price('sucre')} items={items.filter((i) => i.menu === 'sucre')} imageKey="menu-sucre" art="verrine" />
        <MenuSection title="Mignardises salées" price={price('sale')} items={items.filter((i) => i.menu === 'sale')} imageKey="menu-sale" art="mignardise" />
        <MenuSection title="Mocktails" price={price('mocktail')} items={items.filter((i) => i.menu === 'mocktail')} imageKey="menu-mocktail" art="mocktail" />
        <div className="flex flex-col items-center gap-4 rounded-[26px] bg-ivoire px-6 py-10 text-center">
          <p className="font-serif text-3xl text-brun">Envie d’une composition personnalisée ?</p>
          <p className="max-w-lg text-sm text-brun-2">Indiquez vos préférences et le nombre d’invités : la composition vous sera proposée sur devis.</p>
          <Button size="lg" iconRight="arrow" onClick={() => { setPrefill({ services: ['mignardises', 'mocktails'], needs: 'Composition personnalisée : ' }); navigate('devis'); }}>Demander une composition personnalisée</Button>
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
      <PageHead eyebrow="Galerie" title="Ambiances et réalisations">Mariages, tables, buffets et événements privés. Les visuels temporaires seront remplacés par les photographies de Maison EL Events depuis l’espace professionnel.</PageHead>
      <section className="mx-auto max-w-site px-4 py-12 sm:px-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer la galerie">
          {['Tous', ...GALLERY_CATS].map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={cx('rounded-full px-4 py-2 text-sm transition', cat === c ? 'bg-brand text-cream' : 'bg-white text-brun-2 ring-1 ring-inset ring-line hover:ring-champagne-deep/50')}>{c}</button>
          ))}
        </div>
        {list.length ? (
          <ul className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {list.map((g, i) => (
              <li key={g.id} className="mb-4 break-inside-avoid">
                <button type="button" onClick={() => setOpen(g)} className="group block w-full overflow-hidden rounded-[22px] bg-white text-left ring-1 ring-line transition hover:shadow-soft">
                  <Visual imageKey={galKey(g)} art={g.art} alt={g.title} className={i % 3 === 1 ? 'aspect-[3/4]' : 'aspect-[4/3]'} rounded="rounded-none" />
                  <span className="block px-5 py-4">
                    <span className="block text-[11px] uppercase tracking-[.2em] text-champagne-deep">{g.category}</span>
                    <span className="mt-1 block font-serif text-xl text-brun">{g.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-10 text-brun-3">Aucune photo dans cette catégorie pour le moment.</p>}
      </section>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''} size="lg">
        {open && <>
          <Visual imageKey={galKey(open)} art={open.art} alt={open.title} className="aspect-[4/3]" />
          <p className="mt-4 text-[11px] uppercase tracking-[.2em] text-champagne-deep">{open.category}</p>
          <p className="mt-1 text-brun-2">{open.description}</p>
        </>}
      </Modal>
    </>
  );
}

/* ───────────── Mentions légales ───────────── */
export function Legal() {
  const { data } = useStore();
  const s = data.settings;
  const v = (x: string) => x || <span className="text-warn">À compléter</span>;
  return (
    <>
      <PageHead eyebrow="Informations" title="Mentions légales">Informations à compléter par l’entreprise avant toute mise en ligne.</PageHead>
      <section className="mx-auto max-w-3xl space-y-8 px-4 py-14 text-[15px] leading-relaxed text-brun-2 sm:px-6">
        <div><h2 className="font-serif text-2xl text-brun">Éditeur du site</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-[220px_1fr]">
            <dt className="font-medium text-brun">Nom commercial</dt><dd>{s.businessName}</dd>
            <dt className="font-medium text-brun">Forme juridique</dt><dd>{v(s.legalForm)}</dd>
            <dt className="font-medium text-brun">SIRET</dt><dd>{v(s.siret)}</dd>
            <dt className="font-medium text-brun">Adresse</dt><dd>{s.address ? `${s.address}, ${s.city}` : v('')}</dd>
            <dt className="font-medium text-brun">Contact</dt><dd>{s.email || s.phone ? [s.email, s.phone].filter(Boolean).join(' · ') : v('')}</dd>
            <dt className="font-medium text-brun">Directeur de la publication</dt><dd>{v(s.publisher)}</dd>
          </dl></div>
        <div><h2 className="font-serif text-2xl text-brun">Hébergement</h2><p className="mt-2">{v(s.host)}</p></div>
        <div><h2 className="font-serif text-2xl text-brun">Données personnelles</h2><p className="mt-2">Dans cette démonstration, les informations saisies restent enregistrées dans votre navigateur et ne sont transmises à personne. La politique de confidentialité définitive sera rédigée avec l’entreprise avant la mise en ligne.</p></div>
      </section>
    </>
  );
}
