// Couche d'accès aux données. Aujourd'hui : données de démonstration + stockage local.
// Demain : remplacez le corps de chaque fonction par un appel à votre API (mêmes signatures,
// mêmes formes de retour) — l'interface n'a rien d'autre à changer.
import * as D from './demo-data.js';
import { answer } from './copilot.js';

const LATENCY = { fast: 250, normal: 550, slow: 1400 };
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => JSON.parse(JSON.stringify(v));

const KEY = 'scalify-demo-v1';
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
function save(patch) { const s = { ...load(), ...patch }; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* stockage indisponible */ } return s; }

export const api = {
  /** Workspace courant, utilisateur et état d'onboarding. */
  async session() {
    const s = load();
    return { user: { ...D.USER, ...(s.user || {}) }, workspace: D.WORKSPACES[0], goals: s.onboardingGoals || [], demo: true };
  },
  async saveOnboarding({ name, email, goals, sources }) {
    save({ user: { name: name || D.USER.name, email: email || D.USER.email, initials: (name || 'Vous').slice(0, 2).toUpperCase() }, onboardingGoals: goals, sources });
    await delay(LATENCY.fast);
    return true;
  },

  async metrics(period = '30d') {
    await delay(LATENCY.normal);
    const days = D.PERIODS.find((p) => p.id === period)?.days || 30;
    return Object.keys(D.METRICS).map((id) => D.summarize(id, days));
  },
  metricSync(id, days = 30) { return D.summarize(id, days); },
  dates(days = 30) { return D.DATES.slice(-days); },

  async health() { await delay(LATENCY.fast); return clone(D.HEALTH); },
  async channels() { await delay(LATENCY.fast); return clone(D.CHANNELS); },
  async briefing() { await delay(LATENCY.normal); return clone(D.BRIEFING); },
  async activity() { await delay(LATENCY.fast); return clone(D.ACTIVITY); },

  async insights() {
    await delay(LATENCY.normal);
    const hidden = load().hiddenInsights || [];
    return clone(D.INSIGHTS).filter((i) => !hidden.includes(i.id));
  },
  async hideInsight(id) { save({ hiddenInsights: [...new Set([...(load().hiddenInsights || []), id])] }); },
  async restoreInsight(id) { save({ hiddenInsights: (load().hiddenInsights || []).filter((x) => x !== id) }); },

  async notifications() { await delay(LATENCY.fast); const read = load().readNotifs || []; return clone(D.NOTIFICATIONS).map((n) => ({ ...n, unread: n.unread && !read.includes(n.id) })); },
  async markRead(ids) { save({ readNotifs: [...new Set([...(load().readNotifs || []), ...ids])] }); },

  async automations() {
    await delay(LATENCY.normal);
    const s = load();
    const list = s.automations || clone(D.AUTOMATIONS);
    return list;
  },
  async saveAutomations(list) { save({ automations: list }); await delay(LATENCY.fast); return list; },
  automationOptions() { return { triggers: D.TRIGGERS, actions: D.ACTIONS, notify: D.NOTIFY, templates: D.AUTOMATION_TEMPLATES }; },

  async goals() { await delay(LATENCY.normal); return load().goals || clone(D.GOALS); },
  async saveGoals(list) { save({ goals: list }); await delay(LATENCY.fast); return list; },

  async reports() { await delay(LATENCY.fast); return clone(D.REPORTS).map((r) => ({ ...r, schedule: (load().schedules || {})[r.id] ?? r.schedule })); },
  async generateReport(id) { await delay(LATENCY.slow + 600); return { id, generatedAt: new Date().toISOString() }; },
  async scheduleReport(id, schedule) { save({ schedules: { ...(load().schedules || {}), [id]: schedule } }); await delay(LATENCY.fast); },

  async sources() { await delay(LATENCY.fast); return load().sources?.length ? load().sources.map((n) => ({ id: n, name: n, status: 'pending' })).concat(D.SOURCES) : clone(D.SOURCES); },

  /** Question au Copilot. `context` : { page, metric, intent } */
  async askCopilot(question, context = {}) {
    await delay(900 + Math.random() * 500);
    return answer(question, context);
  },

  layout() { return load().layout || null; },
  saveLayout(layout) { save({ layout }); },
  savedViews() { return load().views || []; },
  saveView(view) { const views = [...(load().views || []), view]; save({ views }); return views; },
  reset() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } },
};
