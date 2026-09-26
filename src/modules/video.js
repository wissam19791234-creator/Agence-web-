import { CONFIG } from '../config.js';
import { gsap } from './motion.js';
import { prefersReducedMotion } from './utils.js';

// Durées des chapitres de l'animatique (secondes) — proportionnelles au storyboard 60 s.
const SCENES = [2.5, 4.5, 5, 5, 4.5, 3.5];

function mediaFor(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1" title="Vidéo de présentation" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) {
    return `<iframe src="https://player.vimeo.com/video/${vm[1]}?autoplay=1&title=0&byline=0" title="Vidéo de présentation" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }
  return `<video src="${url}" controls autoplay playsinline preload="none"></video>`;
}

export function initVideo() {
  const player = document.querySelector('[data-player]');
  if (!player) return;
  const toggle = player.querySelector('[data-player-toggle]');
  const mini = player.querySelector('[data-player-mini]');
  const anim = player.querySelector('[data-player-anim]');
  const media = player.querySelector('[data-player-media]');
  const scenes = [...anim.querySelectorAll('.pa-scene')];
  const chapters = [...player.querySelectorAll('[data-player-chapters] li')];
  const hasVideo = !!CONFIG.videoUrl;

  const setMiniIcon = (playing) => {
    mini.innerHTML = playing
      ? '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
    mini.setAttribute('aria-label', playing ? 'Pause' : 'Lecture');
  };

  // ─── Lecture d'une vraie vidéo ───
  if (hasVideo) {
    const start = () => {
      media.hidden = false;
      media.innerHTML = mediaFor(CONFIG.videoUrl);
      player.classList.add('is-playing');
      media.querySelector('video, iframe')?.focus();
    };
    toggle.addEventListener('click', start);
    mini.addEventListener('click', () => {
      const v = media.querySelector('video');
      if (!v) return start();
      v.paused ? v.play() : v.pause();
      setMiniIcon(!v.paused);
    });
    chapters.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
      if (!media.querySelector('video')) start();
      const v = media.querySelector('video');
      if (v) v.currentTime = [0, 5, 15, 30, 45, 55][i];
    }));
    return;
  }

  // ─── Animatique intégrée ───
  const total = SCENES.reduce((a, b) => a + b, 0);
  const offsets = SCENES.map((_, i) => SCENES.slice(0, i).reduce((a, b) => a + b, 0));
  let t = 0;
  let playing = false;
  let last = 0;
  let current = -1;

  const render = () => {
    let idx = offsets.findLastIndex((o) => t >= o);
    if (idx < 0) idx = 0;
    if (idx !== current) {
      scenes.forEach((s, i) => s.classList.toggle('is-on', i === idx));
      chapters.forEach((c, i) => c.classList.toggle('is-current', i === idx));
      current = idx;
    }
    chapters.forEach((c, i) => {
      const fill = Math.min(1, Math.max(0, (t - offsets[i]) / SCENES[i]));
      c.style.setProperty('--fill', fill.toFixed(3));
    });
  };

  const tick = (now) => {
    if (!playing) return;
    const dt = (now - last) / 1000;
    last = now;
    t += dt;
    if (t >= total) {
      t = total;
      render();
      pause();
      return;
    }
    render();
    requestAnimationFrame(tick);
  };

  const play = () => {
    if (t >= total) { t = 0; current = -1; }
    anim.hidden = false;
    player.classList.add('is-playing');
    playing = true;
    last = performance.now();
    setMiniIcon(true);
    requestAnimationFrame(tick);
  };
  function pause() {
    playing = false;
    setMiniIcon(false);
  }

  toggle.addEventListener('click', play);
  mini.addEventListener('click', () => (playing ? pause() : play()));
  anim.addEventListener('click', () => (playing ? pause() : play()));
  chapters.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
    t = offsets[i] + 0.01;
    current = -1;
    render();
    if (!playing) play();
  }));

  // Pause automatique hors écran
  new IntersectionObserver(([e]) => { if (!e.isIntersecting && playing) pause(); }, { threshold: 0.2 }).observe(player);

  // Transition d'entrée dans le viewport
  if (!prefersReducedMotion()) {
    gsap.from(player.querySelector('.player-screen'), {
      scale: 0.88, y: 60, rotateX: 14, transformPerspective: 1400, opacity: 0.2,
      ease: 'power2.out',
      scrollTrigger: { trigger: player, start: 'top 95%', end: 'top 35%', scrub: 0.8 },
    });
  }
}
