import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { ImageSlotEditor } from '../components/Visual';
import { Badge, Button, cx, EmptyState, Field, IconButton, Input, Modal, Select, Textarea, Toggle, useConfirm, useToast } from '../components/ui';
import { log } from '../lib/actions';
import { eur, uid } from '../lib/format';
import { useStore } from '../lib/store';
import type { CatalogCategory, CatalogItem, SiteService, Unit } from '../lib/types';
import { SERVICE_ART } from '../site/shared';
import { ProHeader } from './ProApp';

const CATS: CatalogCategory[] = ['Décoration', 'Mariage', 'Buffets', 'Location', 'Traiteur', 'Mignardises sucrées', 'Mignardises salées', 'Boissons', 'Frais'];
const UNITS: Unit[] = ['par personne', 'la pièce', 'forfait', 'sur devis'];

function ItemForm({ item, onClose }: { item: CatalogItem | 'new' | null; onClose: () => void }) {
  const { update } = useStore();
  const toast = useToast();
  const blank: CatalogItem = { id: '', name: '', category: 'Décoration', description: '', ingredients: '', allergens: '', price: null, unit: 'forfait', active: true };
  const [f, setF] = useState<CatalogItem>(blank);
  const [price, setPrice] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => { if (item) { const v = item === 'new' ? blank : { ...item }; setF(v); setPrice(v.price == null ? '' : String(v.price).replace('.', ',')); setErr({}); } }, [item]); // eslint-disable-line react-hooks/exhaustive-deps
  const isNew = item === 'new';
  const save = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Nom obligatoire.';
    const p = price.trim() === '' ? null : Number(price.replace(',', '.'));
    if (p != null && (!Number.isFinite(p) || p < 0)) e.price = 'Prix invalide (exemple : 7,50). Laissez vide pour « sur devis ».';
    if (p == null && f.unit !== 'sur devis') e.price = 'Indiquez un prix, ou choisissez l’unité « sur devis ».';
    setErr(e);
    if (Object.keys(e).length) return;
    update((d) => {
      const v: CatalogItem = { ...f, name: f.name.trim(), price: f.unit === 'sur devis' ? null : p };
      if (isNew) { v.id = uid('c'); d.catalog.push(v); log(d, `Catalogue : ${v.name} ajouté.`, 'catalogue'); }
      else {
        const i = d.catalog.findIndex((x) => x.id === v.id);
        const before = d.catalog[i];
        d.catalog[i] = v;
        if (before.price !== v.price) log(d, `Catalogue : ${v.name} passe de ${before.price != null ? eur(before.price) : 'sur devis'} à ${v.price != null ? eur(v.price) : 'sur devis'}.`, 'catalogue');
      }
    });
    toast(isNew ? 'Prestation ajoutée au catalogue.' : 'Prestation enregistrée. Les devis déjà enregistrés gardent leurs prix.');
    onClose();
  };
  return (
    <Modal open={!!item} onClose={onClose} title={isNew ? 'Nouvelle prestation' : f.name} size="lg" footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button icon="check" onClick={save}>Enregistrer</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" required error={err.name} className="sm:col-span-2">{(id, by) => <Input id={id} value={f.name} aria-invalid={!!err.name} aria-describedby={by} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
        <Field label="Catégorie">{(id) => <Select id={id} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as CatalogCategory })}>{CATS.map((c) => <option key={c}>{c}</option>)}</Select>}</Field>
        <Field label="Afficher dans le menu public">{(id) => <Select id={id} value={f.menu ?? ''} onChange={(e) => setF({ ...f, menu: (e.target.value || undefined) as CatalogItem['menu'] })}><option value="">Non</option><option value="sucre">Mignardises sucrées</option><option value="sale">Mignardises salées</option><option value="mocktail">Mocktails</option></Select>}</Field>
        <Field label="Prix (€)" error={err.price} hint="Laissez vide pour une prestation sur devis.">{(id, by) => <Input id={id} inputMode="decimal" value={f.unit === 'sur devis' ? '' : price} disabled={f.unit === 'sur devis'} aria-invalid={!!err.price} aria-describedby={by} onChange={(e) => setPrice(e.target.value)} />}</Field>
        <Field label="Unité de facturation">{(id) => <Select id={id} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value as Unit })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</Select>}</Field>
        <Field label="Description" className="sm:col-span-2">{(id) => <Textarea id={id} rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
        <Field label="Ingrédients ou contenu">{(id) => <Input id={id} value={f.ingredients} onChange={(e) => setF({ ...f, ingredients: e.target.value })} />}</Field>
        <Field label="Allergènes" hint="Affichés sur le menu s’ils sont renseignés.">{(id, by) => <Input id={id} aria-describedby={by} value={f.allergens} onChange={(e) => setF({ ...f, allergens: e.target.value })} />}</Field>
        <div className="flex items-center gap-3 sm:col-span-2"><Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Prestation active" /><span className="text-sm text-brun-2">{f.active ? 'Active : proposée sur le site et dans les devis' : 'Inactive : masquée'}</span></div>
        {!isNew && <div className="sm:col-span-2"><p className="mb-2 text-[13px] font-medium text-brun-2">Photo</p><div className="max-w-xs"><ImageSlotEditor imageKey={f.imageKey || `cat-${f.id}`} art={f.menu === 'mocktail' ? 'mocktail' : f.menu ? 'verrine' : 'table'} label={f.name || 'Prestation'} /></div></div>}
      </div>
    </Modal>
  );
}

