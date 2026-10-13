import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Button, cx, EmptyState, Field, Input, Modal, Select, useConfirm, useToast } from '../components/ui';
import { addTask, findProspect, log } from '../lib/actions';
import { PRIORITY } from '../lib/constants';
import { addDays, fmtShort, fullName, todayISO, uid } from '../lib/format';
import { useStore } from '../lib/store';
import type { Priority, Task } from '../lib/types';
import { useUi } from '../lib/ui';
import { ProHeader } from './ProApp';

export function TaskForm({ open, onClose, prospectId = null, preset }: { open: boolean; onClose: (id?: string) => void; prospectId?: string | null; preset?: Partial<Task> }) {
  const { data, update } = useStore();
  const toast = useToast();
  const p = data.prospects.find((x) => x.id === prospectId);
  const init = () => ({ title: preset?.title ?? (p ? `Relancer ${fullName(p)}` : ''), prospectId: preset?.prospectId ?? prospectId ?? '', due: preset?.due ?? addDays(todayISO(), 3), priority: (preset?.priority ?? 'normale') as Priority, kind: (preset?.kind ?? 'relance') as Task['kind'] });
  const [f, setF] = useState(init);
  const [err, setErr] = useState('');
  useEffect(() => { if (open) { setF(init()); setErr(''); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = () => {
    if (f.title.trim().length < 3) { setErr('Décrivez la tâche en quelques mots.'); return; }
    if (!f.due) { setErr('Choisissez une échéance.'); return; }
    let id = '';
    update((d) => { id = addTask(d, { title: f.title.trim(), prospectId: f.prospectId || null, due: f.due, priority: f.priority, kind: f.kind }); });
    toast(f.kind === 'relance' ? 'Relance planifiée (simulation : aucune notification envoyée).' : 'Tâche ajoutée.');
    onClose(id);
  };
  return (
    <Modal open={open} onClose={() => onClose()} title="Nouvelle tâche" footer={<><Button variant="secondary" onClick={() => onClose()}>Annuler</Button><Button onClick={save} icon="check">Ajouter</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tâche" required error={err} className="sm:col-span-2">{(id, by) => <Input id={id} value={f.title} aria-invalid={!!err} aria-describedby={by} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
        <Field label="Client associé">{(id) => <Select id={id} value={f.prospectId} onChange={(e) => setF({ ...f, prospectId: e.target.value })}><option value="">Aucun</option>{data.prospects.map((x) => <option key={x.id} value={x.id}>{fullName(x)}</option>)}</Select>}</Field>
        <Field label="Échéance" required>{(id) => <Input id={id} type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />}</Field>
        <Field label="Priorité">{(id) => <Select id={id} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Priority })}>{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
        <Field label="Type">{(id) => <Select id={id} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Task['kind'] })}><option value="relance">Relance commerciale</option><option value="appel">Appel</option><option value="tache">Tâche</option></Select>}</Field>
      </div>
      <p className="mt-4 text-xs text-brun-3">Les relances sont simulées : aucune notification, aucun e-mail ni SMS n’est envoyé sans configuration.</p>
    </Modal>
  );
}

const FILTERS = [
  { k: 'open', label: 'À faire' }, { k: 'late', label: 'En retard' }, { k: 'today', label: 'Aujourd’hui' }, { k: 'soon', label: 'À venir' }, { k: 'done', label: 'Terminées' }, { k: 'all', label: 'Toutes' },
] as const;

