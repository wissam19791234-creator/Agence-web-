import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Button, cx, EmptyState, Field, IconButton, Input, Modal, Select, Textarea, useConfirm, useToast } from '../components/ui';
import { addHistory, findProspect, log } from '../lib/actions';
import { EVENT_STATUS } from '../lib/constants';
import { addDays, fmtDate, fullName, parseISO, toISO, todayISO, uid } from '../lib/format';
import { useStore } from '../lib/store';
import type { CalEvent, EventStatus } from '../lib/types';
import { useUi } from '../lib/ui';
import { ProHeader } from './ProApp';

const STATUS_CLS: Record<EventStatus, string> = {
  option: 'bg-[#14110C] text-[#E8C27A] border border-dashed border-champagne-deep/60',
  confirme: 'bg-white text-black',
  termine: 'bg-[#1A1A1A] text-brun-3',
};
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const mondayOf = (iso: string) => { const d = parseISO(iso); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return toISO(d); };

function EventForm({ ev, onClose }: { ev: CalEvent | 'new' | null; onClose: () => void }) {
  const { data, update } = useStore();
  const { setOpenProspect } = useUi();
  const confirm = useConfirm();
  const toast = useToast();
  const blank: CalEvent = { id: '', prospectId: null, title: '', date: todayISO(), time: '', status: 'option', place: '', guests: null, notes: '' };
  const [f, setF] = useState<CalEvent>(blank);
  const [err, setErr] = useState('');
  useEffect(() => { if (ev) { setF(ev === 'new' ? blank : { ...ev }); setErr(''); } }, [ev]); // eslint-disable-line react-hooks/exhaustive-deps
  const isNew = ev === 'new';
  const save = () => {
    if (!f.title.trim()) { setErr('Donnez un titre à l’événement.'); return; }
    if (!f.date) { setErr('Choisissez une date.'); return; }
    update((d) => {
      const p = findProspect(d, f.prospectId);
      if (isNew) { d.events.push({ ...f, id: uid('e'), title: f.title.trim() }); log(d, `Événement ajouté : ${f.title.trim()} (${fmtDate(f.date)}).`, 'agenda'); if (p) addHistory(p, `Inscrit au calendrier le ${fmtDate(f.date)}.`); }
      else {
        const i = d.events.findIndex((x) => x.id === f.id);
        const before = d.events[i];
        d.events[i] = { ...f, title: f.title.trim() };
        if (before.date !== f.date) { log(d, `${f.title} déplacé au ${fmtDate(f.date)}.`, 'agenda'); if (p) { addHistory(p, `Date d’événement modifiée : ${fmtDate(f.date)}.`); p.eventDate = f.date; } }
      }
    });
    toast(isNew ? 'Événement ajouté au calendrier.' : 'Événement enregistré.');
    onClose();
  };
  const remove = async () => {
    if (await confirm({ title: 'Retirer cet événement du calendrier ?', message: f.title, confirm: 'Retirer', danger: true })) {
      update((d) => { d.events = d.events.filter((x) => x.id !== f.id); log(d, `Événement retiré du calendrier : ${f.title}.`, 'agenda'); });
      toast('Événement retiré.'); onClose();
    }
  };
  return (
    <Modal open={!!ev} onClose={onClose} title={isNew ? 'Nouvel événement (fictif)' : f.title}
      footer={<>{!isNew && <Button variant="danger" icon="trash" onClick={remove} className="mr-auto">Retirer</Button>}<Button variant="secondary" onClick={onClose}>Annuler</Button><Button icon="check" onClick={save}>Enregistrer</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Titre" required error={err} className="sm:col-span-2">{(id, by) => <Input id={id} value={f.title} aria-invalid={!!err} aria-describedby={by} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
        <Field label="Fiche client associée">{(id) => <Select id={id} value={f.prospectId ?? ''} onChange={(e) => { const p = data.prospects.find((x) => x.id === e.target.value); setF({ ...f, prospectId: e.target.value || null, title: f.title || (p ? `${p.eventType} — ${fullName(p)}` : ''), place: f.place || p?.place || '', guests: f.guests ?? p?.guests ?? null }); }}><option value="">Aucune</option>{data.prospects.map((p) => <option key={p.id} value={p.id}>{fullName(p)}</option>)}</Select>}</Field>
        <Field label="Statut">{(id) => <Select id={id} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as EventStatus })}>{Object.entries(EVENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
        <Field label="Date" required>{(id) => <Input id={id} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />}</Field>
        <Field label="Heure">{(id) => <Input id={id} type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />}</Field>
        <Field label="Lieu">{(id) => <Input id={id} value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })} />}</Field>
        <Field label="Invités">{(id) => <Input id={id} inputMode="numeric" value={f.guests ?? ''} onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, ''); setF({ ...f, guests: v ? Number(v) : null }); }} />}</Field>
        <Field label="Notes" className="sm:col-span-2">{(id) => <Textarea id={id} rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />}</Field>
      </div>
      {!isNew && f.prospectId && <button type="button" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline" onClick={() => { onClose(); setOpenProspect(f.prospectId); }}><Icon name="users" className="h-4 w-4" />Ouvrir la fiche client</button>}
    </Modal>
  );
}

