import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Button, cx, EmptyState, FictifBadge, Field, Input, Modal, Select, Textarea, useConfirm, useToast } from '../components/ui';
import { addEventFor, addHistory, createProspect, createQuote, deleteProspect, findProspect, log, setStage } from '../lib/actions';
import { estimateFor, quoteTotals } from '../lib/calc';
import { EVENT_TYPES, QUOTE_STATUS, SERVICE_KEYS, SERVICE_LABELS, STAGES, stageDot, stageLabel } from '../lib/constants';
import { daysFromToday, eur, fmtDate, fmtDateTime, fmtShort, fullName, isEmail, isPhone, todayISO, uid } from '../lib/format';
import { useImages } from '../lib/images';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { EventType, Prospect, ServiceKey, StageKey } from '../lib/types';
import { useUi } from '../lib/ui';
import { ProHeader } from './ProApp';
import { TaskForm } from './Tasks';

export function StageBadge({ stage }: { stage: StageKey }) {
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ivoire px-2.5 py-0.5 text-[11.5px] font-medium text-brun-2 ring-1 ring-inset ring-line"><span className="h-2 w-2 rounded-full" style={{ background: stageDot(stage) }} />{stageLabel(stage)}</span>;
}

/* ───────── Formulaire d'ajout / modification ───────── */
type PForm = Omit<Prospect, 'id' | 'notes' | 'history' | 'createdAt' | 'fictif' | 'inspirationIds' | 'source' | 'guests' | 'tags'> & { guests: string; tags: string };
const toForm = (p?: Prospect): PForm => ({
  firstName: p?.firstName ?? '', lastName: p?.lastName ?? '', email: p?.email ?? '', phone: p?.phone ?? '', eventType: p?.eventType ?? 'Mariage',
  eventDate: p?.eventDate ?? '', place: p?.place ?? '', guests: p?.guests ? String(p.guests) : '', services: p?.services ?? [], budget: p?.budget ?? '',
  needs: p?.needs ?? '', tags: (p?.tags ?? []).join(', '), stage: p?.stage ?? 'nouveau', nextAction: p?.nextAction ?? '', nextActionDate: p?.nextActionDate ?? '', lastContact: p?.lastContact ?? '',
});

