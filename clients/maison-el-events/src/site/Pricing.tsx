import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Button, cx, Field, Input, LinkButton, Modal, Select, useToast } from '../components/ui';
import { createProspect, createQuoteFromLines } from '../lib/actions';
import { simulate } from '../lib/calc';
import { EVENT_TYPES, PRICE_IDS } from '../lib/constants';
import { eur, isEmail, todayISO, uid } from '../lib/format';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { EventType, QuoteLine, ServiceKey } from '../lib/types';
import { useUi } from '../lib/ui';
import { PageHead } from './Pages';

const EXTRAS: { k: ServiceKey; id: string; label: string }[] = [
  { k: 'buffets', id: PRICE_IDS.buffet, label: 'Décoration de buffet' },
  { k: 'location', id: PRICE_IDS.location, label: 'Location de matériel et décor' },
  { k: 'traiteur', id: PRICE_IDS.traiteur, label: 'Prestation traiteur' },
];

function Qty({ label, value, onChange, max, hint, id }: { label: string; value: string; onChange: (v: string) => void; max: number; hint?: string; id: string }) {
  const n = Number(value);
  const err = value === '' ? '' : !Number.isInteger(n) || n < 0 ? 'Saisissez un nombre entier positif.' : n > max ? `Maximum ${max.toLocaleString('fr-FR')}.` : '';
  const step = (d: number) => onChange(String(Math.max(0, Math.min(max, (Number.isFinite(n) ? Math.round(n) : 0) + d))));
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-brun-2">{label}</label>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-white focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10">
        <button type="button" className="w-11 shrink-0 text-xl text-brun-2 hover:bg-brand-soft hover:text-brand" aria-label={`Diminuer : ${label}`} onClick={() => step(-1)}>−</button>
        <input id={id} inputMode="numeric" className="h-11 w-full min-w-0 bg-transparent text-center text-[15px] tabular outline-none" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))} aria-invalid={!!err} aria-describedby={err ? id + '-e' : hint ? id + '-h' : undefined} />
        <button type="button" className="w-11 shrink-0 text-xl text-brun-2 hover:bg-brand-soft hover:text-brand" aria-label={`Augmenter : ${label}`} onClick={() => step(1)}>+</button>
      </div>
      {err ? <p id={id + '-e'} className="mt-1.5 text-xs font-medium text-danger">{err}</p> : hint ? <p id={id + '-h'} className="mt-1.5 text-xs text-brun-3">{hint}</p> : null}
    </div>
  );
}

