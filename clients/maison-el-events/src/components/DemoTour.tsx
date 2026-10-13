import { useEffect, useRef, type ReactNode } from 'react';
import { addEventFor, addHistory, addTask, createProspect, createQuote, findProspect, log, setStage } from '../lib/actions';
import { quoteTotals } from '../lib/calc';
import { STAGES } from '../lib/constants';
import { addDays, eur, fullName, todayISO, uid } from '../lib/format';
import { navigate, type Route } from '../lib/router';
import { useStore } from '../lib/store';
import type { Prospect } from '../lib/types';
import { useUi } from '../lib/ui';
import { Icon } from './Icon';
import { Button, cx, useToast } from './ui';

const EXAMPLE = () => ({
  firstName: 'Clara', lastName: 'Exemple', email: 'clara.exemple@exemple.test', phone: '', eventType: 'Mariage' as const,
  eventDate: addDays(todayISO(), 75), place: 'Orléans', guests: 90, services: ['deco-tables', 'mariage', 'mignardises', 'mocktails'] as Prospect['services'],
  budget: 'Environ 1 500 €', needs: 'Ambiance bordeaux et ivoire, coin mariés pour la soirée henné.',
});

interface Step { title: string; route: Route; what: ReactNode; why: string }
const STEPS: Step[] = [
  { title: 'Une demande de devis arrive', route: 'devis', what: 'Un client remplit le formulaire en 5 étapes. Remplissez-le vous-même ou utilisez l’exemple fictif, puis cliquez sur « Envoyer ma demande ».', why: 'Toutes les informations utiles arrivent en une fois : plus besoin de relancer pour connaître la date, le lieu ou le nombre d’invités.' },
  { title: 'La fiche prospect est créée', route: 'pro-prospects', what: 'La demande apparaît aussitôt dans la liste des prospects, avec ses coordonnées, ses prestations et son historique.', why: 'Aucune demande ne se perd dans les messages : tout est rangé au même endroit.' },
  { title: 'Le besoin est qualifié', route: 'pro-prospects', what: 'Après un échange avec le client, la demande passe en « Devis à préparer » et une note interne résume le besoin.', why: 'Chaque client a un statut clair et une prochaine action : on sait toujours quoi faire ensuite.' },
  { title: 'Le devis se calcule seul', route: 'pro-devis', what: 'Le devis reprend les tarifs connus : décoration de table par invité, coin mariés, mignardises et mocktails. Modifiez une quantité pour voir le total changer.', why: 'Un devis juste en quelques minutes, sans calculatrice ni erreur de recopie.' },
  { title: 'Le devis rejoint le pipeline', route: 'pro-pipeline', what: 'Le devis est marqué « envoyé — simulation » et la carte du client avance dans le pipeline. Vous pouvez aussi la faire glisser vous-même.', why: 'Le pipeline montre d’un coup d’œil les devis en attente et le montant en jeu.' },
  { title: 'Une relance est planifiée', route: 'pro-taches', what: 'Une tâche « relancer dans 3 jours » est créée et rattachée au client. Elle est simulée : aucune notification n’est envoyée.', why: 'Les relances au bon moment font signer plus de devis.' },
  { title: 'L’événement est au calendrier', route: 'pro-calendrier', what: 'La date souhaitée est inscrite au calendrier en option, reliée à la fiche du client. Cliquez dessus pour l’ouvrir.', why: 'Les dates bloquées et les options sont visibles avant d’accepter un nouvel événement.' },
  { title: 'Le tableau de bord est à jour', route: 'pro', what: 'Les indicateurs ont été recalculés à partir des données : demandes, devis en attente, événements à venir et graphiques.', why: 'Une vision claire de l’activité, sans tableur à tenir à jour.' },
];

