import './styles/base.css';
import './styles/dashboard.css';
import './styles/sections-a.css';
import './styles/sections-b.css';
import './styles/film.css';
import './styles/extras.css';
import './styles/site.css';

import { CONFIG } from './config.js';
import { mountDashboard, logoMark } from './modules/dashboard.js';
import { initSmoothScroll, ScrollTrigger } from './modules/motion.js';
import { initNav, initCursor, initMagnetic, initStickyCta, initReveals } from './modules/chrome.js';
import { initHero } from './modules/hero.js';
import { initCinematic } from './modules/cinematic.js';
import { initVideo } from './modules/video.js';
import { initProblem } from './modules/problem.js';
import { initStory } from './modules/story.js';
import { initFeatures } from './modules/features.js';
import { initCore } from './modules/core.js';
import { initDemo } from './modules/demo.js';
import { initBeforeAfter, initPricing, initAccordions, initFinal } from './modules/sections.js';
import { splitWords } from './modules/utils.js';
import { initContent, initForms, initSignupModal, initConsent } from './modules/site.js';
import { initMarquee, initMega, initManifesto, initCases, initRoi, initCommandPalette, initRail, initTilt } from './modules/extras.js';

function applyBrand() {
  document.querySelectorAll('[data-brand]').forEach((el) => { el.textContent = CONFIG.brand; });
  document.querySelectorAll('[data-logo]').forEach((el) => { el.innerHTML = logoMark(el.closest('.hub-core') ? 40 : 24); });
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll('[data-cta]').forEach((el) => { el.setAttribute('href', CONFIG.signupUrl); });
}

function mountDashboards() {
  document.querySelectorAll('[data-dashboard]').forEach((frame) => {
    mountDashboard(frame, { story: frame.dataset.dashboard === 'story' });
  });
}

function safe(name, fn) {
  try { fn(); } catch (err) { console.error(`[${name}]`, err); }
}

applyBrand();
initContent();
mountDashboards();
initSmoothScroll();

safe('nav', initNav);
safe('cursor', initCursor);
safe('magnetic', initMagnetic);
safe('hero', initHero);
safe('cinematic', initCinematic);
safe('video', initVideo);
safe('problem', initProblem);
safe('story', initStory);
safe('features', initFeatures);
safe('core', initCore);
safe('demo', initDemo);
safe('beforeAfter', initBeforeAfter);
safe('pricing', initPricing);
safe('accordions', initAccordions);
safe('final', initFinal);
safe('stickyCta', initStickyCta);
safe('marquee', initMarquee);
safe('mega', initMega);
safe('manifesto', initManifesto);
safe('cases', initCases);
safe('roi', initRoi);
safe('cmdk', initCommandPalette);
safe('rail', initRail);
safe('tilt', initTilt);
safe('forms', initForms);
safe('signup', initSignupModal);
safe('consent', initConsent);
safe('reveals', () => initReveals(splitWords));

// Recalcule les déclencheurs une fois les polices chargées (hauteurs de texte définitives)
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());
