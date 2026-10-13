import { useMemo, useState, type ReactNode } from 'react';
import { Visual } from '../components/Visual';
import { Button, cx, LinkButton, Modal } from '../components/ui';
import { GALLERY_CATS } from '../lib/constants';
import { eur } from '../lib/format';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { CatalogItem, GalleryItem, ServiceKey } from '../lib/types';
import { useUi } from '../lib/ui';
import { galKey, SERVICE_ART } from './shared';

/** Ouverture de page : légende fine, grand titre serif, texte court. */
export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-site px-5 pb-14 pt-10 sm:px-6 lg:pb-20 lg:pt-14">
      <p className="thin text-[14px]">{eyebrow}</p>
      <h1 className="display mt-5 text-[15vw] sm:text-[96px] lg:text-[120px]">{title}</h1>
      {children && <div className="mt-8 max-w-[600px] text-[18px] leading-[1.4] text-brun-2">{children}</div>}
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
      <PageHead eyebrow={`Prestations / ${String(list.length).padStart(2, '0')}`} title={<>Nos<br />prestations</>}>
        Décoration, location et traiteur pour vos réceptions à {data.settings.city}. Les tarifs connus sont indiqués ; les autres prestations sont établies sur devis.
      </PageHead>
      <ol className="mx-auto max-w-site border-t border-smoke/60 px-5 sm:px-6">
        {list.map((s, i) => (
          <li key={s.id} className="grid gap-8 border-b border-line py-12 md:grid-cols-2 md:items-center md:gap-14">
            <Visual imageKey={s.imageKey} art={SERVICE_ART[s.id]} alt={s.title} className={cx('aspect-[4/5] w-full md:aspect-[4/5]', i % 2 === 1 && 'md:order-2')} rounded="rounded-none" />
            <div>
              <p className="thin text-[14px] text-smoke">{String(i + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}</p>
              <h2 className="mt-4 font-serif text-[40px] leading-[1.02] sm:text-[56px]">{s.title}</h2>
              <p className="mt-5 max-w-[520px] text-[17px] leading-[1.4] text-brun-2">{s.description}</p>
              <p className="mt-6 border-t border-line pt-4 text-[18px]">{s.priceNote}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => devisFor(s.id)}>Demander un devis</Button>
                {(s.id === 'mignardises' || s.id === 'mocktails') ? <LinkButton href="#menu" variant="ghost">Voir le menu</LinkButton> : <LinkButton href="#tarifs" variant="ghost">Tarifs et simulateur</LinkButton>}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mx-auto mt-8 max-w-site px-5 text-[15px] text-smoke sm:px-6">Les frais d'installation et de déplacement sont établis sur devis. Un acompte peut être demandé.</p>
    </>
  );
}

/* ───────────── Menu ───────────── */
function MenuSection({ n, title, price, items, imageKey, art }: { n: string; title: string; price: string; items: CatalogItem[]; imageKey: string; art: 'verrine' | 'mignardise' | 'mocktail' }) {
  return (
    <section className="grid gap-10 border-t border-smoke/60 py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] lg:gap-16">
      <div className="min-w-0">
        <p className="thin text-[14px] text-smoke">{n} · {price}</p>
        <h2 className="mt-4 font-serif text-[48px] leading-[1] sm:text-[72px]">{title}</h2>
        <ul className="mt-10 border-t border-line">
          {items.map((m) => (
            <li key={m.id} className="flex items-baseline gap-6 border-b border-line py-5">
              <div className="min-w-0 flex-1">
                <p className="text-[22px] leading-[1.2] tracking-[-.01em]">{m.name}</p>
                {m.ingredients && <p className="thin mt-1.5 text-[15px] text-brun-2">{m.ingredients}</p>}
                {m.allergens && <p className="mt-1.5 text-[13px] text-smoke">Allergènes : {m.allergens}</p>}
              </div>
              <span className="shrink-0 text-[20px] tabular">{m.price != null ? eur(m.price) : 'Sur devis'}</span>
            </li>
          ))}
        </ul>
      </div>
      <Visual imageKey={imageKey} art={art} alt={`${title} de Maison EL Events`} className="aspect-[4/5] w-full lg:sticky lg:top-8" rounded="rounded-none" />
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
      <PageHead eyebrow="Le menu traiteur" title={<>Notre<br />menu</>}>Mignardises sucrées et salées, mocktails : une sélection pour vos buffets et vos réceptions, à adapter à votre événement.</PageHead>
      <div className="mx-auto max-w-site px-5 sm:px-6">
        <MenuSection n="I" title="Mignardises sucrées" price={price('sucre')} items={items.filter((i) => i.menu === 'sucre')} imageKey="menu-sucre" art="verrine" />
        <MenuSection n="II" title="Mignardises salées" price={price('sale')} items={items.filter((i) => i.menu === 'sale')} imageKey="menu-sale" art="mignardise" />
        <MenuSection n="III" title="Mocktails" price={price('mocktail')} items={items.filter((i) => i.menu === 'mocktail')} imageKey="menu-mocktail" art="mocktail" />
        <div className="border-t border-smoke/60 pt-14">
          <p className="font-serif text-[40px] leading-[1.02] sm:text-[56px]">Une composition sur mesure ?</p>
          <p className="mt-4 max-w-[560px] text-[17px] leading-[1.4] text-brun-2">Indiquez vos préférences et le nombre d’invités : la composition vous sera proposée sur devis.</p>
          <Button className="mt-8" size="lg" variant="secondary" onClick={() => { setPrefill({ services: ['mignardises', 'mocktails'], needs: 'Composition personnalisée : ' }); navigate('devis'); }}>Demander une composition personnalisée</Button>
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
      <PageHead eyebrow={`Galerie / ${String(data.gallery.length).padStart(2, '0')}`} title="Ambiances">Mariages, tables, buffets et événements privés. Les photos de démonstration seront remplacées par celles de Maison EL Events depuis l’espace professionnel.</PageHead>
      <section className="mx-auto max-w-site px-5 sm:px-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-line py-4" role="group" aria-label="Filtrer la galerie">
          {['Tous', ...GALLERY_CATS].map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={cx('text-[15px] transition', cat === c ? 'text-white underline decoration-1 underline-offset-[6px]' : 'text-smoke hover:text-white')}>{c}</button>
          ))}
        </div>
        {list.length ? (
          <ul className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {list.map((g, i) => (
              <li key={g.id} className="mb-8 break-inside-avoid">
                <button type="button" onClick={() => setOpen(g)} className="block w-full text-left">
                  <Visual imageKey={galKey(g)} art={g.art} alt={g.title} className={i % 3 === 1 ? 'aspect-[3/4]' : 'aspect-[4/5]'} rounded="rounded-none" />
                  <span className="mt-3 flex items-baseline justify-between gap-3"><span className="text-[18px]">{g.title}</span><span className="thin shrink-0 text-[13px] text-smoke">{g.category}</span></span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-10 text-smoke">Aucune photo dans cette catégorie pour le moment.</p>}
      </section>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''} size="lg">
        {open && <>
          <Visual imageKey={galKey(open)} art={open.art} alt={open.title} className="aspect-[4/5] sm:aspect-[4/3]" rounded="rounded-none" />
          <p className="thin mt-4 text-[14px] text-smoke">{open.category}</p>
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
  const v = (x: string) => x || <span className="text-smoke">À compléter</span>;
  return (
    <>
      <PageHead eyebrow="Informations" title={<>Mentions<br />légales</>}>Informations à compléter par l’entreprise avant toute mise en ligne.</PageHead>
      <section className="mx-auto max-w-site space-y-12 px-5 text-[16px] leading-[1.4] text-brun-2 sm:px-6">
        <div className="border-t border-smoke/60 pt-8"><h2 className="font-serif text-[32px] text-white">Éditeur du site</h2>
          <dl className="mt-5 grid max-w-[720px] gap-x-6 gap-y-3 sm:grid-cols-[240px_1fr]">
            <dt className="text-white">Nom commercial</dt><dd>{s.businessName}</dd>
            <dt className="text-white">Forme juridique</dt><dd>{v(s.legalForm)}</dd>
            <dt className="text-white">SIRET</dt><dd>{v(s.siret)}</dd>
            <dt className="text-white">Adresse</dt><dd>{s.address ? `${s.address}, ${s.city}` : v('')}</dd>
            <dt className="text-white">Contact</dt><dd>{s.email || s.phone ? [s.email, s.phone].filter(Boolean).join(' · ') : v('')}</dd>
            <dt className="text-white">Directeur de la publication</dt><dd>{v(s.publisher)}</dd>
          </dl></div>
        <div className="border-t border-line pt-8"><h2 className="font-serif text-[32px] text-white">Hébergement</h2><p className="mt-3">{v(s.host)}</p></div>
        <div className="border-t border-line pt-8"><h2 className="font-serif text-[32px] text-white">Données personnelles</h2><p className="mt-3 max-w-[600px]">Dans cette démonstration, les informations saisies restent enregistrées dans votre navigateur et ne sont transmises à personne. La politique de confidentialité définitive sera rédigée avec l’entreprise avant la mise en ligne.</p></div>
      </section>
    </>
  );
}
