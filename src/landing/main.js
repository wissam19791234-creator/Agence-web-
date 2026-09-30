import '../styles/tokens.css';
import '../styles/site.css';
import '../styles/product.css';

import { CONFIG } from '../config.js';
import { initChrome, renderPricing, renderProof, renderTeam } from '../site/common.js';
import { mountDemo } from './demo.js';
import { renderInsights, renderBento, renderSimulator } from './sections.js';
import { mountCopilot } from '../shared/copilot-ui.js';
import { IS_ARTIFACT } from '../shared/paths.js';

const safe = (name, fn) => { try { fn(); } catch (err) { console.error(`[${name}]`, err); } };

safe('chrome', initChrome);
safe('demo', () => mountDemo(document.querySelector('[data-demo]')));
safe('insights', () => renderInsights(document.querySelector('[data-insights]')));
safe('bento', () => renderBento(document.querySelector('[data-bento]')));
safe('simulator', () => renderSimulator(document.querySelector('[data-sim]')));
safe('proof', () => renderProof(document.querySelector('[data-proof]')));
safe('team', () => renderTeam(document.querySelector('[data-team]')));
safe('pricing', () => renderPricing(document.querySelector('[data-pricing]'), { compact: true }));

// Copilot : monté quand la section approche
safe('copilot', () => {
  const el = document.querySelector('[data-copilot]');
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    mountCopilot(el, { intro: 'Bonjour. J’ai analysé les 90 derniers jours de ce workspace de démonstration. Que voulez-vous savoir ?', autoAsk: 'Sur quoi dois-je me concentrer aujourd’hui ?' });
  }, { rootMargin: '300px' });
  io.observe(el);
});

// Vidéo de démonstration (modale)
safe('video', () => {
  const modal = document.querySelector('[data-video-modal]');
  const media = modal.querySelector('[data-video-media]');
  const v = CONFIG.video;
  const src = (p) => (IS_ARTIFACT ? p.replace(/^\//, '') : p);
  let last = null;
  const open = () => {
    last = document.activeElement;
    const small = window.matchMedia('(max-width: 760px)').matches;
    media.innerHTML = `<video controls autoplay playsinline poster="${src(v.poster)}"><source src="${src(small ? v.mp4Mobile : v.mp4)}" type="video/mp4" /><source src="${src(v.webm)}" type="video/webm" /></video>`;
    modal.hidden = false;
    document.documentElement.classList.add('is-locked');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    modal.querySelector('.vmodal-x').focus();
  };
  const close = () => {
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('is-locked');
    setTimeout(() => { modal.hidden = true; media.innerHTML = ''; }, 200);
    last?.focus();
  };
  document.querySelectorAll('[data-video-open]').forEach((b) => b.addEventListener('click', open));
  modal.querySelectorAll('[data-video-close]').forEach((b) => b.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
});
