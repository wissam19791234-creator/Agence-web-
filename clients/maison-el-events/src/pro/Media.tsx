import { useRef, useState } from 'react';
import { ImageSlotEditor, Visual } from '../components/Visual';
import { Button, Field, IconButton, Input, Modal, Select, Textarea, useConfirm, useToast } from '../components/ui';
import { log } from '../lib/actions';
import { GALLERY_CATS } from '../lib/constants';
import { uid } from '../lib/format';
import { useImages } from '../lib/images';
import { useStore } from '../lib/store';
import type { ArtKind, GalleryItem } from '../lib/types';
import { galKey } from '../site/shared';
import { Panel, ProHeader } from './ProApp';

const SLOTS: { key: string; label: string; art: ArtKind }[] = [
  { key: 'cover', label: 'Photo de couverture (accueil)', art: 'table' },
  { key: 'logo', label: 'Logo de l’entreprise', art: 'salon' },
  { key: 'svc-deco-tables', label: 'Décorations de tables', art: 'table' },
  { key: 'coin-maries', label: 'Coin mariés', art: 'canape' },
  { key: 'svc-buffets', label: 'Buffets', art: 'buffet' },
  { key: 'svc-location', label: 'Location de matériel', art: 'salon' },
  { key: 'svc-traiteur', label: 'Traiteur', art: 'mignardise' },
  { key: 'menu-sucre', label: 'Mignardises sucrées', art: 'verrine' },
  { key: 'menu-sale', label: 'Mignardises salées', art: 'mignardise' },
  { key: 'menu-mocktail', label: 'Mocktails', art: 'mocktail' },
];
const ART_FOR: Record<GalleryItem['category'], ArtKind> = { Mariages: 'arche', 'Décoration de tables': 'table', Buffets: 'buffet', Traiteur: 'verrine', 'Événements privés': 'salon' };

export default function Media() {
  const { data, update } = useStore();
  const images = useImages();
  const confirm = useConfirm();
  const toast = useToast();
  const [edit, setEdit] = useState<GalleryItem | 'new' | null>(null);
  const [f, setF] = useState({ title: '', category: GALLERY_CATS[0] as GalleryItem['category'], description: '' });
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const openForm = (g: GalleryItem | 'new') => { setEdit(g); setFile(null); setErr(''); setF(g === 'new' ? { title: '', category: GALLERY_CATS[0], description: '' } : { title: g.title, category: g.category, description: g.description }); };
  const save = async () => {
    if (f.title.trim().length < 2) { setErr('Donnez un titre à la photo.'); return; }
    const id = edit === 'new' ? uid('g') : (edit as GalleryItem).id;
    if (file) { try { await images.set(`gal-${id}`, file); } catch (e) { setErr((e as Error).message); return; } }
    update((d) => {
      if (edit === 'new') { d.gallery.unshift({ id, title: f.title.trim(), category: f.category, description: f.description.trim(), imageKey: '', art: ART_FOR[f.category] }); log(d, `Galerie : « ${f.title.trim()} » ajoutée.`, 'reglages'); }
      else { const g = d.gallery.find((x) => x.id === id)!; Object.assign(g, { title: f.title.trim(), category: f.category, description: f.description.trim() }); }
    });
    toast(edit === 'new' ? 'Photo ajoutée à la galerie.' : 'Photo enregistrée.');
    setEdit(null);
  };

  return (
    <>
      <ProHeader title="Photos et galerie" sub="Remplacez les visuels temporaires par vos photos. Elles sont compressées et gardées dans ce navigateur pour la démonstration." />
      {!images.persistent && <p className="mb-4 rounded-none bg-[#2A2112] px-4 py-2.5 text-sm text-warn">Ce navigateur ne permet pas de conserver les photos : elles disparaîtront à la fermeture de la page.</p>}
      <Panel title="Emplacements du site" actions={images.count > 0 ? <Button size="sm" variant="ghost" onClick={async () => { if (await confirm({ title: 'Retirer toutes les photos importées ?', message: 'Les visuels temporaires seront rétablis partout.', confirm: 'Tout retirer', danger: true })) { await images.clearAll(); toast('Photos retirées.'); } }}>Tout retirer</Button> : undefined}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {SLOTS.map((s) => <ImageSlotEditor key={s.key} imageKey={s.key} art={s.art} label={s.label} />)}
        </div>
      </Panel>

      <Panel title="Galerie publique" className="mt-5" actions={<Button size="sm" icon="plus" onClick={() => openForm('new')}>Ajouter une photo</Button>}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.gallery.map((g) => (
            <li key={g.id} className="overflow-hidden rounded-none border border-line bg-panel">
              <Visual imageKey={galKey(g)} art={g.art} alt={g.title} className="aspect-[4/3]" rounded="rounded-none" />
              <div className="flex items-start gap-2 p-3">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-brun">{g.title}</p><p className="text-xs text-brun-3">{g.category}</p></div>
                <IconButton icon="edit" label={`Modifier ${g.title}`} onClick={() => openForm(g)} />
                <IconButton icon="trash" label={`Supprimer ${g.title}`} onClick={async () => { if (await confirm({ title: `Supprimer « ${g.title} » de la galerie ?`, message: 'La photo ne sera plus affichée sur le site.', confirm: 'Supprimer', danger: true })) { update((d) => { d.gallery = d.gallery.filter((x) => x.id !== g.id); }); images.remove(galKey(g)); toast('Photo supprimée.'); } }} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? 'Ajouter une photo à la galerie' : 'Modifier la photo'}
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Annuler</Button><Button onClick={save}>Enregistrer</Button></>}>
        <div className="grid gap-4">
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-brun-2">Photo</p>
            <input ref={input} type="file" accept="image/*" className="sr-only" aria-label="Choisir une photo" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <div className="flex items-center gap-3">
              <Button variant="secondary" icon="upload" onClick={() => input.current?.click()}>{file ? 'Changer de fichier' : 'Choisir un fichier'}</Button>
              <span className="truncate text-sm text-brun-3">{file ? file.name : edit !== 'new' && edit && images.get(galKey(edit)) ? 'Photo actuelle conservée' : 'Visuel temporaire si aucun fichier'}</span>
            </div>
          </div>
          <Field label="Titre" required error={err}>{(id, by) => <Input id={id} value={f.title} aria-invalid={!!err} aria-describedby={by} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
          <Field label="Catégorie">{(id) => <Select id={id} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as GalleryItem['category'] })}>{GALLERY_CATS.map((c) => <option key={c}>{c}</option>)}</Select>}</Field>
          <Field label="Description" hint="Sert aussi de texte alternatif pour l’accessibilité.">{(id, by) => <Textarea id={id} rows={3} aria-describedby={by} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
        </div>
      </Modal>
    </>
  );
}