export default function Tasks() {
  const { data, update } = useStore();
  const { setOpenProspect, highlight } = useUi();
  const confirm = useConfirm();
  const toast = useToast();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['k']>('open');
  const [open, setOpen] = useState(false);
  const today = todayISO();
  const counts = useMemo(() => ({
    open: data.tasks.filter((t) => !t.done).length, late: data.tasks.filter((t) => !t.done && t.due < today).length,
    today: data.tasks.filter((t) => !t.done && t.due === today).length, soon: data.tasks.filter((t) => !t.done && t.due > today).length,
    done: data.tasks.filter((t) => t.done).length, all: data.tasks.length,
  }), [data.tasks, today]);
  const list = data.tasks.filter((t) => filter === 'all' ? true : filter === 'done' ? t.done : t.done ? false : filter === 'late' ? t.due < today : filter === 'today' ? t.due === today : filter === 'soon' ? t.due > today : true)
    .sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));

  const toggle = (t: Task) => update((d) => {
    const x = d.tasks.find((y) => y.id === t.id)!; x.done = !x.done;
    const p = findProspect(d, x.prospectId); if (p && x.done) p.history.unshift({ id: uid('h'), at: Date.now(), text: `Tâche terminée : ${x.title}.` });
    log(d, `${x.done ? 'Tâche terminée' : 'Tâche rouverte'} : ${x.title}.`, 'tache');
  });

  return (
    <>
      <ProHeader title="Tâches et relances" sub="Les relances sont simulées : aucune notification réelle n’est envoyée." actions={<Button icon="plus" onClick={() => setOpen(true)}>Nouvelle tâche</Button>} />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer les tâches">
        {FILTERS.map((f) => (
          <button key={f.k} type="button" aria-pressed={filter === f.k} onClick={() => setFilter(f.k)} className={cx('inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] transition', filter === f.k ? 'bg-white text-black' : 'bg-panel text-brun-2 ring-1 ring-inset ring-line')}>
            {f.label}<span className={cx('tabular rounded-full px-1.5 text-[11px]', filter === f.k ? 'bg-cream/20' : 'bg-ivoire', f.k === 'late' && counts.late > 0 && filter !== f.k && 'bg-[#2A1215] text-danger')}>{counts[f.k]}</span>
          </button>
        ))}
      </div>
      {list.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-none border border-line bg-panel">
          {list.map((t) => {
            const p = data.prospects.find((x) => x.id === t.prospectId);
            return (
              <li key={t.id} className={cx('flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap', highlight === t.id && 'bg-brand-soft')}>
                <button type="button" role="checkbox" aria-checked={t.done} aria-label={t.done ? `Rouvrir : ${t.title}` : `Marquer comme terminée : ${t.title}`} onClick={() => toggle(t)}
                  className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-inset transition', t.done ? 'bg-ok text-white ring-ok' : 'bg-panel text-transparent ring-line hover:ring-brand')}><Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} /></button>
                <div className="min-w-0 flex-1">
                  <p className={cx('text-sm', t.done ? 'text-brun-3 line-through' : 'text-brun')}>{t.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-brun-3">
                    <span>{t.kind === 'relance' ? 'Relance (simulation)' : t.kind === 'appel' ? 'Appel' : 'Tâche'}</span>
                    {p && <button type="button" className="text-brand hover:underline" onClick={() => setOpenProspect(p.id)}>{fullName(p)}</button>}
                  </p>
                </div>
                <Badge tone={t.priority === 'haute' ? 'danger' : t.priority === 'basse' ? 'neutral' : 'brand'}>{PRIORITY[t.priority]}</Badge>
                {!t.done && t.due < today ? <Badge tone="danger">En retard · {fmtShort(t.due)}</Badge> : t.due === today && !t.done ? <Badge tone="warn">Aujourd’hui</Badge> : <Badge>{fmtShort(t.due)}</Badge>}
                <button type="button" aria-label={`Supprimer : ${t.title}`} className="grid h-8 w-8 place-items-center rounded-full text-brun-3 hover:bg-[#2A1215] hover:text-danger" onClick={async () => { if (await confirm({ title: 'Supprimer cette tâche ?', message: t.title, confirm: 'Supprimer', danger: true })) { update((d) => { d.tasks = d.tasks.filter((x) => x.id !== t.id); }); toast('Tâche supprimée.'); } }}><Icon name="trash" className="h-4 w-4" /></button>
              </li>
            );
          })}
        </ul>
      ) : <EmptyState icon="check" title="Rien ici" action={<Button icon="plus" onClick={() => setOpen(true)}>Ajouter une tâche</Button>}>Aucune tâche dans ce filtre.</EmptyState>}
      <TaskForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
