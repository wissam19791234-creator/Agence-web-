import { gsap } from './motion.js';
import { countUp, onceVisible, prefersReducedMotion, isFinePointer, wait } from './utils.js';

export function initFeatures() {
  const cards = document.querySelectorAll('.feat');
  const reduced = prefersReducedMotion();

  document.querySelectorAll('.fa-bars i').forEach((b, i) => b.style.setProperty('--i', i));

  cards.forEach((card) => {
    // Halo qui suit le pointeur
    if (isFinePointer()) {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--sx', `${e.clientX - r.left}px`);
        card.style.setProperty('--sy', `${e.clientY - r.top}px`);
      });
    }

    onceVisible(card, () => {
      card.classList.add('is-in');
      if (card.dataset.feat === 'analytics') typeQuestion(card, reduced);
      if (card.dataset.feat === 'perf') {
        card.querySelectorAll('[data-count]').forEach((el) => {
          countUp(el, parseFloat(el.dataset.count), {
            decimals: Number(el.dataset.decimals || 0),
            suffix: el.dataset.suffix || '',
            duration: 1800,
          });
        });
      }
    });
  });

  if (!reduced) {
    gsap.from(cards, {
      y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity',
      scrollTrigger: { trigger: '.feat-grid', start: 'top 85%', once: true },
    });
  }

  // Reporting : génération à la demande
  const btn = document.querySelector('[data-report-btn]');
  const report = document.querySelector('[data-report]');
  const done = report?.querySelector('.fr-done');
  btn?.addEventListener('click', async () => {
    const label = btn.querySelector('.fr-btn-label');
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    label.textContent = 'Génération…';
    done.textContent = '';
    report.classList.remove('is-generating');
    void report.offsetWidth;
    report.classList.add('is-generating');
    await wait(reduced ? 200 : 1900);
    btn.classList.remove('is-loading');
    btn.removeAttribute('aria-busy');
    label.textContent = 'Générer à nouveau';
    done.textContent = '✓ Rapport prêt · 4 pages';
  });
}

async function typeQuestion(card, reduced) {
  const el = card.querySelector('[data-type]');
  if (!el || reduced) return;
  const text = el.dataset.type;
  el.textContent = '';
  await wait(400);
  for (let i = 1; i <= text.length; i++) {
    el.textContent = text.slice(0, i);
    await wait(28 + Math.random() * 30);
  }
}
