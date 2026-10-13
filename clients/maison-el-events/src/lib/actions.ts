// Opérations métier appliquées sur une copie des données (voir useStore().update).
import { suggestedLines } from './calc';
import { stageLabel } from './constants';
import { addDays, fullName, todayISO, uid } from './format';
import type { Activity, CalEvent, Data, EventStatus, Prospect, Quote, StageKey, Task } from './types';

export function log(d: Data, text: string, kind: Activity['kind']) {
  d.activity.unshift({ id: uid('a'), at: Date.now(), text, kind });
  d.activity = d.activity.slice(0, 80);
}

export function addHistory(p: Prospect, text: string) {
  p.history.unshift({ id: uid('h'), at: Date.now(), text });
}

export const findProspect = (d: Data, id: string | null | undefined) => (id ? d.prospects.find((p) => p.id === id) : undefined);

export type RequestInput = Omit<Prospect, 'id' | 'notes' | 'history' | 'stage' | 'nextAction' | 'nextActionDate' | 'lastContact' | 'createdAt' | 'fictif' | 'tags'> & { tags?: string[] };

export function createProspect(d: Data, input: RequestInput, how: string): string {
  const id = uid('p');
  const p: Prospect = {
    ...input, id, tags: input.tags ?? [], notes: [], history: [], stage: 'nouveau', nextAction: 'Répondre à la demande',
    nextActionDate: addDays(todayISO(), 1), lastContact: '', createdAt: Date.now(), fictif: true,
  };
  addHistory(p, how);
  d.prospects.unshift(p);
  log(d, `${how.replace(/\.$/, '')} : ${fullName(p)} (${p.eventType.toLowerCase()}).`, 'demande');
  return id;
}

export function setStage(d: Data, id: string, stage: StageKey) {
  const p = findProspect(d, id);
  if (!p || p.stage === stage) return;
  p.stage = stage;
  addHistory(p, `Statut : ${stageLabel(stage)}.`);
  log(d, `${fullName(p)} → ${stageLabel(stage)}.`, 'pipeline');
}

export function nextQuoteNumber(d: Data): string {
  const n = d.settings.nextQuoteNumber++;
  return `DEV-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`;
}

export function createQuote(d: Data, prospectId: string): string {
  const p = findProspect(d, prospectId)!;
  const q: Quote = {
    id: uid('q'), number: nextQuoteNumber(d), prospectId, eventType: p.eventType, eventDate: p.eventDate, guests: p.guests,
    lines: suggestedLines(d.catalog, p), extraFees: "Frais d'installation et de déplacement : sur devis.",
    conditions: d.settings.conditions, notes: '', status: 'brouillon', createdAt: Date.now(), updatedAt: Date.now(),
  };
  d.quotes.unshift(q);
  addHistory(p, `Devis ${q.number} créé (brouillon).`);
  if (p.stage === 'nouveau' || p.stage === 'qualifier') { p.stage = 'preparer'; addHistory(p, `Statut : ${stageLabel('preparer')}.`); }
  log(d, `Devis ${q.number} créé pour ${fullName(p)}.`, 'devis');
  return q.id;
}

export function addTask(d: Data, t: Omit<Task, 'id' | 'createdAt' | 'done'>): string {
  const id = uid('t');
  d.tasks.unshift({ ...t, id, done: false, createdAt: Date.now() });
  const p = findProspect(d, t.prospectId);
  if (p) addHistory(p, `Tâche ajoutée : ${t.title}.`);
  log(d, `Tâche ajoutée : ${t.title}.`, 'tache');
  return id;
}

export function addEventFor(d: Data, prospectId: string, status: EventStatus): string {
  const p = findProspect(d, prospectId)!;
  const existing = d.events.find((e) => e.prospectId === prospectId);
  if (existing) { existing.status = status; existing.date = existing.date || p.eventDate; return existing.id; }
  const e: CalEvent = {
    id: uid('e'), prospectId, title: `${p.eventType} — ${fullName(p)}`, date: p.eventDate || addDays(todayISO(), 30), time: '',
    status, place: p.place, guests: p.guests, notes: '',
  };
  d.events.push(e);
  addHistory(p, `Inscrit au calendrier (${status === 'confirme' ? 'confirmé — simulation' : status === 'option' ? 'option' : 'terminé'}).`);
  log(d, `Événement ajouté au calendrier : ${e.title}.`, 'agenda');
  return e.id;
}

export function deleteProspect(d: Data, id: string) {
  const p = findProspect(d, id);
  d.prospects = d.prospects.filter((x) => x.id !== id);
  d.quotes = d.quotes.filter((q) => q.prospectId !== id);
  d.events = d.events.filter((e) => e.prospectId !== id);
  d.tasks = d.tasks.map((t) => (t.prospectId === id ? { ...t, prospectId: null } : t));
  if (p) log(d, `Fiche supprimée : ${fullName(p)}.`, 'client');
}

export function createQuoteFromLines(d: Data, prospectId: string, lines: Quote['lines'], notes = ''): string {
  const p = findProspect(d, prospectId)!;
  const q: Quote = {
    id: uid('q'), number: nextQuoteNumber(d), prospectId, eventType: p.eventType, eventDate: p.eventDate, guests: p.guests, lines,
    extraFees: "Frais d'installation et de déplacement : sur devis.", conditions: d.settings.conditions, notes, status: 'brouillon',
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  d.quotes.unshift(q);
  addHistory(p, `Devis ${q.number} créé à partir de la simulation (brouillon).`);
  log(d, `Devis ${q.number} créé depuis une simulation pour ${fullName(p)}.`, 'devis');
  return q.id;
}