function ServiceForm({ svc, onClose }: { svc: SiteService | null; onClose: () => void }) {
  const { update } = useStore();
  const toast = useToast();
  const [f, setF] = useState<SiteService | null>(svc);
  useEffect(() => setF(svc ? { ...svc } : null), [svc]);
  if (!f) return null;
  return (
    <Modal open={!!svc} onClose={onClose} title={`Prestation du site · ${f.title}`} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button icon="check" disabled={f.title.trim().length < 2} onClick={() => { update((d) => { const i = d.services.findIndex((s) => s.id === f.id); d.services[i] = { ...f, title: f.title.trim() }; log(d, `Prestation du site modifiée : ${f.title}.`, 'catalogue'); }); toast('Prestation du site enregistrée.'); onClose(); }}>Enregistrer</Button></>}>
      <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
        <div className="space-y-4">
          <Field label="Titre affiché">{(id) => <Input id={id} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
          <Field label="Description">{(id) => <Textarea id={id} rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
          <Field label="Mention de prix" hint="Ex. « 7,50 € par personne » ou « Sur devis »">{(id, by) => <Input id={id} aria-describedby={by} value={f.priceNote} onChange={(e) => setF({ ...f, priceNote: e.target.value })} />}</Field>
          <div className="flex items-center gap-3"><Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Afficher sur le site" /><span className="text-sm text-brun-2">{f.active ? 'Affichée sur le site' : 'Masquée du site'}</span></div>
        </div>
        <ImageSlotEditor imageKey={f.imageKey} art={SERVICE_ART[f.id]} label={f.title} />
      </div>
    </Modal>
  );
}

export default function Catalog() {
  const { data, update } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [tab, setTab] = useState<'catalogue' | 'site'>('catalogue');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [edit, setEdit] = useState<CatalogItem | 'new' | null>(null);
  const [svc, setSvc] = useState<SiteService | null>(null);
  const list = useMemo(() => data.catalog.filter((c) => (!cat || c.category === cat) && (!q.trim() || `${c.name} ${c.description} ${c.ingredients}`.toLowerCase().includes(q.trim().toLowerCase()))), [data.catalog, q, cat]);

  return (
    <>
      <ProHeader title="Catalogue" sub="Prix et prestations utilisés par le simulateur, le menu et les nouveaux devis. Les devis déjà enregistrés gardent leurs prix." actions={tab === 'catalogue' ? <Button icon="plus" onClick={() => setEdit('new')}>Nouvelle prestation</Button> : undefined} />
      <div className="mb-5 inline-flex rounded-full bg-panel p-1 ring-1 ring-line" role="tablist">
        {([['catalogue', 'Prestations et tarifs'], ['site', 'Prestations affichées sur le site']] as const).map(([k, v]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('rounded-full px-4 py-1.5 text-[13px] transition', tab === k ? 'bg-white text-black' : 'text-brun-2')}>{v}</button>)}
      </div>

      {tab === 'catalogue' ? (
        <>
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_240px]">
            <div className="relative"><Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brun-3" /><Input aria-label="Rechercher dans le catalogue" className="pl-10" placeholder="Rechercher une prestation" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Select aria-label="Filtrer par catégorie" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Toutes les catégories</option>{CATS.map((c) => <option key={c}>{c}</option>)}</Select>
          </div>
          {list.length ? (
            <div className="overflow-hidden rounded-card border border-line bg-panel">
              <ul className="divide-y divide-line">
                {list.map((c) => (
                  <li key={c.id} className={cx('flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap', !c.active && 'bg-cream/70')}>
                    <div className="min-w-0 flex-1">
                      <p className={cx('font-medium', c.active ? 'text-brun' : 'text-brun-3')}>{c.name}{c.menu && <Badge className="ml-2">Menu</Badge>}</p>
                      <p className="truncate text-xs text-brun-3">{c.category}{c.ingredients ? ` · ${c.ingredients}` : c.description ? ` · ${c.description}` : ''}</p>
                    </div>
                    <p className="w-36 shrink-0 text-right tabular"><span className="text-xl text-brun">{c.price != null ? eur(c.price) : 'Sur devis'}</span><span className="block text-[11px] text-brun-3">{c.unit}</span></p>
                    <Toggle checked={c.active} label={`${c.name} active`} onChange={(v) => { update((d) => { d.catalog.find((x) => x.id === c.id)!.active = v; }); toast(v ? `${c.name} activée.` : `${c.name} masquée.`); }} />
                    <IconButton icon="edit" label={`Modifier ${c.name}`} onClick={() => setEdit(c)} />
                    <IconButton icon="trash" label={`Supprimer ${c.name}`} className="hover:bg-[#2A1215] hover:text-danger" onClick={async () => { if (await confirm({ title: `Supprimer « ${c.name} » ?`, message: 'La prestation disparaît du catalogue. Les devis existants ne sont pas modifiés.', confirm: 'Supprimer', danger: true })) { update((d) => { d.catalog = d.catalog.filter((x) => x.id !== c.id); log(d, `Catalogue : ${c.name} supprimé.`, 'catalogue'); }); toast('Prestation supprimée.'); } }} />
                  </li>
                ))}
              </ul>
            </div>
          ) : <EmptyState icon="box" title="Aucune prestation trouvée">Modifiez la recherche ou la catégorie.</EmptyState>}
        </>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.services.map((s, i) => (
            <li key={s.id} className={cx('flex items-start gap-3 rounded-card border border-line bg-panel p-4', !s.active && 'opacity-70')}>
              <div className="flex flex-col gap-1">
                <IconButton icon="left" label={`Monter ${s.title}`} className="rotate-90" disabled={i === 0} onClick={() => update((d) => { const [x] = d.services.splice(i, 1); d.services.splice(i - 1, 0, x); })} />
                <IconButton icon="right" label={`Descendre ${s.title}`} className="rotate-90" disabled={i === data.services.length - 1} onClick={() => update((d) => { const [x] = d.services.splice(i, 1); d.services.splice(i + 1, 0, x); })} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-brun">{s.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-brun-2">{s.description}</p>
                <p className="mt-2 text-xs font-medium text-brand">{s.priceNote}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Toggle checked={s.active} label={`Afficher ${s.title} sur le site`} onChange={(v) => update((d) => { d.services.find((x) => x.id === s.id)!.active = v; })} />
                <Button size="sm" variant="secondary" icon="edit" onClick={() => setSvc(s)}>Modifier</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ItemForm item={edit} onClose={() => setEdit(null)} />
      <ServiceForm svc={svc} onClose={() => setSvc(null)} />
    </>
  );
}
