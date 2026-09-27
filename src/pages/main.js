// Pages secondaires (produit, fonctionnalités, tarifs, sécurité, ressources).
import '../styles/tokens.css';
import '../styles/site.css';
import '../styles/product.css';

import { initChrome, renderPricing } from '../site/common.js';
import { mountDemo } from '../landing/demo.js';
import { renderInsights, renderBento } from '../landing/sections.js';
import { mountCopilot } from '../shared/copilot-ui.js';

const safe = (name, fn) => { try { fn(); } catch (err) { console.error(`[${name}]`, err); } };
const $ = (s) => document.querySelector(s);

safe('chrome', initChrome);
safe('demo', () => $('[data-demo]') && mountDemo($('[data-demo]')));
safe('bento', () => $('[data-bento]') && renderBento($('[data-bento]')));
safe('insights', () => $('[data-insights]') && renderInsights($('[data-insights]')));
safe('pricing', () => $('[data-pricing]') && renderPricing($('[data-pricing]')));
safe('copilot', () => {
  const el = $('[data-copilot]');
  if (!el) return;
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); mountCopilot(el, {}); } }, { rootMargin: '300px' });
  io.observe(el);
});
