// Pages de l'application. `key` : raccourci « G puis … ».
import * as overview from './views/overview.js';
import * as analytics from './views/analytics.js';
import * as ai from './views/ai.js';
import * as insights from './views/insights.js';
import * as automations from './views/automations.js';
import * as reports from './views/reports.js';
import * as goals from './views/goals.js';
import * as settings from './views/settings.js';

export const ROUTES = [
  { id: 'overview', title: 'Vue d’ensemble', icon: 'home', nav: true, key: 'o', view: overview },
  { id: 'analytics', title: 'Analyses', icon: 'chart', nav: true, key: 'a', view: analytics },
  { id: 'ai', title: 'Copilot IA', icon: 'spark', nav: true, key: 'c', view: ai },
  { id: 'insights', title: 'Insights', icon: 'bulb', nav: true, key: 'i', badge: 5, view: insights },
  { id: 'automations', title: 'Automatisations', icon: 'flow', nav: true, key: 'u', view: automations },
  { id: 'reports', title: 'Rapports', icon: 'doc', nav: true, key: 'r', view: reports },
  { id: 'goals', title: 'Objectifs', icon: 'target', nav: true, key: 'g', view: goals },
  { id: 'settings', title: 'Paramètres', icon: 'settings', nav: false, key: 's', view: settings },
];