export default function Pricing() {
  const { data, update } = useStore();
  const { setPrefill, setOpenProspect } = useUi();
  const toast = useToast();
  const [v, setV] = useState({ guests: '80', sweet: '80', savory: '80', drinks: '40' });
  const [coin, setCoin] = useState(false);
  const [extras, setExtras] = useState<ServiceKey[]>([]);
  const [save, setSave] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', eventType: 'Mariage' as EventType, eventDate: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const num = (s: string) => (s === '' ? 0 : Number(s));
  const valid = Object.values(v).every((s) => s === '' || (Number.isInteger(Number(s)) && Number(s) >= 0)) && num(v.guests) <= 2000 && num(v.sweet) <= 10000 && num(v.savory) <= 10000 && num(v.drinks) <= 5000;
  const sim = useMemo(() => simulate(data.catalog, { guests: num(v.guests), sweet: num(v.sweet), savory: num(v.savory), drinks: num(v.drinks), coin }), [data.catalog, v, coin]);
  const ref = (id: string) => data.catalog.find((c) => c.id === id);
  const priced = [PRICE_IDS.decoTable, PRICE_IDS.sucree, PRICE_IDS.salee, PRICE_IDS.boisson, PRICE_IDS.coinMaries].map(ref).filter(Boolean);
  const onQuote = [PRICE_IDS.buffet, PRICE_IDS.location, PRICE_IDS.traiteur, PRICE_IDS.installation].map(ref).filter(Boolean);

  const services = (): ServiceKey[] => {
    const s: ServiceKey[] = [];
    if (num(v.guests) > 0) s.push('deco-tables');
    if (coin) s.push('mariage');
    if (num(v.sweet) + num(v.savory) > 0) s.push('mignardises');
    if (num(v.drinks) > 0) s.push('mocktails');
    return [...s, ...extras];
  };
  const summary = () => `Simulation : ${num(v.guests)} invités, ${num(v.sweet)} mignardises sucrées, ${num(v.savory)} mignardises salées, ${num(v.drinks)} boissons${coin ? ', coin mariés' : ''}. Montant estimé des prestations tarifées : ${eur(sim.total)}.${extras.length ? ' À chiffrer sur devis : ' + EXTRAS.filter((e) => extras.includes(e.k)).map((e) => e.label.toLowerCase()).join(', ') + '.' : ''}`;

  const submitSave = () => {
    const e: Record<string, string> = {};
    if (form.email && !isEmail(form.email)) e.email = 'Adresse e-mail invalide (exemple : nom@domaine.fr).';
    if (form.eventDate && form.eventDate < todayISO()) e.eventDate = 'Choisissez une date à venir.';
    setErrors(e);
    if (Object.keys(e).length) return;
    let pid = '';
    update((d) => {
      pid = createProspect(d, {
        firstName: form.firstName.trim() || 'Simulation', lastName: form.lastName.trim() || new Date().toLocaleDateString('fr-FR'), email: form.email.trim(), phone: '',
        eventType: form.eventType, eventDate: form.eventDate, place: '', guests: num(v.guests) || null, services: services(), budget: '', needs: summary(), source: 'simulation', inspirationIds: [], tags: ['Simulation'],
      }, 'Simulation enregistrée depuis la page Tarifs.');
      const lines: QuoteLine[] = sim.rows.filter((r) => r.qty > 0).map((r) => {
        const c = d.catalog.find((x) => x.id === r.id)!;
        return { id: uid('l'), catalogId: c.id, label: c.name, qty: r.qty, unitPrice: c.price, unit: c.unit };
      });
      for (const x of EXTRAS.filter((e2) => extras.includes(e2.k))) { const c = d.catalog.find((y) => y.id === x.id); if (c) lines.push({ id: uid('l'), catalogId: c.id, label: c.name, qty: 1, unitPrice: null, unit: 'sur devis' }); }
      const inst = d.catalog.find((y) => y.id === PRICE_IDS.installation);
      if (inst) lines.push({ id: uid('l'), catalogId: inst.id, label: inst.name, qty: 1, unitPrice: null, unit: 'sur devis' });
      createQuoteFromLines(d, pid, lines, 'Devis préparé automatiquement à partir de la simulation du site.');
    });
    setSave(false); setSaved(pid);
    toast('Simulation enregistrée dans le CRM de démonstration.');
  };

  return (
    <>
      <PageHead eyebrow="Tarifs" title="Tarifs et simulateur de budget">Les tarifs ci-dessous sont ceux communiqués par Maison EL Events. Les frais d'installation et de déplacement, ainsi que les prestations non tarifées, sont établis sur devis.</PageHead>

      <section className="mx-auto max-w-site px-4 py-14 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {priced.map((c) => c && (
            <article key={c.id} className="flex flex-col rounded-[22px] border border-line bg-white p-6">
              <h2 className="font-serif text-[22px] leading-tight text-brun">{c.id === PRICE_IDS.boisson ? 'Cocktails et mocktails' : c.id === PRICE_IDS.sucree ? 'Mignardises sucrées' : c.id === PRICE_IDS.salee ? 'Mignardises salées' : c.name}</h2>
              <p className="mt-3 font-serif text-[34px] leading-none text-brand">{c.price != null ? eur(c.price) : 'Sur devis'}</p>
              <p className="mt-1 text-xs uppercase tracking-[.16em] text-brun-3">{c.unit}</p>
              <p className="mt-4 text-sm leading-relaxed text-brun-2">{c.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 rounded-[22px] bg-ivoire p-6">
          <h2 className="font-serif text-2xl text-brun">Sur devis</h2>
          <ul className="mt-3 grid gap-2 text-sm text-brun-2 sm:grid-cols-2">
            {onQuote.map((c) => c && <li key={c.id} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-champagne-deep" />{c.name}</li>)}
            <li className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-champagne-deep" />Un acompte peut être demandé pour confirmer la réservation.</li>
          </ul>
        </div>
      </section>

      <section className="bg-white py-16" aria-labelledby="simu-t">
        <div className="mx-auto grid max-w-site gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_440px]">
          <div>
            <h2 id="simu-t" className="font-serif text-4xl text-brun">Simuler mon budget</h2>
            <p className="mt-3 max-w-xl text-[15px] text-brun-2">Indiquez vos quantités : le montant des prestations tarifées se calcule instantanément.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <Qty id="sim-guests" label="Nombre d'invités" value={v.guests} max={2000} onChange={(x) => setV({ ...v, guests: x })} hint="Sert au calcul de la décoration de table." />
              <Qty id="sim-drinks" label="Cocktails ou mocktails" value={v.drinks} max={5000} onChange={(x) => setV({ ...v, drinks: x })} />
              <Qty id="sim-sweet" label="Mignardises sucrées" value={v.sweet} max={10000} onChange={(x) => setV({ ...v, sweet: x })} />
              <Qty id="sim-savory" label="Mignardises salées" value={v.savory} max={10000} onChange={(x) => setV({ ...v, savory: x })} />
            </div>
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-cream p-4">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[rgb(var(--brand))]" checked={coin} onChange={(e) => setCoin(e.target.checked)} />
              <span><span className="block font-medium text-brun">Ajouter le coin mariés ({eur(sim.prices.coin)})</span><span className="text-sm text-brun-2">Bougeoirs de plus d'un mètre, housses et draps du canapé de style henné.</span></span>
            </label>
            <fieldset className="mt-6">
              <legend className="mb-2 text-[13px] font-medium text-brun-2">Autres prestations à chiffrer sur devis</legend>
              <div className="flex flex-wrap gap-2">
                {EXTRAS.map((x) => {
                  const on = extras.includes(x.k);
                  return <button key={x.k} type="button" aria-pressed={on} onClick={() => setExtras(on ? extras.filter((y) => y !== x.k) : [...extras, x.k])} className={cx('rounded-full px-4 py-2 text-sm transition', on ? 'bg-brand text-cream' : 'bg-cream text-brun-2 ring-1 ring-inset ring-line')}>{x.label}</button>;
                })}
              </div>
            </fieldset>
          </div>

          <aside className="self-start rounded-[26px] border border-champagne bg-cream p-6 shadow-soft lg:sticky lg:top-24" aria-live="polite">
            <p className="text-[11px] font-medium uppercase tracking-[.24em] text-champagne-deep">Estimation</p>
            <ul className="mt-4 divide-y divide-line text-sm">
              {sim.rows.map((r) => (
                <li key={r.id} className={cx('flex items-baseline justify-between gap-3 py-2.5', r.qty === 0 && 'text-brun-3')}>
                  <span><span className="text-brun">{r.label}</span><span className="block text-xs text-brun-3 tabular">{r.qty.toLocaleString('fr-FR')} × {eur(r.unit)} {r.unitLabel === 'forfait' ? '' : r.unitLabel}</span></span>
                  <span className="tabular font-medium text-brun">{eur(r.total)}</span>
                </li>
              ))}
              {extras.map((k) => <li key={k} className="flex justify-between gap-3 py-2.5 text-brun-2"><span>{EXTRAS.find((x) => x.k === k)!.label}</span><span className="italic">Sur devis</span></li>)}
              <li className="flex justify-between gap-3 py-2.5 text-brun-2"><span>Installation et déplacement</span><span className="italic">Sur devis</span></li>
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-brun/15 pt-4">
              <span className="font-medium text-brun">Total des prestations tarifées</span>
              <span className="font-serif text-[34px] leading-none text-brand tabular">{valid ? eur(sim.total) : '—'}</span>
            </div>
            {!valid && <p className="mt-2 text-xs font-medium text-danger">Corrigez les quantités pour afficher l’estimation.</p>}
            <p className="mt-4 text-xs leading-relaxed text-brun-3">Estimation basée sur vos sélections ; elle ne constitue pas un devis définitif. Les frais de déplacement, d’installation et les prestations non tarifées restent à confirmer.</p>
            <div className="mt-5 grid gap-2">
              <Button disabled={!valid} icon="kanban" onClick={() => { setErrors({}); setSave(true); }}>Enregistrer cette simulation dans le CRM</Button>
              <Button variant="secondary" disabled={!valid} onClick={() => { setPrefill({ guests: num(v.guests) || null, services: services(), needs: summary() }); navigate('devis'); }}>Demander un devis avec cette simulation</Button>
            </div>
            {saved && (
              <div className="mt-4 rounded-2xl bg-white p-4 text-sm ring-1 ring-line animate-rise">
                <p className="font-medium text-brun">Simulation enregistrée (démonstration)</p>
                <p className="mt-1 text-brun-2">Une fiche prospect et un devis brouillon ont été créés dans l’espace professionnel.</p>
                <button type="button" className="mt-2 inline-flex items-center gap-1 font-medium text-brand hover:underline" onClick={() => { setOpenProspect(saved); navigate('pro-prospects'); }}>Ouvrir la fiche<Icon name="arrow" className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </aside>
        </div>
      </section>

      <Modal open={save} onClose={() => setSave(false)} title="Enregistrer la simulation"
        footer={<><Button variant="secondary" onClick={() => setSave(false)}>Annuler</Button><Button onClick={submitSave}>Enregistrer dans le CRM</Button></>}>
        <p className="mb-5 text-sm text-brun-2">Facultatif : ajoutez un nom pour retrouver cette simulation. Elle sera enregistrée comme fiche fictive dans l’espace de démonstration, avec un devis brouillon.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom">{(id) => <Input id={id} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} autoComplete="given-name" />}</Field>
          <Field label="Nom">{(id) => <Input id={id} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} autoComplete="family-name" />}</Field>
          <Field label="E-mail" error={errors.email} className="sm:col-span-2">{(id, by) => <Input id={id} type="email" value={form.email} aria-invalid={!!errors.email} aria-describedby={by} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
          <Field label="Type d'événement">{(id) => <Select id={id} value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value as EventType })}>{EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>}</Field>
          <Field label="Date souhaitée" error={errors.eventDate}>{(id, by) => <Input id={id} type="date" min={todayISO()} value={form.eventDate} aria-invalid={!!errors.eventDate} aria-describedby={by} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />}</Field>
        </div>
      </Modal>
      <div className="mx-auto mt-10 max-w-site px-4 text-center sm:px-6"><LinkButton href="#devis" variant="secondary" iconRight="arrow">Demander un devis détaillé</LinkButton></div>
    </>
  );
}
