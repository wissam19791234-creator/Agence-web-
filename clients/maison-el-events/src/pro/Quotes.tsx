import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Button, cx, EmptyState, Field, Input, Modal, Select, Textarea, useConfirm, useToast } from '../components/ui';
import { addHistory, createQuote, findProspect, log, nextQuoteNumber } from '../lib/actions';
import { lineTotal, quoteTotals, suggestedLines } from '../lib/calc';
import { EVENT_TYPES, QUOTE_STATUS, STAGES } from '../lib/constants';
import { eur, fmtDate, fmtShort, fullName, uid } from '../lib/format';
import { useImages } from '../lib/images';
import { useStore } from '../lib/store';
import type { Data, EventType, Quote, QuoteLine, QuoteStatus, Unit } from '../lib/types';
import { useUi } from '../lib/ui';
import { ProHeader } from './ProApp';

const statusTone = (s: QuoteStatus) => (s === 'accepte' ? 'ok' : s === 'envoye' ? 'brand' : s === 'refuse' ? 'danger' : 'neutral') as 'ok' | 'brand' | 'danger' | 'neutral';
const canPrint = () => { try { return window.top === window.self; } catch { return false; } };

/** Document de devis (aperçu et impression). */
export function QuoteDocument({ q, data }: { q: Quote; data: Data }) {
  const { get } = useImages();
  const s = data.settings;
  const p = data.prospects.find((x) => x.id === q.prospectId);
  const t = quoteTotals(q);
  const logo = get('logo');
  return (
    <div className="print-area relative overflow-hidden bg-white p-6 text-[13px] text-[#111] sm:p-10">
      <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true"><span className="-rotate-[24deg] whitespace-nowrap font-serif text-[64px] font-semibold uppercase tracking-[.12em] text-black/[.05] sm:text-[88px]">Simulation</span></div>
      <p className="relative mb-6 rounded-lg bg-black px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[.14em] text-white">Simulation uniquement · document de démonstration sans valeur commerciale</p>
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          {logo ? <img src={logo} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-full bg-black text-lg text-white">EL</span>}
          <div><p className="text-2xl leading-tight">{s.businessName}</p><p className="text-xs text-[#777]">{s.tagline} · {s.city}</p></div>
        </div>
        <div className="text-right">
          <p className="font-serif text-3xl leading-none">Devis</p>
          <p className="mt-1 font-medium">{q.number}</p>
          <p className="text-xs text-[#777]">Établi le {fmtDate(new Date(q.updatedAt).toISOString().slice(0, 10))}</p>
          {s.quoteValidityDays > 0 && <p className="text-xs text-[#777]">Valable {s.quoteValidityDays} jours</p>}
        </div>
      </div>
      <div className="relative mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-none bg-[#F3F3F3] p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[.16em] text-[#777]">Émetteur</p>
          <p className="mt-1 font-medium">{s.businessName}</p>
          <p className="text-[#444]">{s.address ? `${s.address}, ${s.city}` : `${s.city} · adresse à compléter`}</p>
          <p className="text-[#444]">{[s.email, s.phone].filter(Boolean).join(' · ') || 'Coordonnées à compléter'}</p>
          <p className="text-[#444]">SIRET : {s.siret || 'à compléter'}</p>
        </div>
        <div className="rounded-none bg-[#F3F3F3] p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[.16em] text-[#777]">Client (fictif)</p>
          <p className="mt-1 font-medium">{p ? fullName(p) : 'Client supprimé'}</p>
          {p?.email && <p className="text-[#444]">{p.email}</p>}
          <p className="mt-2 text-[#444]">{q.eventType} · {fmtDate(q.eventDate)}{q.guests ? ` · ${q.guests} invités` : ''}</p>
          {p?.place && <p className="text-[#444]">{p.place}</p>}
        </div>
      </div>
      <div className="relative mt-6 overflow-x-auto">
        <table className="w-full min-w-[460px] text-left">
          <thead className="border-b border-[#111]/30 text-[11px] uppercase tracking-[.1em] text-[#777]"><tr><th className="py-2 pr-3 font-medium">Prestation</th><th className="py-2 pr-3 text-right font-medium">Qté</th><th className="py-2 pr-3 text-right font-medium">Prix unitaire</th><th className="py-2 text-right font-medium">Montant</th></tr></thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {q.lines.map((l) => { const lt = lineTotal(l); return <tr key={l.id}><td className="py-2.5 pr-3">{l.label}</td><td className="py-2.5 pr-3 text-right tabular">{l.qty.toLocaleString('fr-FR')}</td><td className="py-2.5 pr-3 text-right tabular">{l.unitPrice != null ? `${eur(l.unitPrice)}${l.unit === 'forfait' ? '' : ` ${l.unit === 'par personne' ? '/ pers.' : '/ pièce'}`}` : 'Sur devis'}</td><td className="py-2.5 text-right tabular">{lt != null ? eur(lt) : 'À chiffrer'}</td></tr>; })}
          </tbody>
        </table>
      </div>
      <div className="relative mt-4 flex justify-end">
        <div className="w-full max-w-xs rounded-none bg-[#F3F3F3] p-4">
          <div className="flex justify-between font-medium"><span>Total des prestations chiffrées</span><span className="tabular">{eur(t.known)}</span></div>
          {t.unpriced > 0 && <p className="mt-1 text-xs text-[#444]">+ {t.unpriced} ligne(s) à chiffrer</p>}
        </div>
      </div>
      <div className="relative mt-6 space-y-2 text-xs leading-relaxed text-[#444]">
        {q.extraFees && <p>{q.extraFees}</p>}
        {q.conditions && <p><span className="font-medium text-[#111]">Conditions : </span>{q.conditions}</p>}
        {s.depositText && <p>{s.depositText}</p>}
        {q.notes && <p><span className="font-medium text-[#111]">Notes : </span>{q.notes}</p>}
        <p className="pt-3 text-[#777]">{s.quoteFooter}</p>
      </div>
    </div>
  );
}

/* ───────── Éditeur ───────── */
export function QuoteEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, update } = useStore();
  const { setEditQuote, setOpenProspect, tour, setTour } = useUi();
  const confirm = useConfirm();
  const toast = useToast();
  const stored = data.quotes.find((q) => q.id === id);
  const [q, setQ] = useState<Quote | null>(stored ? structuredClone(stored) : null);
  const [preview, setPreview] = useState(false);
  const [pick, setPick] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { const s = data.quotes.find((x) => x.id === id); setQ(s ? structuredClone(s) : null); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = useMemo(() => !!q && !!stored && JSON.stringify(q) !== JSON.stringify(stored), [q, stored]);
  // Parcours guidé : le devis ouvert devient celui de la démonstration.
  useEffect(() => { if (tour.active && tour.step >= 4 && !tour.quoteId) setTour({ quoteId: id }); }, [tour.active, tour.step, tour.quoteId, id, setTour]);
  if (!q || !stored) return <EmptyState title="Devis introuvable" action={<Button onClick={onClose}>Retour aux devis</Button>}>Ce devis a peut-être été supprimé.</EmptyState>;
  const t = quoteTotals(q);
  const setLine = (lid: string, patch: Partial<QuoteLine>) => setQ({ ...q, lines: q.lines.map((l) => (l.id === lid ? { ...l, ...patch } : l)) });
  const catalogFor = (l: QuoteLine) => data.catalog.find((c) => c.id === l.catalogId);

  const save = (extra?: (d: Data, saved: Quote) => void) => {
    if (q.lines.some((l) => !l.label.trim())) { setErr('Chaque ligne doit avoir un intitulé.'); return false; }
    if (q.lines.some((l) => !(l.qty >= 0) || (l.unitPrice != null && !(l.unitPrice >= 0)))) { setErr('Les quantités et les prix doivent être des nombres positifs.'); return false; }
    setErr('');
    update((d) => {
      const i = d.quotes.findIndex((x) => x.id === q.id);
      const before = d.quotes[i];
      const saved = { ...q, updatedAt: Date.now() };
      d.quotes[i] = saved;
      const p = findProspect(d, q.prospectId);
      if (p) {
        if (before.status !== saved.status) addHistory(p, `Devis ${saved.number} : ${QUOTE_STATUS[saved.status]}.`);
        const order = STAGES.map((s) => s.key);
        if (saved.status === 'envoye' && order.indexOf(p.stage) < order.indexOf('envoye')) { p.stage = 'envoye'; addHistory(p, 'Statut : Devis envoyé — simulation.'); }
      }
      log(d, `Devis ${saved.number} enregistré (${QUOTE_STATUS[saved.status].toLowerCase()}).`, 'devis');
      extra?.(d, saved);
    });
    setQ({ ...q, updatedAt: Date.now() });
    return true;
  };
  const close = async () => {
    if (dirty && !(await confirm({ title: 'Quitter sans enregistrer ?', message: 'Les modifications de ce devis seront perdues.', confirm: 'Quitter', danger: true }))) return;
    onClose();
  };
  const duplicate = () => {
    let nid = '';
    update((d) => {
      const copy: Quote = { ...structuredClone(q), id: uid('q'), number: nextQuoteNumber(d), status: 'brouillon', createdAt: Date.now(), updatedAt: Date.now(), lines: q.lines.map((l) => ({ ...l, id: uid('l') })) };
      d.quotes.unshift(copy); nid = copy.id;
      const p = findProspect(d, q.prospectId); if (p) addHistory(p, `Devis ${copy.number} créé par duplication de ${q.number}.`);
      log(d, `Devis ${q.number} dupliqué en ${copy.number}.`, 'devis');
    });
    setEditQuote(nid); toast('Devis dupliqué : vous modifiez la copie.');
  };
  const remove = async () => {
    if (await confirm({ title: `Supprimer le devis ${q.number} ?`, message: 'Cette action est définitive dans la démonstration.', confirm: 'Supprimer', danger: true })) {
      update((d) => { d.quotes = d.quotes.filter((x) => x.id !== q.id); log(d, `Devis ${q.number} supprimé.`, 'devis'); });
      toast('Devis supprimé.'); onClose();
    }
  };
  const p = data.prospects.find((x) => x.id === q.prospectId);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-panel text-brun-2 ring-1 ring-line hover:text-brand" aria-label="Retour à la liste des devis"><Icon name="left" /></button>
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-[28px] leading-tight text-brun">Devis {q.number} <Badge tone="demo">Simulation uniquement</Badge></h1>
            <p className="text-sm text-brun-2">{p ? <button type="button" className="text-brand hover:underline" onClick={() => setOpenProspect(p.id)}>{fullName(p)}</button> : 'Client supprimé'} · mis à jour {fmtShort(new Date(stored.updatedAt).toISOString().slice(0, 10))}{dirty && <span className="ml-2 font-medium text-warn">· modifications non enregistrées</span>}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon="eye" onClick={() => setPreview(true)}>Prévisualiser</Button>
          <Button variant="secondary" icon="copy" onClick={duplicate}>Dupliquer</Button>
          <Button variant="danger" icon="trash" onClick={remove}>Supprimer</Button>
          <Button icon="check" onClick={() => { if (save()) toast(q.status === 'brouillon' ? 'Brouillon enregistré.' : 'Devis enregistré.'); }} disabled={!dirty}>Enregistrer{q.status === 'brouillon' ? ' le brouillon' : ''}</Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="rounded-none border border-line bg-panel p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Client">{(fid) => <Select id={fid} value={q.prospectId} onChange={(e) => setQ({ ...q, prospectId: e.target.value })}>{data.prospects.map((x) => <option key={x.id} value={x.id}>{fullName(x)}</option>)}</Select>}</Field>
              <Field label="Type d'événement">{(fid) => <Select id={fid} value={q.eventType} onChange={(e) => setQ({ ...q, eventType: e.target.value as EventType })}>{EVENT_TYPES.map((x) => <option key={x}>{x}</option>)}</Select>}</Field>
              <Field label="Date">{(fid) => <Input id={fid} type="date" value={q.eventDate} onChange={(e) => setQ({ ...q, eventDate: e.target.value })} />}</Field>
              <Field label="Invités">{(fid) => <Input id={fid} inputMode="numeric" value={q.guests ?? ''} onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, ''); setQ({ ...q, guests: v ? Number(v) : null }); }} />}</Field>
            </div>
          </section>

          <section className="rounded-none border border-line bg-panel p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold">Prestations</h2>
              <div className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor="add-cat">Ajouter depuis le catalogue</label>
                <Select id="add-cat" className="h-9 !w-56 text-[13px]" value={pick} onChange={(e) => {
                  const c = data.catalog.find((x) => x.id === e.target.value);
                  if (c) setQ({ ...q, lines: [...q.lines, { id: uid('l'), catalogId: c.id, label: c.name, qty: c.unit === 'par personne' ? q.guests || 1 : 1, unitPrice: c.price, unit: c.unit }] });
                  setPick('');
                }}>
                  <option value="">+ Ajouter depuis le catalogue</option>
                  {data.catalog.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.price != null ? eur(c.price) : 'sur devis'}</option>)}
                </Select>
                <Button size="sm" variant="secondary" icon="plus" onClick={() => setQ({ ...q, lines: [...q.lines, { id: uid('l'), label: '', qty: 1, unitPrice: 0, unit: 'forfait' }] })}>Ligne personnalisée</Button>
                <Button size="sm" variant="ghost" icon="refresh" onClick={() => p && setQ({ ...q, lines: suggestedLines(data.catalog, { services: p.services, guests: q.guests }) })} disabled={!p}>Lignes suggérées</Button>
              </div>
            </div>
            {err && <p className="mb-3 rounded-none bg-[#2A1215] px-3 py-2 text-sm text-danger" role="alert">{err}</p>}
            {q.lines.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-[.08em] text-brun-3"><tr><th className="pb-2 pr-2 font-medium">Intitulé</th><th className="w-20 pb-2 pr-2 font-medium">Qté</th><th className="w-28 pb-2 pr-2 font-medium">Prix unit. (€)</th><th className="w-32 pb-2 pr-2 font-medium">Unité</th><th className="w-24 pb-2 pr-2 text-right font-medium">Sous-total</th><th className="w-10 pb-2" /></tr></thead>
                  <tbody className="divide-y divide-line align-top">
                    {q.lines.map((l) => {
                      const c = catalogFor(l), lt = lineTotal(l);
                      const drift = c && c.price !== l.unitPrice;
                      return (
                        <tr key={l.id}>
                          <td className="py-2 pr-2"><Input aria-label="Intitulé de la ligne" className="h-9 text-[13px]" value={l.label} onChange={(e) => setLine(l.id, { label: e.target.value })} />
                            {drift && <p className="mt-1 text-[11px] text-warn">Tarif catalogue actuel : {c!.price != null ? eur(c!.price) : 'sur devis'} · <button type="button" className="font-medium underline" onClick={() => setLine(l.id, { unitPrice: c!.price, unit: c!.unit })}>appliquer</button></p>}</td>
                          <td className="py-2 pr-2"><Input aria-label="Quantité" inputMode="decimal" className="h-9 text-[13px] tabular" value={String(l.qty)} onChange={(e) => { const v = e.target.value.replace(',', '.'); setLine(l.id, { qty: v === '' ? 0 : Number(v) }); }} /></td>
                          <td className="py-2 pr-2"><Input aria-label="Prix unitaire (vide = à chiffrer)" inputMode="decimal" placeholder="À chiffrer" className="h-9 text-[13px] tabular" value={l.unitPrice == null ? '' : String(l.unitPrice)} onChange={(e) => { const v = e.target.value.replace(',', '.'); setLine(l.id, { unitPrice: v === '' ? null : Number(v) }); }} /></td>
                          <td className="py-2 pr-2"><Select aria-label="Unité" className="h-9 text-[13px]" value={l.unit} onChange={(e) => setLine(l.id, { unit: e.target.value as Unit })}>{(['par personne', 'la pièce', 'forfait', 'sur devis'] as Unit[]).map((u) => <option key={u}>{u}</option>)}</Select></td>
                          <td className="py-2 pr-2 pt-4 text-right tabular font-medium">{lt != null && Number.isFinite(lt) ? eur(lt) : <span className="font-normal italic text-brun-3">À chiffrer</span>}</td>
                          <td className="py-2 pt-2.5"><button type="button" aria-label={`Supprimer la ligne ${l.label}`} className="grid h-8 w-8 place-items-center rounded-full text-brun-3 hover:bg-[#2A1215] hover:text-danger" onClick={() => setQ({ ...q, lines: q.lines.filter((x) => x.id !== l.id) })}><Icon name="trash" className="h-4 w-4" /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState icon="file" title="Aucune ligne">Ajoutez une prestation du catalogue ou une ligne personnalisée.</EmptyState>}
          </section>

          <section className="grid gap-4 rounded-none border border-line bg-panel p-5 sm:grid-cols-2">
            <Field label="Frais supplémentaires à confirmer">{(fid) => <Textarea id={fid} rows={3} value={q.extraFees} onChange={(e) => setQ({ ...q, extraFees: e.target.value })} />}</Field>
            <Field label="Conditions">{(fid) => <Textarea id={fid} rows={3} value={q.conditions} onChange={(e) => setQ({ ...q, conditions: e.target.value })} />}</Field>
            <Field label="Notes" className="sm:col-span-2">{(fid) => <Textarea id={fid} rows={2} value={q.notes} onChange={(e) => setQ({ ...q, notes: e.target.value })} />}</Field>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <div className="rounded-none border border-champagne bg-panel p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-brun-3">Total des prestations chiffrées</p>
            <p className="mt-2 font-serif text-[40px] leading-none text-brand tabular">{eur(t.known)}</p>
            {t.unpriced > 0 && <p className="mt-2 text-sm text-brun-2">{t.unpriced} ligne(s) à chiffrer sur devis</p>}
            <p className="mt-3 text-xs text-brun-3">Frais d’installation et de déplacement à confirmer. Montants recalculés à chaque modification.</p>
          </div>
          <div className="rounded-none border border-line bg-panel p-5">
            <Field label="Statut du devis">{(fid) => <Select id={fid} value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value as QuoteStatus })}>{Object.entries(QUOTE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
            <p className="mt-2 text-xs text-brun-3">« Envoyé » et « accepté » sont des statuts simulés : aucun envoi réel.</p>
            {tour.active && tour.step === 5 && q.status === 'brouillon' && (
              <Button className="mt-3 w-full" icon="arrow" onClick={() => { setQ({ ...q, status: 'envoye' }); }}>Passer en « envoyé — simulation »</Button>
            )}
          </div>
          <div className="rounded-none border border-line bg-panel p-5 text-sm">
            <p className="font-medium text-brun">Impression et PDF</p>
            {canPrint() ? <Button className="mt-3 w-full" variant="secondary" icon="file" onClick={() => { setPreview(true); setTimeout(() => window.print(), 300); }}>Imprimer ou enregistrer en PDF</Button>
              : <p className="mt-1 text-xs text-brun-3">Indisponibles dans cet aperçu en ligne : ils fonctionneront sur la version hébergée du site. Utilisez « Prévisualiser » pour voir le document.</p>}
          </div>
        </aside>
      </div>

      <Modal open={preview} onClose={() => setPreview(false)} title={`Aperçu du devis ${q.number}`} size="xl" footer={<Button variant="secondary" onClick={() => setPreview(false)}>Fermer l’aperçu</Button>}>
        <QuoteDocument q={q} data={data} />
      </Modal>
    </>
  );
}

/* ───────── Liste ───────── */
export default function Quotes() {
  const { data, update } = useStore();
  const { setEditQuote, tour, setTour } = useUi();
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [pid, setPid] = useState('');
  const list = data.quotes.filter((q) => !status || q.status === status).sort((a, b) => b.updatedAt - a.updatedAt);
  const create = () => {
    if (!pid) return;
    let id = '';
    update((d) => { id = createQuote(d, pid); });
    if (tour.active) setTour({ quoteId: id });
    setCreating(false); setPid(''); setEditQuote(id);
  };
  return (
    <>
      <ProHeader title="Devis" sub="Tous les devis générés ici portent la mention « Simulation uniquement »." actions={<Button icon="plus" onClick={() => setCreating(true)}>Nouveau devis</Button>} />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
        {[['', 'Tous'], ...Object.entries(QUOTE_STATUS)].map(([k, v]) => (
          <button key={k} type="button" aria-pressed={status === k} onClick={() => setStatus(k)} className={cx('rounded-full px-3.5 py-1.5 text-[13px] transition', status === k ? 'bg-white text-black' : 'bg-panel text-brun-2 ring-1 ring-inset ring-line')}>{v} <span className="tabular opacity-70">{k ? data.quotes.filter((q) => q.status === k).length : data.quotes.length}</span></button>
        ))}
      </div>
      {list.length ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((q) => {
            const p = data.prospects.find((x) => x.id === q.prospectId);
            const t = quoteTotals(q);
            return (
              <li key={q.id}>
                <button type="button" onClick={() => setEditQuote(q.id)} className="block w-full rounded-none border border-line bg-panel p-5 text-left transition hover:-translate-y-0.5 hover:">
                  <span className="flex items-start justify-between gap-3"><span className="font-medium text-brun">{q.number}</span><Badge tone={statusTone(q.status)}>{QUOTE_STATUS[q.status]}</Badge></span>
                  <span className="mt-1 block text-sm text-brun-2">{p ? fullName(p) : 'Client supprimé'} · {q.eventType}</span>
                  <span className="mt-0.5 block text-xs text-brun-3">{fmtDate(q.eventDate)}{q.guests ? ` · ${q.guests} invités` : ''}</span>
                  <span className="mt-4 flex items-end justify-between"><span className="text-[28px] leading-none text-brun tabular">{eur(t.known)}</span><span className="text-xs text-brun-3">{t.unpriced ? `${t.unpriced} à chiffrer` : 'Tout chiffré'}</span></span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : <EmptyState icon="file" title="Aucun devis" action={<Button icon="plus" onClick={() => setCreating(true)}>Créer un devis</Button>}>Créez un devis à partir d’une fiche prospect.</EmptyState>}
      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau devis" footer={<><Button variant="secondary" onClick={() => setCreating(false)}>Annuler</Button><Button disabled={!pid} onClick={create}>Créer le devis</Button></>}>
        <Field label="Client" hint="Les lignes tarifées connues sont ajoutées automatiquement selon les prestations demandées.">{(fid, by) => <Select id={fid} aria-describedby={by} value={pid} onChange={(e) => setPid(e.target.value)}><option value="">Choisir un prospect…</option>{data.prospects.map((x) => <option key={x.id} value={x.id}>{fullName(x)} · {x.eventType}</option>)}</Select>}</Field>
      </Modal>
    </>
  );
}
