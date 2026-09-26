import { ScrollTrigger } from './motion.js';
import { prefersReducedMotion } from './utils.js';

const STATUS = [
  'En attente de données',
  'Collecte · 14 sources connectées',
  'Analyse IA en cours…',
  'Dashboard organisé',
  'Automatisations déclenchées',
  'Résultats à jour · temps réel',
];

export function initStory() {
  const sec = document.getElementById('comment');
  const db = sec.querySelector('.db--story');
  const steps = [...sec.querySelectorAll('.story-step')];
  const status = sec.querySelector('.story-status');
  const statusText = sec.querySelector('[data-story-status]');
  const count = sec.querySelector('[data-story-n]');
  const rail = sec.querySelector('[data-story-rail]');
  if (!db) return;

  const setStage = (n) => {
    db.dataset.stage = String(n);
    steps.forEach((s, i) => s.classList.toggle('is-active', i === n - 1));
    statusText.textContent = STATUS[n];
    count.textContent = String(n);
    status.classList.toggle('is-live', n > 0 && n < 5);
    rail.style.transform = `scaleX(${n / 5})`;
  };

  if (prefersReducedMotion()) {
    setStage(5);
    steps.forEach((s) => s.classList.add('is-active'));
    return;
  }

  setStage(0);
  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 62%',
      end: 'bottom 62%',
      onEnter: () => setStage(i + 1),
      onEnterBack: () => setStage(i + 1),
      onLeaveBack: () => i === 0 && setStage(0),
    });
  });
}