export function ProspectForm({ open, onClose, prospect }: { open: boolean; onClose: (id?: string) => void; prospect?: Prospect }) {
  const { update } = useStore();
  const toast = useToast();
  const [f, setF] = useState<PForm>(toForm(prospect));
  const [e, setE] = useState<Record<string, string>>({});
  useEffect(() => { if (open) { setF(toForm(prospect)); setE({}); } }, [open, prospect]);
  const set = <K extends keyof PForm>(k: K, v: PForm[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    const err: Record<string, string> = {};
    if (!f.firstName.trim()) err.firstName = 'Prénom obligatoire.';
    if (!f.lastName.trim()) err.lastName = 'Nom obligatoire.';
    if (f.email && !isEmail(f.email)) err.email = 'Adresse e-mail invalide.';
    if (f.phone && !isPhone(f.phone)) err.phone = 'Numéro invalide (10 chiffres).';
    if (f.guests && (!Number.isInteger(Number(f.guests)) || Number(f.guests) < 1 || Number(f.guests) > 2000)) err.guests = 'Entre 1 et 2 000.';
    setE(err);
    if (Object.keys(err).length) return;
    const tags = f.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const guests = f.guests ? Number(f.guests) : null;
    let id = prospect?.id;
    update((d) => {
      if (prospect) {
        const p = findProspect(d, prospect.id)!;
        const stageChanged = p.stage !== f.stage;
        Object.assign(p, { ...f, guests, tags });
        addHistory(p, 'Fiche modifiée.');
        if (stageChanged) addHistory(p, `Statut : ${stageLabel(f.stage)}.`);
        log(d, `Fiche mise à jour : ${fullName(p)}.`, 'client');
      } else {
        id = createProspect(d, { ...f, guests, tags, source: 'manuel', inspirationIds: [] }, 'Fiche créée manuellement.');
        const p = findProspect(d, id)!;
        p.stage = f.stage; if (f.nextAction) { p.nextAction = f.nextAction; p.nextActionDate = f.nextActionDate; } p.lastContact = f.lastContact;
      }
    });
    toast(prospect ? 'Fiche enregistrée.' : 'Fiche créée.');
    onClose(id);
  };
  return (
    <Modal open={open} onClose={() => onClose()} title={prospect ? `Modifier ${fullName(prospect)}` : 'Nouveau prospect (fictif)'} size="lg"
      footer={<><Button variant="secondary" onClick={() => onClose()}>Annuler</Button><Button onClick={save} icon="check">Enregistrer</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" required error={e.firstName}>{(id, by) => <Input id={id} value={f.firstName} aria-invalid={!!e.firstName} aria-describedby={by} onChange={(x) => set('firstName', x.target.value)} />}</Field>
        <Field label="Nom" required error={e.lastName}>{(id, by) => <Input id={id} value={f.lastName} aria-invalid={!!e.lastName} aria-describedby={by} onChange={(x) => set('lastName', x.target.value)} />}</Field>
        <Field label="E-mail" error={e.email} hint="Utilisez une adresse fictive en démonstration.">{(id, by) => <Input id={id} type="email" value={f.email} aria-invalid={!!e.email} aria-describedby={by} onChange={(x) => set('email', x.target.value)} />}</Field>
        <Field label="Téléphone" error={e.phone}>{(id, by) => <Input id={id} type="tel" value={f.phone} aria-invalid={!!e.phone} aria-describedby={by} onChange={(x) => set('phone', x.target.value)} />}</Field>
        <Field label="Type d'événement">{(id) => <Select id={id} value={f.eventType} onChange={(x) => set('eventType', x.target.value as EventType)}>{EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>}</Field>
        <Field label="Date de l'événement">{(id) => <Input id={id} type="date" value={f.eventDate} onChange={(x) => set('eventDate', x.target.value)} />}</Field>
        <Field label="Lieu">{(id) => <Input id={id} value={f.place} onChange={(x) => set('place', x.target.value)} />}</Field>
        <Field label="Invités" error={e.guests}>{(id, by) => <Input id={id} inputMode="numeric" value={f.guests} aria-invalid={!!e.guests} aria-describedby={by} onChange={(x) => set('guests', x.target.value.replace(/[^\d]/g, ''))} />}</Field>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-[13px] font-medium text-brun-2">Prestations</legend>
          <div className="flex flex-wrap gap-2">
            {SERVICE_KEYS.map((k) => { const on = f.services.includes(k); return <button key={k} type="button" aria-pressed={on} onClick={() => set('services', on ? f.services.filter((s) => s !== k) : [...f.services, k])} className={cx('rounded-full px-3 py-1.5 text-xs transition', on ? 'bg-brand text-cream' : 'bg-cream text-brun-2 ring-1 ring-inset ring-line')}>{SERVICE_LABELS[k]}</button>; })}
          </div>
        </fieldset>
        <Field label="Statut">{(id) => <Select id={id} value={f.stage} onChange={(x) => set('stage', x.target.value as StageKey)}>{STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</Select>}</Field>
        <Field label="Budget indicatif">{(id) => <Input id={id} value={f.budget} onChange={(x) => set('budget', x.target.value)} />}</Field>
        <Field label="Prochaine action">{(id) => <Input id={id} value={f.nextAction} onChange={(x) => set('nextAction', x.target.value)} />}</Field>
        <Field label="Échéance de l'action">{(id) => <Input id={id} type="date" value={f.nextActionDate} onChange={(x) => set('nextActionDate', x.target.value)} />}</Field>
        <Field label="Dernier contact">{(id) => <Input id={id} type="date" max={todayISO()} value={f.lastContact} onChange={(x) => set('lastContact', x.target.value)} />}</Field>
        <Field label="Tags" hint="Séparés par des virgules">{(id) => <Input id={id} value={f.tags} onChange={(x) => set('tags', x.target.value)} />}</Field>
        <Field label="Besoins" className="sm:col-span-2">{(id) => <Textarea id={id} value={f.needs} onChange={(x) => set('needs', x.target.value)} />}</Field>
      </div>
    </Modal>
  );
}

/* ───────── Fiche détaillée ───────── */
export function ProspectDrawer() {
  const { data, update } = useStore();
  const { openProspect, setOpenProspect, setEditQuote, setCalendarFocus, tour, setTour } = useUi();
  const images = useImages();
  const confirm = useConfirm();
  const toast = useToast();
  const p = data.prospects.find((x) => x.id === openProspect);
  const [edit, setEdit] = useState(false);
  const [note, setNote] = useState('');
  const [tag, setTag] = useState('');
  const [task, setTask] = useState(false);
  const [na, setNa] = useState({ text: '', date: '' });
  useEffect(() => { if (p) setNa({ text: p.nextAction, date: p.nextActionDate }); setNote(''); setTag(''); }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!p) return null;
  const quotes = data.quotes.filter((q) => q.prospectId === p.id);
  const events = data.events.filter((e) => e.prospectId === p.id);
  const tasks = data.tasks.filter((t) => t.prospectId === p.id);
  const dd = daysFromToday(p.eventDate);
  const est = estimateFor(p, data.quotes, data.catalog);
  const mut = (fn: (x: Prospect) => void) => update((d) => { const x = findProspect(d, p.id); if (x) fn(x); });

  const newQuote = () => {
    let qid = '';
    update((d) => { qid = createQuote(d, p.id); });
    if (tour.active) setTour({ quoteId: qid });
    setOpenProspect(null); setEditQuote(qid); navigate('pro-devis');
  };
  const toCalendar = () => {
    let eid = '';
    update((d) => { eid = addEventFor(d, p.id, p.stage === 'reservation' ? 'confirme' : p.stage === 'termine' ? 'termine' : 'option'); });
    if (tour.active) setTour({ eventId: eid });
    toast('Événement inscrit au calendrier.');
    setCalendarFocus(p.eventDate || null); setOpenProspect(null); navigate('pro-calendrier');
  };
  const remove = async () => {
    if (await confirm({ title: `Supprimer la fiche de ${fullName(p)} ?`, message: 'La fiche, ses devis et ses événements seront supprimés. Les tâches liées seront conservées sans client associé.', confirm: 'Supprimer', danger: true })) {
      update((d) => deleteProspect(d, p.id)); setOpenProspect(null); toast('Fiche supprimée.');
    }
  };

  return (
    <>
      <Modal open={!!p && !edit && !task} onClose={() => setOpenProspect(null)} title={fullName(p)} size="lg" side>
        <div className="flex flex-wrap items-center gap-2">
          <FictifBadge /><StageBadge stage={p.stage} />
          <Badge>{p.source === 'site' ? 'Formulaire du site' : p.source === 'simulation' ? 'Simulation' : p.source === 'manuel' ? 'Saisie manuelle' : 'Exemple'}</Badge>
          {p.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11.5px] text-brand">
              {t}<button type="button" aria-label={`Retirer le tag ${t}`} className="rounded-full hover:text-brand-deep" onClick={() => mut((x) => { x.tags = x.tags.filter((y) => y !== t); })}><Icon name="x" className="h-3 w-3" /></button>
            </span>
          ))}
          <form className="inline-flex" onSubmit={(e) => { e.preventDefault(); const t = tag.trim(); if (t && !p.tags.includes(t)) mut((x) => { x.tags.push(t); }); setTag(''); }}>
            <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="+ tag" aria-label="Ajouter un tag" className="h-6 w-20 rounded-full border border-dashed border-line bg-transparent px-2 text-[11.5px] outline-none focus:border-brand/50" />
          </form>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="drawer-stage">Statut</label>
          <select id="drawer-stage" value={p.stage} onChange={(e) => { update((d) => setStage(d, p.id, e.target.value as StageKey)); toast('Statut mis à jour.'); }} className="h-9 rounded-full border border-line bg-white px-3 text-[13px] outline-none focus:ring-4 focus:ring-brand/10">
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <Button size="sm" icon="file" onClick={newQuote}>Créer un devis</Button>
          <Button size="sm" variant="secondary" icon="calendar" onClick={toCalendar}>{events.length ? 'Voir au calendrier' : 'Inscrire au calendrier'}</Button>
          <Button size="sm" variant="secondary" icon="check" onClick={() => setTask(true)}>Tâche</Button>
          <Button size="sm" variant="secondary" icon="edit" onClick={() => setEdit(true)}>Modifier</Button>
          <Button size="sm" variant="danger" icon="trash" onClick={remove}>Supprimer</Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-brun-3">Coordonnées</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-brun"><Icon name="mail" className="h-4 w-4 text-brun-3" />{p.email || 'Non renseigné'}</p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-brun"><Icon name="phone" className="h-4 w-4 text-brun-3" />{p.phone || 'Non renseigné'}</p>
            <p className="mt-3 text-xs text-brun-3">Dernier contact : {p.lastContact ? fmtDate(p.lastContact) : 'aucun'}</p>
            <button type="button" className="mt-1 text-xs font-medium text-brand hover:underline" onClick={() => { mut((x) => { x.lastContact = todayISO(); addHistory(x, 'Contact noté aujourd’hui.'); }); toast('Dernier contact : aujourd’hui.'); }}>Noter un contact aujourd’hui</button>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-brun-3">Événement</h3>
            <p className="mt-2 text-sm font-medium text-brun">{p.eventType}{p.guests ? ` · ${p.guests} invités` : ''}</p>
            <p className="mt-1 text-sm text-brun-2">{fmtDate(p.eventDate)}{dd != null && (dd >= 0 ? ` · J-${dd}` : ' · passé')}</p>
            <p className="mt-1 text-sm text-brun-2">{p.place || 'Lieu à préciser'}</p>
            <p className="mt-3 text-xs text-brun-3">{est.fromQuote ? 'Dernier devis' : 'Estimation tarifs connus'} : <span className="font-medium text-brun">{eur(est.amount)}</span>{p.budget && ` · budget : ${p.budget}`}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-line">
          <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-brun-3">Prestations et besoins</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">{p.services.length ? p.services.map((s: ServiceKey) => <span key={s} className="rounded-full bg-ivoire px-2.5 py-1 text-xs text-brun-2">{SERVICE_LABELS[s]}</span>) : <span className="text-sm text-brun-3">Aucune prestation précisée</span>}</div>
          {p.needs && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-brun-2">{p.needs}</p>}
          {p.inspirationIds.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">{p.inspirationIds.map((k) => images.get(k) ? <img key={k} src={images.get(k)} alt="Photo d'inspiration du client" className="aspect-square w-full rounded-xl object-cover" /> : <span key={k} className="grid aspect-square place-items-center rounded-xl bg-ivoire text-[10px] text-brun-3">Photo indisponible</span>)}</div>
          )}
        </div>

        <form className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-line" onSubmit={(e) => { e.preventDefault(); mut((x) => { x.nextAction = na.text.trim(); x.nextActionDate = na.date; addHistory(x, `Prochaine action : ${na.text.trim() || 'aucune'}.`); }); toast('Prochaine action enregistrée.'); }}>
          <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-brun-3">Prochaine action</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_160px_auto]">
            <Input aria-label="Prochaine action" value={na.text} onChange={(e) => setNa({ ...na, text: e.target.value })} placeholder="Ex. rappeler pour valider la date" />
            <Input aria-label="Échéance" type="date" value={na.date} onChange={(e) => setNa({ ...na, date: e.target.value })} />
            <Button type="submit" variant="secondary">Enregistrer</Button>
          </div>
        </form>

        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-line">
          <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-brun-3">Notes internes</h3>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = note.trim(); if (!t) return; mut((x) => { x.notes.unshift({ id: uid('n'), at: Date.now(), text: t }); addHistory(x, 'Note interne ajoutée.'); }); setNote(''); }}>
            <Input aria-label="Nouvelle note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ajouter une note visible uniquement en interne" />
            <Button type="submit" variant="secondary" disabled={!note.trim()}>Ajouter</Button>
          </form>
          <ul className="mt-3 space-y-2">
            {p.notes.map((n) => (
              <li key={n.id} className="group flex items-start justify-between gap-3 rounded-xl bg-cream px-3 py-2 text-sm">
                <span><span className="text-brun">{n.text}</span><span className="block text-[11px] text-brun-3">{fmtDateTime(n.at)}</span></span>
                <button type="button" aria-label="Supprimer la note" className="text-brun-3 hover:text-danger" onClick={() => mut((x) => { x.notes = x.notes.filter((y) => y.id !== n.id); })}><Icon name="trash" className="h-4 w-4" /></button>
              </li>
            ))}
            {!p.notes.length && <li className="text-sm text-brun-3">Aucune note pour le moment.</li>}
          </ul>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-brun-3">Devis</h3>
            <ul className="mt-2 space-y-2">
              {quotes.map((q) => (
                <li key={q.id}><button type="button" className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-cream" onClick={() => { setOpenProspect(null); setEditQuote(q.id); navigate('pro-devis'); }}>
                  <span><span className="font-medium text-brun">{q.number}</span><span className="block text-xs text-brun-3">{QUOTE_STATUS[q.status]}</span></span><span className="tabular text-brun">{eur(quoteTotals(q).known)}</span>
                </button></li>
              ))}
              {!quotes.length && <li className="text-sm text-brun-3">Aucun devis.</li>}
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-brun-3">Calendrier et tâches</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {events.map((e) => <li key={e.id} className="flex items-center gap-2 text-brun"><Icon name="calendar" className="h-4 w-4 text-brun-3" />{fmtShort(e.date)} · {e.status === 'confirme' ? 'Confirmé (simulation)' : e.status === 'option' ? 'Option' : 'Terminé'}</li>)}
              {tasks.map((t) => <li key={t.id} className={cx('flex items-center gap-2', t.done ? 'text-brun-3 line-through' : 'text-brun')}><Icon name="check" className="h-4 w-4 text-brun-3" />{t.title} · {fmtShort(t.due)}</li>)}
              {!events.length && !tasks.length && <li className="text-brun-3">Rien de planifié.</li>}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-line">
          <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-brun-3">Historique</h3>
          <ol className="mt-3 space-y-2.5 border-l border-line pl-4">
            {p.history.map((h) => <li key={h.id} className="relative text-sm text-brun-2"><span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-champagne-deep" />{h.text}<span className="block text-[11px] text-brun-3">{fmtDateTime(h.at)}</span></li>)}
          </ol>
        </div>
      </Modal>
      <ProspectForm open={edit} prospect={p} onClose={() => setEdit(false)} />
      <TaskForm open={task} prospectId={p.id} onClose={(id) => { setTask(false); if (id && tour.active) setTour({ taskId: id }); }} />
    </>
  );
}

/* ───────── Liste ───────── */
export default function Prospects() {
  const { data } = useStore();
  const { setOpenProspect, highlight } = useUi();
  const [q, setQ] = useState('');
  const [stage, setStageF] = useState('');
  const [type, setType] = useState('');
  const [period, setPeriod] = useState('all');
  const [creating, setCreating] = useState(false);
  const today = todayISO();
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.prospects.filter((p) => {
      if (t && !`${fullName(p)} ${p.email} ${p.place}`.toLowerCase().includes(t)) return false;
      if (stage && p.stage !== stage) return false;
      if (type && p.eventType !== type) return false;
      if (period === 'upcoming' && !(p.eventDate && p.eventDate >= today)) return false;
      if (period === 'past' && !(p.eventDate && p.eventDate < today)) return false;
      if (period === 'month' && !(p.eventDate && p.eventDate.slice(0, 7) === today.slice(0, 7))) return false;
      if (period === 'nodate' && p.eventDate) return false;
      return true;
    });
  }, [data.prospects, q, stage, type, period, today]);
  const filtered = q || stage || type || period !== 'all';

  return (
    <>
      <ProHeader title="Prospects et clients" sub={`${data.prospects.length} fiches fictives · ${list.length} affichée(s)`} actions={<Button icon="plus" onClick={() => setCreating(true)}>Nouveau prospect</Button>} />
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <div className="relative"><Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brun-3" /><Input aria-label="Rechercher par nom" placeholder="Rechercher par nom, e-mail, lieu" className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select aria-label="Filtrer par statut" value={stage} onChange={(e) => setStageF(e.target.value)}><option value="">Tous les statuts</option>{STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</Select>
        <Select aria-label="Filtrer par type d'événement" value={type} onChange={(e) => setType(e.target.value)}><option value="">Tous les événements</option>{EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
        <Select aria-label="Filtrer par date" value={period} onChange={(e) => setPeriod(e.target.value)}><option value="all">Toutes les dates</option><option value="upcoming">À venir</option><option value="month">Ce mois-ci</option><option value="past">Passées</option><option value="nodate">Sans date</option></Select>
        {filtered && <Button variant="ghost" onClick={() => { setQ(''); setStageF(''); setType(''); setPeriod('all'); }}>Effacer</Button>}
      </div>

      {list.length === 0 ? (
        <EmptyState icon="users" title={filtered ? 'Aucune fiche ne correspond' : 'Aucun prospect pour le moment'} action={filtered ? undefined : <Button icon="plus" onClick={() => setCreating(true)}>Créer une fiche</Button>}>
          {filtered ? 'Modifiez ou effacez les filtres pour élargir la recherche.' : 'Les demandes du formulaire du site apparaîtront ici.'}
        </EmptyState>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-cream text-xs uppercase tracking-[.08em] text-brun-3">
                <tr><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium">Événement</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Statut</th><th className="px-4 py-3 font-medium">Prochaine action</th><th className="px-4 py-3 font-medium">Dernier contact</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((p) => (
                  <tr key={p.id} className={cx('cursor-pointer transition hover:bg-cream', highlight === p.id && 'bg-brand-soft')} onClick={() => setOpenProspect(p.id)}>
                    <td className="px-4 py-3"><button type="button" className="text-left font-medium text-brun hover:text-brand" onClick={(e) => { e.stopPropagation(); setOpenProspect(p.id); }}>{fullName(p)}</button><span className="block text-xs text-brun-3">{p.email}</span></td>
                    <td className="px-4 py-3 text-brun-2">{p.eventType}{p.guests ? ` · ${p.guests} inv.` : ''}</td>
                    <td className="px-4 py-3 tabular text-brun-2">{p.eventDate ? fmtShort(p.eventDate) : '—'}</td>
                    <td className="px-4 py-3"><StageBadge stage={p.stage} /></td>
                    <td className="px-4 py-3 text-brun-2"><span className="line-clamp-1">{p.nextAction || '—'}</span>{p.nextActionDate && <span className={cx('text-xs', p.nextActionDate < today ? 'font-medium text-danger' : 'text-brun-3')}>{p.nextActionDate < today ? 'En retard · ' : ''}{fmtShort(p.nextActionDate)}</span>}</td>
                    <td className="px-4 py-3 tabular text-brun-3">{p.lastContact ? fmtShort(p.lastContact) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {list.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setOpenProspect(p.id)} className={cx('w-full rounded-2xl border border-line bg-white p-4 text-left', highlight === p.id && 'ring-2 ring-brand/30')}>
                  <span className="flex items-start justify-between gap-3"><span className="font-medium text-brun">{fullName(p)}</span><StageBadge stage={p.stage} /></span>
                  <span className="mt-1 block text-sm text-brun-2">{p.eventType} · {p.eventDate ? fmtShort(p.eventDate) : 'date à définir'}{p.guests ? ` · ${p.guests} inv.` : ''}</span>
                  {p.nextAction && <span className="mt-2 block text-xs text-brun-3">→ {p.nextAction}</span>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <ProspectForm open={creating} onClose={(id) => { setCreating(false); if (id) setOpenProspect(id); }} />
    </>
  );
}