export function DemoTour({ route }: { route: Route }) {
  const { data, update } = useStore();
  const ui = useUi();
  const { tour, setTour, stopTour, startTour } = ui;
  const toast = useToast();
  const lastStep = useRef<number | null>(null);

  useEffect(() => {
    if (!tour.active) { lastStep.current = null; return; }
    if (lastStep.current !== tour.step) {
      lastStep.current = tour.step;
      const s = STEPS[tour.step - 1];
      if (s && route !== s.route && !(tour.step === 4 && ui.editQuote)) navigate(s.route);
    }
  }, [tour.active, tour.step]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tour.active) return null;
  const step = STEPS[tour.step - 1];
  const p = data.prospects.find((x) => x.id === tour.prospectId);
  const q = data.quotes.find((x) => x.id === tour.quoteId);
  const order = STAGES.map((s) => s.key);
  const at = (k: Prospect['stage']) => !!p && order.indexOf(p.stage) >= order.indexOf(k);
  const done = [!!p, !!p, at('preparer'), !!q, at('envoye'), !!data.tasks.find((t) => t.id === tour.taskId), !!data.events.find((e) => e.id === tour.eventId), true][tour.step - 1];

  const ensureProspect = (): string => {
    if (p) return p.id;
    let id = '';
    update((d) => { id = createProspect(d, { ...EXAMPLE(), source: 'site', inspirationIds: [] }, 'Demande reçue depuis le formulaire du site.'); });
    setTour({ prospectId: id });
    return id;
  };

  const actions: Record<number, ReactNode> = {
    1: <>
      <Button size="sm" icon="edit" onClick={() => { ui.setPrefill(EXAMPLE()); if (route !== 'devis') navigate('devis'); }}>Remplir avec l’exemple fictif</Button>
      {!p && <Button size="sm" variant="secondary" onClick={() => { ensureProspect(); toast('Demande d’exemple envoyée (démonstration).'); }}>Envoyer l’exemple directement</Button>}
    </>,
    2: <Button size="sm" icon="users" onClick={() => { const id = ensureProspect(); navigate('pro-prospects'); ui.flash(id); ui.setOpenProspect(id); }}>Ouvrir la fiche créée</Button>,
    3: <Button size="sm" icon="check" disabled={at('preparer')} onClick={() => {
      const id = ensureProspect();
      update((d) => {
        const x = findProspect(d, id)!;
        if (order.indexOf(x.stage) < order.indexOf('qualifier')) setStage(d, id, 'qualifier');
        x.notes.unshift({ id: uid('n'), at: Date.now(), text: `Besoin qualifié par téléphone (exemple) : ${x.guests ?? '?'} invités, ${x.eventType.toLowerCase()} à ${x.place || 'préciser'}, coin mariés souhaité.` });
        x.lastContact = todayISO(); x.nextAction = 'Préparer le devis'; x.nextActionDate = addDays(todayISO(), 1);
        addHistory(x, 'Note de qualification ajoutée.');
        setStage(d, id, 'preparer');
      });
      ui.setOpenProspect(id); toast('Demande qualifiée : statut « Devis à préparer ».');
    }}>{at('preparer') ? 'Demande qualifiée' : 'Qualifier la demande'}</Button>,
    4: <Button size="sm" icon="file" onClick={() => {
      const id = ensureProspect();
      let qid = q?.id ?? '';
      if (!q) update((d) => { qid = createQuote(d, id); });
      setTour({ quoteId: qid }); ui.setOpenProspect(null); ui.setEditQuote(qid); navigate('pro-devis');
    }}>{q ? 'Ouvrir le devis' : 'Créer le devis à partir des tarifs'}</Button>,
    5: <Button size="sm" icon="kanban" disabled={!q || at('envoye')} onClick={() => {
      if (!q || !p) return;
      update((d) => {
        const x = d.quotes.find((y) => y.id === q.id)!; x.status = 'envoye'; x.updatedAt = Date.now();
        log(d, `Devis ${x.number} marqué « envoyé — simulation ».`, 'devis');
        setStage(d, p.id, 'envoye');
      });
      ui.setEditQuote(null); navigate('pro-pipeline'); ui.flash(p.id); toast('Devis envoyé (simulation) : la carte avance dans le pipeline.');
    }}>{at('envoye') ? 'Devis dans le pipeline' : 'Marquer comme envoyé (simulation)'}</Button>,
    6: <Button size="sm" icon="check" disabled={!p || !!data.tasks.find((t) => t.id === tour.taskId)} onClick={() => {
      if (!p) return;
      let tid = '';
      update((d) => { tid = addTask(d, { title: `Relancer ${fullName(p)} au sujet du devis`, prospectId: p.id, due: addDays(todayISO(), 3), priority: 'haute', kind: 'relance' }); const x = findProspect(d, p.id); if (x) { x.nextAction = 'Relancer le devis'; x.nextActionDate = addDays(todayISO(), 3); } });
      setTour({ taskId: tid }); navigate('pro-taches'); ui.flash(tid); toast('Relance planifiée dans 3 jours (simulation).');
    }}>{data.tasks.find((t) => t.id === tour.taskId) ? 'Relance planifiée' : 'Créer la relance à J+3'}</Button>,
    7: <Button size="sm" icon="calendar" disabled={!p} onClick={() => {
      if (!p) return;
      let eid = '';
      update((d) => { eid = addEventFor(d, p.id, 'option'); });
      setTour({ eventId: eid }); ui.setCalendarFocus(p.eventDate); navigate('pro-calendrier'); toast('Événement inscrit en option au calendrier.');
    }}>{data.events.find((e) => e.id === tour.eventId) ? 'Voir l’événement' : 'Inscrire l’événement en option'}</Button>,
    8: <Button size="sm" icon="chart" onClick={() => { navigate('pro'); ui.flash('kpis'); }}>Voir les indicateurs</Button>,
  };

  const needsP = tour.step >= 2 && !p;
  const go = (n: number) => setTour({ step: Math.max(1, Math.min(8, n)), minimized: false });

  if (tour.minimized) {
    return (
      <button type="button" onClick={() => setTour({ minimized: false })} className="fixed bottom-4 right-4 z-[65] inline-flex items-center gap-2 rounded-[40px] bg-white px-4 py-3 text-sm text-black ">
        <Icon name="play" className="h-3.5 w-3.5" />Démonstration · étape {tour.step}/8
      </button>
    );
  }

  return (
    <aside aria-label="Démonstration guidée" className="fixed inset-x-0 bottom-0 z-[65] max-h-[58dvh] overflow-y-auto rounded-none border-t border-white/70 bg-black p-5 text-white animate-rise sm:border sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[390px] sm:rounded-none">
      <div className="flex items-center justify-between gap-3">
        <p className="thin text-[14px]">Démonstration guidée · {tour.step}/8</p>
        <div className="flex gap-1">
          <button type="button" aria-label="Réduire la démonstration" className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setTour({ minimized: true })}><span className="block h-0.5 w-3 bg-current" /></button>
          <button type="button" aria-label="Quitter la démonstration" className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white" onClick={stopTour}><Icon name="x" className="h-4 w-4" /></button>
        </div>
      </div>
      <ol className="mt-3 flex gap-1.5" aria-label="Étapes">
        {STEPS.map((s, i) => <li key={s.title} className="flex-1"><button type="button" onClick={() => go(i + 1)} aria-label={`Étape ${i + 1} : ${s.title}`} aria-current={tour.step === i + 1 ? 'step' : undefined} className={cx('block h-1.5 w-full rounded-full transition', i + 1 === tour.step ? 'bg-white' : i + 1 < tour.step ? 'bg-white/50' : 'bg-white/15')} /></li>)}
      </ol>
      <h2 className="mt-4 font-serif text-[32px] leading-[1.02]">{step.title}</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-white/85">{step.what}</p>
      <p className="mt-3 rounded-none bg-white/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/85"><span className="text-white">Intérêt commercial · </span>{step.why}</p>
      {needsP ? (
        <div className="mt-4 rounded-none bg-white/10 p-3 text-[13px] text-white/85">Il faut d’abord une demande. <button type="button" className="text-white underline" onClick={() => { ensureProspect(); toast('Demande d’exemple créée.'); }}>Créer la demande d’exemple</button> ou revenez à l’étape 1.</div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2 [&_button]:bg-white [&_button]:text-black [&_button]:ring-0 [&_button:hover]:bg-[#D9D9D9]">{actions[tour.step]}</div>
      )}
      {done && !needsP && tour.step < 8 && <p className="mt-3 flex items-center gap-2 text-[12.5px] text-white"><Icon name="check" className="h-4 w-4" />Étape réalisée{tour.step === 1 && p ? ` : ${fullName(p)} est dans le CRM` : ''}{tour.step === 4 && q ? ` : ${q.number}, ${eur(quoteTotals(q).known)}` : ''}</p>}
      {tour.step === 8 && <p className="mt-3 text-[12.5px] text-white/75">{data.prospects.length} demandes · {data.quotes.filter((x) => x.status === 'envoye').length} devis en attente · {data.events.filter((e) => e.date >= todayISO() && e.status !== 'termine').length} événements à venir.</p>}
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-cream/10 pt-4">
        <button type="button" disabled={tour.step === 1} onClick={() => go(tour.step - 1)} className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[13px] text-white/80 hover:bg-white/10 disabled:opacity-40"><Icon name="left" className="h-4 w-4" />Étape précédente</button>
        {tour.step < 8 ? (
          <button type="button" onClick={() => go(tour.step + 1)} className="inline-flex h-9 items-center gap-1 rounded-[40px] bg-white px-4 text-[13px] text-black hover:bg-[#D9D9D9]">Étape suivante<Icon name="right" className="h-4 w-4" /></button>
        ) : (
          <button type="button" onClick={startTour} className="inline-flex h-9 items-center gap-1.5 rounded-[40px] bg-white px-4 text-[13px] text-black hover:bg-[#D9D9D9]"><Icon name="refresh" className="h-4 w-4" />Recommencer la démonstration</button>
        )}
      </div>
      {tour.step < 8 && <button type="button" onClick={startTour} className="mt-2 w-full text-center text-[12px] text-white/60 underline-offset-4 hover:text-white hover:underline">Recommencer la démonstration</button>}
    </aside>
  );
}
