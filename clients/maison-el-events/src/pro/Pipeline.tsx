import { useState } from 'react';
import { Icon } from '../components/Icon';
import { cx, FictifBadge, useConfirm, useToast } from '../components/ui';
import { addEventFor, log, setStage } from '../lib/actions';
import { estimateFor } from '../lib/calc';
import { STAGES } from '../lib/constants';
import { eur, fmtShort, fullName, todayISO } from '../lib/format';
import { useStore } from '../lib/store';
import type { Prospect, StageKey } from '../lib/types';
import { useUi } from '../lib/ui';
import { ProHeader } from './ProApp';

export function useMoveStage() {
  const { data, update } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  return async (p: Prospect, to: StageKey) => {
    if (p.stage === to) return;
    let addEvent = false;
    if (to === 'reservation' && !data.events.some((e) => e.prospectId === p.id && e.status === 'confirme')) {
      addEvent = await confirm({ title: 'Inscrire la réservation au calendrier ?', message: <>La carte passe en « Réservation confirmée — simulation ». Voulez-vous aussi inscrire l’événement de {fullName(p)} au calendrier ? Rien n’est confirmé auprès du client : c’est une simulation.</>, confirm: 'Oui, inscrire' });
    }
    update((d) => {
      setStage(d, p.id, to);
      if (to === 'envoye') {
        const q = d.quotes.find((x) => x.prospectId === p.id && x.status === 'brouillon');
        if (q) { q.status = 'envoye'; q.updatedAt = Date.now(); log(d, `Devis ${q.number} marqué « envoyé — simulation ».`, 'devis'); }
      }
      if (to === 'reservation') {
        const q = d.quotes.find((x) => x.prospectId === p.id && (x.status === 'envoye' || x.status === 'brouillon'));
        if (q) q.status = 'accepte';
        if (addEvent) addEventFor(d, p.id, 'confirme');
      }
      if (to === 'termine') d.events.filter((e) => e.prospectId === p.id).forEach((e) => { e.status = 'termine'; });
    });
    toast(`${fullName(p)} → ${STAGES.find((s) => s.key === to)!.label}`);
  };
}

export default function Pipeline() {
  const { data } = useStore();
  const { setOpenProspect, highlight } = useUi();
  const move = useMoveStage();
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<StageKey | null>(null);
  const today = todayISO();

  return (
    <>
      <ProHeader title="Pipeline commercial" sub="Glissez une carte d’une colonne à l’autre, ou utilisez le menu « Déplacer » de chaque carte. Les devis et réservations sont simulés." />
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        <ol className="grid min-w-max auto-cols-[272px] grid-flow-col gap-3">
          {STAGES.map((s) => {
            const cards = data.prospects.filter((p) => p.stage === s.key);
            const sum = cards.reduce((a, p) => a + estimateFor(p, data.quotes, data.catalog).amount, 0);
            return (
              <li key={s.key}
                onDragOver={(e) => { e.preventDefault(); setOver(s.key); }} onDragLeave={() => setOver((o) => (o === s.key ? null : o))}
                onDrop={(e) => { e.preventDefault(); setOver(null); const p = data.prospects.find((x) => x.id === (drag ?? e.dataTransfer.getData('text/plain'))); if (p) move(p, s.key); setDrag(null); }}
                className={cx('flex min-h-[420px] flex-col rounded-card border p-2.5 transition', over === s.key ? 'border-brand/50 bg-brand-soft' : 'border-line bg-[#0E0E0E]/50')}>
                <div className="px-1.5 pb-2.5 pt-1">
                  <h2 className="flex items-center gap-2 text-[13px] font-semibold text-brun"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.dot }} />{s.label}</h2>
                  <p className="mt-1 text-xs text-brun-3 tabular">{cards.length} carte{cards.length > 1 ? 's' : ''} · {eur(sum, true)} estimés</p>
                </div>
                <ul className="flex-1 space-y-2">
                  {cards.map((p) => {
                    const est = estimateFor(p, data.quotes, data.catalog);
                    return (
                      <li key={p.id} draggable onDragStart={(e) => { setDrag(p.id); e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { setDrag(null); setOver(null); }}
                        className={cx('cursor-grab rounded-card border border-line bg-panel p-3 shadow-[0_1px_0_rgba(48,35,31,.04)] transition hover: active:cursor-grabbing', drag === p.id && 'opacity-50', highlight === p.id && 'animate-glow ring-2 ring-brand/30')}>
                        <div className="flex items-start justify-between gap-2">
                          <button type="button" className="text-left text-sm font-medium leading-snug text-brun hover:text-brand" onClick={() => setOpenProspect(p.id)}>{fullName(p)}</button>
                          <FictifBadge />
                        </div>
                        <p className="mt-1 text-xs text-brun-2">{p.eventType} · {p.eventDate ? fmtShort(p.eventDate) : 'date à définir'}</p>
                        <p className="mt-2 text-xl leading-none text-brun tabular">{eur(est.amount)}<span className="ml-1.5 font-sans text-[10.5px] text-brun-3">{est.fromQuote ? 'devis' : 'estimé'}</span></p>
                        {p.nextAction && <p className={cx('mt-2 flex items-start gap-1.5 text-xs', p.nextActionDate && p.nextActionDate < today ? 'text-danger' : 'text-brun-3')}><Icon name="arrow" className="mt-0.5 h-3 w-3 shrink-0" />{p.nextAction}{p.nextActionDate ? ` · ${fmtShort(p.nextActionDate)}` : ''}</p>}
                        <label className="mt-2.5 flex items-center gap-2 border-t border-line pt-2 text-[11px] text-brun-3">
                          <span className="shrink-0">Déplacer</span>
                          <select value={p.stage} onChange={(e) => move(p, e.target.value as StageKey)} aria-label={`Déplacer ${fullName(p)} vers une autre colonne`} className="h-7 min-w-0 flex-1 rounded-lg border border-line bg-cream px-1.5 text-[11.5px] text-brun-2 outline-none focus:ring-2 focus:ring-brand/20">
                            {STAGES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                          </select>
                        </label>
                      </li>
                    );
                  })}
                  {!cards.length && <li className="grid h-24 place-items-center rounded-card border border-dashed border-line text-xs text-brun-3">Déposez une carte ici</li>}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