export default function Calendar() {
  const { data } = useStore();
  const { calendarFocus, setCalendarFocus, highlight, flash } = useUi();
  const [view, setView] = useState<'mois' | 'semaine' | 'liste'>('mois');
  const [cursor, setCursor] = useState(() => todayISO().slice(0, 8) + '01');
  const [week, setWeek] = useState(() => mondayOf(todayISO()));
  const [filter, setFilter] = useState<EventStatus | ''>('');
  const [open, setOpen] = useState<CalEvent | 'new' | null>(null);
  const today = todayISO();

  useEffect(() => {
    if (!calendarFocus) return;
    setCursor(calendarFocus.slice(0, 8) + '01'); setWeek(mondayOf(calendarFocus)); setView('mois');
    const e = data.events.find((x) => x.date === calendarFocus); if (e) flash(e.id);
    setCalendarFocus(null);
  }, [calendarFocus]); // eslint-disable-line react-hooks/exhaustive-deps

  const events = useMemo(() => data.events.filter((e) => !filter || e.status === filter).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), [data.events, filter]);
  const byDay = useMemo(() => { const m: Record<string, CalEvent[]> = {}; events.forEach((e) => { (m[e.date] ||= []).push(e); }); return m; }, [events]);

  const first = parseISO(cursor);
  const gridStart = mondayOf(cursor);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const lastRowNeeded = cells.slice(35).some((d) => parseISO(d).getMonth() === first.getMonth());
  const shown = lastRowNeeded ? cells : cells.slice(0, 35);
  const monthLabel = first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const shift = (n: number) => { if (view === 'semaine') setWeek(addDays(week, 7 * n)); else { const d = parseISO(cursor); d.setMonth(d.getMonth() + n); setCursor(toISO(d)); } };
  const chip = (e: CalEvent, compact = false) => (
    <button key={e.id} type="button" onClick={() => setOpen(e)} title={`${e.title} · ${EVENT_STATUS[e.status]}`}
      className={cx('block w-full truncate rounded-md px-1.5 py-1 text-left text-[11.5px] font-medium leading-tight transition hover:opacity-90', STATUS_CLS[e.status], highlight === e.id && 'animate-glow ring-2 ring-brand/40')}>
      {!compact && e.time && <span className="mr-1 tabular">{e.time}</span>}{e.title}
    </button>
  );

  return (
    <>
      <ProHeader title="Calendrier événementiel" sub="Événements issus des fiches du CRM. Les réservations confirmées sont des simulations." actions={<Button icon="plus" onClick={() => setOpen('new')}>Ajouter un événement</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-panel p-1 ring-1 ring-line" role="group" aria-label="Vue">
          {(['mois', 'semaine', 'liste'] as const).map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cx('rounded-full px-3.5 py-1.5 text-[13px] capitalize transition', view === v ? 'bg-white text-black' : 'text-brun-2')}>{v}</button>)}
        </div>
        {view !== 'liste' && (
          <div className="flex items-center gap-1">
            <IconButton icon="left" label="Période précédente" onClick={() => shift(-1)} />
            <p className="min-w-[180px] text-center text-xl capitalize text-brun">{view === 'mois' ? monthLabel : `Semaine du ${fmtDate(week, { day: 'numeric', month: 'long' })}`}</p>
            <IconButton icon="right" label="Période suivante" onClick={() => shift(1)} />
            <Button size="sm" variant="ghost" onClick={() => { setCursor(today.slice(0, 8) + '01'); setWeek(mondayOf(today)); }}>Aujourd’hui</Button>
          </div>
        )}
        <Select aria-label="Filtrer par statut" className="ml-auto h-10 !w-auto" value={filter} onChange={(e) => setFilter(e.target.value as EventStatus | '')}><option value="">Tous les statuts</option>{Object.entries(EVENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
      </div>
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-brun-2">
        {(Object.keys(EVENT_STATUS) as EventStatus[]).map((s) => <span key={s} className="inline-flex items-center gap-2"><span className={cx('h-3 w-5 rounded', STATUS_CLS[s])} />{EVENT_STATUS[s]}</span>)}
      </div>

      {view === 'mois' && (
        <div className="overflow-x-auto rounded-none border border-line bg-panel">
          <div className="grid min-w-[700px] grid-cols-7">
            {DAYS.map((d) => <div key={d} className="border-b border-line px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[.1em] text-brun-3">{d}</div>)}
            {shown.map((d) => {
              const inMonth = parseISO(d).getMonth() === first.getMonth();
              const list = byDay[d] || [];
              return (
                <div key={d} className={cx('min-h-[104px] border-b border-r border-line p-1.5 [&:nth-child(7n)]:border-r-0', !inMonth && 'bg-cream/70')}>
                  <p className={cx('mb-1 text-right text-xs tabular', d === today ? 'font-semibold text-brand' : inMonth ? 'text-brun-2' : 'text-brun-3/60')}>{d === today ? <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-white text-black">{parseISO(d).getDate()}</span> : parseISO(d).getDate()}</p>
                  <div className="space-y-1">{list.slice(0, 3).map((e) => chip(e, true))}{list.length > 3 && <p className="px-1 text-[11px] text-brun-3">+ {list.length - 3} autre(s)</p>}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'semaine' && (
        <div className="grid gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => addDays(week, i)).map((d, i) => (
            <div key={d} className={cx('min-h-[160px] rounded-none border bg-panel p-3', d === today ? 'border-brand/40' : 'border-line')}>
              <p className="text-xs text-brun-3">{DAYS[i]}</p>
              <p className={cx('text-2xl leading-none', d === today ? 'text-brand' : 'text-brun')}>{parseISO(d).getDate()}</p>
              <div className="mt-3 space-y-1.5">{(byDay[d] || []).map((e) => chip(e))}{!(byDay[d] || []).length && <p className="text-xs text-brun-3/70">—</p>}</div>
            </div>
          ))}
        </div>
      )}

      {view === 'liste' && (
        events.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-none border border-line bg-panel">
            {events.map((e) => {
              const p = data.prospects.find((x) => x.id === e.prospectId);
              return (
                <li key={e.id}>
                  <button type="button" onClick={() => setOpen(e)} className={cx('flex w-full flex-wrap items-center gap-4 px-4 py-3.5 text-left hover:bg-white/5 sm:flex-nowrap', highlight === e.id && 'bg-brand-soft')}>
                    <span className="w-16 shrink-0 text-center"><span className="block text-2xl leading-none text-brun">{parseISO(e.date).getDate()}</span><span className="text-[11px] uppercase text-brun-3">{parseISO(e.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}</span></span>
                    <span className="min-w-0 flex-1"><span className="block font-medium text-brun">{e.title}</span><span className="text-xs text-brun-3">{[e.place, e.guests ? `${e.guests} invités` : '', p ? 'fiche liée' : 'sans fiche'].filter(Boolean).join(' · ')}</span></span>
                    <Badge tone={e.status === 'confirme' ? 'brand' : e.status === 'option' ? 'warn' : 'neutral'}>{EVENT_STATUS[e.status]}</Badge>
                    {e.date < today && e.status !== 'termine' && <Badge tone="danger">Date passée</Badge>}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState icon="calendar" title="Aucun événement" action={<Button icon="plus" onClick={() => setOpen('new')}>Ajouter un événement</Button>}>Inscrivez un événement depuis une fiche client ou ajoutez-le ici.</EmptyState>
      )}
      <EventForm ev={open} onClose={() => setOpen(null)} />
    </>
  );
}
