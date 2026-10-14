import { useMemo } from 'react';
import { BarList, ColumnChart } from '../components/Charts';
import { Icon, type IconName } from '../components/Icon';
import { Badge, cx, LinkButton } from '../components/ui';
import { quoteTotals } from '../lib/calc';
import { SERVICE_LABELS, STAGES } from '../lib/constants';
import { ago, eur, fmtShort, fullName, todayISO } from '../lib/format';
import { useStore } from '../lib/store';
import { useUi } from '../lib/ui';
import { Panel, ProHeader } from './ProApp';

function Kpi({ label, value, sub, icon, href, id }: { label: string; value: string; sub?: string; icon: IconName; href: string; id: string }) {
  const { highlight } = useUi();
  return (
    <a href={href} data-kpi={id} className={cx('group block min-w-0 rounded-card border border-line bg-panel p-4 sm:p-5 no-underline transition hover:-translate-y-0.5 hover:', highlight === 'kpis' && 'animate-glow')}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] leading-snug text-brun-2 sm:text-[13px]">{label}</p>
        <Icon name={icon} className="h-4 w-4 shrink-0 text-smoke" />
      </div>
      <p className="mt-3 font-serif text-[34px] leading-none text-brun tabular sm:text-[44px]">{value}</p>
      {sub && <p className="mt-2 text-xs text-brun-3">{sub}</p>}
    </a>
  );
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export default function Dashboard() {
  const { data } = useStore();
  const today = todayISO();
  const m = useMemo(() => {
    const ps = data.prospects;
    const sent = data.quotes.filter((q) => q.status === 'envoye');
    const accepted = data.quotes.filter((q) => q.status === 'accepte' && (!q.eventDate || q.eventDate >= today));
    const upcoming = data.events.filter((e) => e.date >= today && e.status !== 'termine');
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
    const evo = months.map(({ y, m: mo }) => ({ label: MONTHS[mo], value: ps.filter((p) => { const d = new Date(p.createdAt); return d.getFullYear() === y && d.getMonth() === mo; }).length }));
    const byType = Object.entries(ps.reduce<Record<string, number>>((a, p) => { a[p.eventType] = (a[p.eventType] || 0) + 1; return a; }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    const bySvc = Object.entries(SERVICE_LABELS).map(([k, label]) => ({ label, value: ps.filter((p) => p.services.includes(k as never)).length })).filter((x) => x.value).sort((a, b) => b.value - a.value);
    const tasks = data.tasks.filter((t) => !t.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
    return {
      total: ps.length, nouveaux: ps.filter((p) => p.stage === 'nouveau').length, sent: sent.length,
      sentSum: sent.reduce((a, q) => a + quoteTotals(q).known, 0), ca: accepted.reduce((a, q) => a + quoteTotals(q).known, 0),
      upcoming: upcoming.length, evo, byType, bySvc, tasks,
      stages: STAGES.map((s) => ({ ...s, n: ps.filter((p) => p.stage === s.key).length })),
    };
  }, [data, today]);
  const pname = (id: string | null) => fullName(data.prospects.find((p) => p.id === id) ?? { firstName: '', lastName: '' });

  return (
    <>
      <ProHeader title="Tableau de bord" sub="Indicateurs calculés en direct à partir des données de démonstration (fictives)." actions={<LinkButton href="#pro-prospects" size="sm" icon="plus">Nouveau prospect</LinkButton>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <Kpi id="total" label="Demandes de devis" value={String(m.total)} sub="Toutes les fiches" icon="mail" href="#pro-prospects" />
        <Kpi id="new" label="Nouveaux prospects" value={String(m.nouveaux)} sub="À traiter" icon="users" href="#pro-pipeline" />
        <Kpi id="sent" label="Devis en attente" value={String(m.sent)} sub={`${eur(m.sentSum, true)} envoyés (simulation)`} icon="file" href="#pro-devis" />
        <Kpi id="events" label="Événements à venir" value={String(m.upcoming)} sub="Options et réservations" icon="calendar" href="#pro-calendrier" />
        <Kpi id="ca" label="CA prévisionnel simulé" value={eur(m.ca, true)} sub="Devis acceptés (simulation)" icon="euro" href="#pro-rentabilite" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Évolution des demandes (6 derniers mois)"><ColumnChart data={m.evo} unit=" demande(s)" /></Panel>
        <Panel title="Demandes par type d’événement"><BarList data={m.byType} /></Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel title="Prestations demandées"><BarList data={m.bySvc} /></Panel>
        <Panel title="Pipeline" actions={<a href="#pro-pipeline" className="text-xs text-brand hover:underline">Ouvrir</a>}>
          <ul className="space-y-2.5">
            {m.stages.map((s) => (
              <li key={s.key} className="flex items-center gap-3 text-[13px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.dot }} />
                <span className="min-w-0 flex-1 truncate text-brun-2">{s.label}</span>
                <span className="tabular font-medium text-brun">{s.n}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Prochaines tâches" actions={<a href="#pro-taches" className="text-xs text-brand hover:underline">Tout voir</a>}>
          {m.tasks.length ? (
            <ul className="space-y-3">
              {m.tasks.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 text-[13px]">
                  <span className="min-w-0"><span className="block text-brun">{t.title}</span>{t.prospectId && <span className="text-xs text-brun-3">{pname(t.prospectId)}</span>}</span>
                  {t.due < today ? <Badge tone="danger">En retard</Badge> : t.due === today ? <Badge tone="warn">Aujourd’hui</Badge> : <Badge>{fmtShort(t.due)}</Badge>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-brun-3">Aucune tâche en cours.</p>}
        </Panel>
      </div>

      <Panel title="Dernières activités" className="mt-5">
        <ul className="divide-y divide-line">
          {data.activity.slice(0, 8).map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-4 py-2.5 text-[13.5px]">
              <span className="text-brun-2">{a.text}</span>
              <span className="shrink-0 text-xs text-brun-3">{ago(a.at)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
