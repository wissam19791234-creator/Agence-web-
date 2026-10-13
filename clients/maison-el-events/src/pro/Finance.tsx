import { useMemo, useState } from 'react';
import { PairBars } from '../components/Charts';
import { Button, Field, IconButton, Input, Modal, Select, useConfirm, useToast } from '../components/ui';
import { log } from '../lib/actions';
import { quoteTotals } from '../lib/calc';
import { eur, fmtShort, todayISO, uid } from '../lib/format';
import { useStore } from '../lib/store';
import type { Expense } from '../lib/types';
import { Panel, ProHeader } from './ProApp';

const CATS: Expense['category'][] = ['Fleurs et décor', 'Matières premières', 'Location', 'Transport', 'Autre'];

export default function Finance() {
  const { data, update } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ label: '', amount: '', category: CATS[0], eventId: '', date: todayISO() });
  const [err, setErr] = useState<Record<string, string>>({});

  const rows = useMemo(() => data.events.map((e) => {
    const q = data.quotes.filter((x) => x.prospectId === e.prospectId && x.status === 'accepte').sort((a, b) => b.updatedAt - a.updatedAt)[0];
    const revenue = q ? quoteTotals(q).known : 0;
    const costs = data.expenses.filter((x) => x.eventId === e.id).reduce((a, x) => a + x.amount, 0);
    return { e, revenue, costs, margin: revenue - costs };
  }).filter((r) => r.revenue || r.costs).sort((a, b) => a.e.date.localeCompare(b.e.date)), [data]);
  const tot = rows.reduce((a, r) => ({ revenue: a.revenue + r.revenue, costs: a.costs + r.costs }), { revenue: 0, costs: 0 });
  const unassigned = data.expenses.filter((x) => !x.eventId || !data.events.some((e) => e.id === x.eventId)).reduce((a, x) => a + x.amount, 0);
  const margin = tot.revenue - tot.costs - unassigned;

  const save = () => {
    const e: Record<string, string> = {};
    if (f.label.trim().length < 2) e.label = 'Décrivez la dépense.';
    const amt = Number(f.amount.replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) e.amount = 'Montant positif attendu (exemple : 45,90).';
    setErr(e);
    if (Object.keys(e).length) return;
    update((d) => { d.expenses.push({ id: uid('x'), label: f.label.trim(), amount: Math.round(amt * 100) / 100, category: f.category, eventId: f.eventId || null, date: f.date }); log(d, `Dépense fictive ajoutée : ${f.label.trim()} (${eur(amt)}).`, 'reglages'); });
    toast('Dépense ajoutée (exemple).'); setOpen(false); setF({ label: '', amount: '', category: CATS[0], eventId: '', date: todayISO() });
  };

  return (
    <>
      <ProHeader title="Rentabilité (démonstration)" sub="Données d’exemple : ce ne sont pas les comptes réels de l’entreprise." actions={<Button icon="plus" onClick={() => setOpen(true)}>Ajouter une dépense fictive</Button>} />
      <p className="mb-5 rounded-xl bg-[#FBF1DF] px-4 py-2.5 text-sm text-warn">Exemples à but de démonstration. Recettes = devis acceptés (simulation) ; dépenses saisies à la main.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {[['Recettes prévisionnelles simulées', tot.revenue], ['Dépenses fictives', tot.costs + unassigned], ['Marge indicative', margin]].map(([k, v]) => (
          <div key={k as string} className="rounded-2xl border border-line bg-white p-5"><p className="text-[13px] text-brun-2">{k}</p><p className="mt-2 font-serif text-[34px] leading-none text-brun tabular">{eur(v as number, true)}</p>{k === 'Marge indicative' && tot.revenue > 0 && <p className="mt-2 text-xs text-brun-3">{Math.round((margin / tot.revenue) * 100)} % des recettes</p>}</div>
        ))}
      </div>
      <Panel title="Recettes et dépenses par événement" className="mt-5">
        {rows.length ? <PairBars data={rows.map((r) => ({ label: r.e.title.split(' — ')[1] || r.e.title, a: r.revenue, b: r.costs }))} a="Recettes simulées" b="Dépenses fictives" format={(v) => eur(v, true)} /> : <p className="text-sm text-brun-3">Aucune donnée : acceptez un devis (simulation) ou ajoutez une dépense liée à un événement.</p>}
      </Panel>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Répartition par événement">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-[.08em] text-brun-3"><tr><th className="pb-2 font-medium">Événement</th><th className="pb-2 text-right font-medium">Recettes</th><th className="pb-2 text-right font-medium">Dépenses</th><th className="pb-2 text-right font-medium">Marge</th></tr></thead>
              <tbody className="divide-y divide-line">{rows.map((r) => <tr key={r.e.id}><td className="py-2.5">{r.e.title}<span className="block text-xs text-brun-3">{fmtShort(r.e.date)}</span></td><td className="py-2.5 text-right tabular">{eur(r.revenue, true)}</td><td className="py-2.5 text-right tabular">{eur(r.costs, true)}</td><td className="py-2.5 text-right font-medium tabular">{eur(r.margin, true)}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Dépenses fictives">
          <ul className="divide-y divide-line">
            {data.expenses.slice().sort((a, b) => b.date.localeCompare(a.date)).map((x) => (
              <li key={x.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                <span className="min-w-0 flex-1"><span className="block text-brun">{x.label}</span><span className="text-xs text-brun-3">{x.category} · {fmtShort(x.date)} · {data.events.find((e) => e.id === x.eventId)?.title ?? 'non affectée'}</span></span>
                <span className="tabular font-medium">{eur(x.amount)}</span>
                <IconButton icon="trash" label={`Supprimer ${x.label}`} onClick={async () => { if (await confirm({ title: 'Supprimer cette dépense ?', message: x.label, confirm: 'Supprimer', danger: true })) update((d) => { d.expenses = d.expenses.filter((y) => y.id !== x.id); }); }} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle dépense fictive" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={save}>Ajouter</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Libellé" required error={err.label} className="sm:col-span-2">{(id, by) => <Input id={id} value={f.label} aria-invalid={!!err.label} aria-describedby={by} onChange={(e) => setF({ ...f, label: e.target.value })} />}</Field>
          <Field label="Montant (€)" required error={err.amount}>{(id, by) => <Input id={id} inputMode="decimal" value={f.amount} aria-invalid={!!err.amount} aria-describedby={by} onChange={(e) => setF({ ...f, amount: e.target.value })} />}</Field>
          <Field label="Date">{(id) => <Input id={id} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />}</Field>
          <Field label="Catégorie">{(id) => <Select id={id} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Expense['category'] })}>{CATS.map((c) => <option key={c}>{c}</option>)}</Select>}</Field>
          <Field label="Événement">{(id) => <Select id={id} value={f.eventId} onChange={(e) => setF({ ...f, eventId: e.target.value })}><option value="">Non affectée</option>{data.events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</Select>}</Field>
        </div>
      </Modal>
    </>
  );
}
