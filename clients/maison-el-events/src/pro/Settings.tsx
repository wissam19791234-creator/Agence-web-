import { useEffect, useState } from 'react';
import { ImageSlotEditor } from '../components/Visual';
import { Button, Field, Input, Textarea, useConfirm, useToast } from '../components/ui';
import { log } from '../lib/actions';
import { PRICE_IDS } from '../lib/constants';
import { eur, hexToRgbTriplet, isEmail, isPhone } from '../lib/format';
import { useStore } from '../lib/store';
import type { Settings as S } from '../lib/types';
import { Panel, ProHeader } from './ProApp';

const KEY_PRICES = [
  { id: PRICE_IDS.decoTable, label: 'Décoration de table (par personne)' },
  { id: PRICE_IDS.sucree, label: 'Mignardise sucrée (la pièce)' },
  { id: PRICE_IDS.salee, label: 'Mignardise salée (la pièce)' },
  { id: PRICE_IDS.boisson, label: 'Cocktail ou mocktail (la pièce)' },
  { id: PRICE_IDS.coinMaries, label: 'Coin mariés (forfait)' },
];

export default function Settings() {
  const { data, update, reset } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [s, setS] = useState<S>(data.settings);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => { setS(data.settings); setPrices(Object.fromEntries(KEY_PRICES.map((k) => [k.id, String(data.catalog.find((c) => c.id === k.id)?.price ?? '').replace('.', ',')]))); }, [data.settings, data.catalog]);
  const set = <K extends keyof S>(k: K, v: S[K]) => setS((x) => ({ ...x, [k]: v }));

  const save = () => {
    const e: Record<string, string> = {};
    if (s.businessName.trim().length < 2) e.businessName = 'Nom commercial obligatoire.';
    if (s.email && !isEmail(s.email)) e.email = 'Adresse e-mail invalide.';
    if (s.phone && !isPhone(s.phone)) e.phone = 'Numéro invalide.';
    if (!hexToRgbTriplet(s.colorBrand)) e.colorBrand = 'Couleur au format #RRGGBB.';
    if (!hexToRgbTriplet(s.colorChampagne)) e.colorChampagne = 'Couleur au format #RRGGBB.';
    const parsed: Record<string, number> = {};
    for (const k of KEY_PRICES) { const n = Number((prices[k.id] || '').replace(',', '.')); if (!prices[k.id] || !Number.isFinite(n) || n < 0) e[k.id] = 'Prix invalide.'; else parsed[k.id] = n; }
    if (!Number.isInteger(Number(s.quoteValidityDays)) || Number(s.quoteValidityDays) < 0) e.quoteValidityDays = 'Nombre de jours entier (0 = non affiché).';
    setErr(e);
    if (Object.keys(e).length) { toast('Certains champs sont à corriger.', 'error'); return; }
    update((d) => {
      d.settings = { ...s, businessName: s.businessName.trim(), quoteValidityDays: Number(s.quoteValidityDays) };
      for (const k of KEY_PRICES) { const c = d.catalog.find((x) => x.id === k.id); if (c && c.price !== parsed[k.id]) { log(d, `Tarif modifié : ${c.name} ${c.price != null ? eur(c.price) : ''} → ${eur(parsed[k.id])}.`, 'catalogue'); c.price = parsed[k.id]; } }
      log(d, 'Paramètres enregistrés.', 'reglages');
    });
    toast('Paramètres enregistrés : le site et les nouveaux devis sont à jour.');
  };

  const text = (k: keyof S, label: string, hint?: string, type = 'text') => (
    <Field label={label} hint={hint} error={err[k as string]}>{(id, by) => <Input id={id} type={type} value={String(s[k] ?? '')} aria-invalid={!!err[k as string]} aria-describedby={by} onChange={(e) => set(k, e.target.value as never)} />}</Field>
  );

  return (
    <>
      <ProHeader title="Paramètres" sub="Ces informations s’affichent sur le site, l’espace pro et les devis." actions={<Button icon="check" onClick={save}>Enregistrer</Button>} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Identité">
          <div className="grid gap-4 sm:grid-cols-2">
            {text('businessName', 'Nom commercial')}
            {text('tagline', 'Accroche')}
            {text('city', 'Ville')}
            <div className="sm:row-span-2"><ImageSlotEditor imageKey="logo" art="salon" label="Logo" /></div>
            <Field label="Couleur principale" error={err.colorBrand}>{(id, by) => <div className="flex gap-2"><input type="color" aria-label="Choisir la couleur principale" value={hexToRgbTriplet(s.colorBrand) ? s.colorBrand : '#65172D'} onChange={(e) => set('colorBrand', e.target.value)} className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1" /><Input id={id} value={s.colorBrand} aria-invalid={!!err.colorBrand} aria-describedby={by} onChange={(e) => set('colorBrand', e.target.value)} /></div>}</Field>
            <Field label="Couleur d’accent" error={err.colorChampagne}>{(id, by) => <div className="flex gap-2"><input type="color" aria-label="Choisir la couleur d'accent" value={hexToRgbTriplet(s.colorChampagne) ? s.colorChampagne : '#D8C3A7'} onChange={(e) => set('colorChampagne', e.target.value)} className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1" /><Input id={id} value={s.colorChampagne} aria-invalid={!!err.colorChampagne} aria-describedby={by} onChange={(e) => set('colorChampagne', e.target.value)} /></div>}</Field>
          </div>
        </Panel>
        <Panel title="Coordonnées affichées">
          <div className="grid gap-4 sm:grid-cols-2">
            {text('email', 'E-mail', 'Laisser vide : « à compléter » s’affiche.', 'email')}
            {text('phone', 'Téléphone', undefined, 'tel')}
            {text('address', 'Adresse')}
            {text('hours', 'Horaires', 'Facultatif')}
            {text('instagram', 'Instagram (identifiant)')}
            {text('tiktok', 'TikTok (identifiant)')}
          </div>
        </Panel>
        <Panel title="Tarifs principaux">
          <div className="grid gap-4 sm:grid-cols-2">
            {KEY_PRICES.map((k) => <Field key={k.id} label={`${k.label} (€)`} error={err[k.id]}>{(id, by) => <Input id={id} inputMode="decimal" value={prices[k.id] ?? ''} aria-invalid={!!err[k.id]} aria-describedby={by} onChange={(e) => setPrices({ ...prices, [k.id]: e.target.value })} />}</Field>)}
          </div>
          <p className="mt-3 text-xs text-brun-3">Les nouveaux calculs (simulateur, nouveaux devis) utilisent ces prix. Les devis déjà enregistrés ne sont pas modifiés. Les autres prestations se gèrent dans le Catalogue.</p>
        </Panel>
        <Panel title="Devis et conditions commerciales">
          <div className="grid gap-4">
            <Field label="Conditions par défaut">{(id) => <Textarea id={id} rows={3} value={s.conditions} onChange={(e) => set('conditions', e.target.value)} />}</Field>
            <Field label="Mention d’acompte">{(id) => <Input id={id} value={s.depositText} onChange={(e) => set('depositText', e.target.value)} />}</Field>
            <Field label="Pied de page des devis">{(id) => <Input id={id} value={s.quoteFooter} onChange={(e) => set('quoteFooter', e.target.value)} />}</Field>
            <Field label="Durée de validité des devis (jours)" hint="0 : non affichée" error={err.quoteValidityDays}>{(id, by) => <Input id={id} inputMode="numeric" value={String(s.quoteValidityDays)} aria-invalid={!!err.quoteValidityDays} aria-describedby={by} onChange={(e) => set('quoteValidityDays', (e.target.value.replace(/[^\d]/g, '') || '0') as unknown as number)} />}</Field>
          </div>
        </Panel>
        <Panel title="Informations légales (à compléter)">
          <div className="grid gap-4 sm:grid-cols-2">
            {text('legalForm', 'Forme juridique')}
            {text('siret', 'SIRET')}
            {text('publisher', 'Directeur de la publication')}
            {text('host', 'Hébergeur du site')}
          </div>
        </Panel>
        <Panel title="Données de démonstration">
          <p className="text-sm text-brun-2">Restaurez les données d’exemple d’origine : prospects, devis, calendrier, tâches, catalogue et paramètres. Les photos importées sont conservées.</p>
          <Button className="mt-4" variant="danger" icon="refresh" onClick={async () => { if (await confirm({ title: 'Réinitialiser les données de démonstration ?', message: 'Toutes vos modifications seront remplacées par les données d’origine.', confirm: 'Réinitialiser', danger: true })) { reset(); toast('Données de démonstration réinitialisées.'); } }}>Réinitialiser les données</Button>
        </Panel>
      </div>
      <div className="mt-6 flex justify-end"><Button size="lg" icon="check" onClick={save}>Enregistrer les paramètres</Button></div>
    </>
  );
}
