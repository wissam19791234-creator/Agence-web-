import { CONFIG } from '../config.js';
import { gsap } from './motion.js';
import { prefersReducedMotion } from './utils.js';
// Chapitres du film intégré (60 s) et de la vidéo publiée (version courte de 30 s)
const CHAPTERS = [0, 5, 15, 30, 45, 55];
const FILM_DURATION = 60;
const VIDEO_CHAPTERS = [0, 3, 6.5, 12.5, 20, 27];
const VIDEO_DURATION = 30.5;

function mediaFor(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1" title="Vidéo de présentation" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) {
    return `<iframe src="https://player.vimeo.com/video/${vm[1]}?autoplay=1&title=0&byline=0" title="Vidéo de présentation" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }
  const small = window.matchMedia('(max-width: 760px)').matches && CONFIG.videoUrlMobile;
  const src = small ? CONFIG.videoUrlMobile : url;
  const webm = url === CONFIG.videoUrl && CONFIG.videoUrlWebm ? `<source src="${CONFIG.videoUrlWebm}" type="video/webm" />` : '';
  return `<video ${CONFIG.videoPoster ? `poster="${CONFIG.videoPoster}"` : ''} controls autoplay playsinline preload="auto"><source src="${src}" type="video/mp4" />${webm}</video>`;
}

const PLAY_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
const PAUSE_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const REPLAY_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 102.2-5.3"/><path d="M4.5 4.5v4h4"/></svg>';

export function initVideo() {
  const player = document.querySelector('[data-player]');
  if (!player) return;
  const toggle = player.querySelector('[data-player-toggle]');
  const mini = player.querySelector('[data-player-mini]');
  const soundBtn = player.querySelector('[data-player-sound]');
  const anim = player.querySelector('[data-player-anim]');
  const media = player.querySelector('[data-player-media]');
  const chapters = [...player.querySelectorAll('[data-player-chapters] li')];

  // ─── Vraie vidéo configurée ───
  if (CONFIG.videoUrl) {
    soundBtn.hidden = true;
    const start = () => {
      if (media.querySelector('video, iframe')) return;
      media.hidden = false;
      media.innerHTML = mediaFor(CONFIG.videoUrl);
      player.classList.add('is-playing');
      const v = media.querySelector('video');
      if (!v) return;
      v.addEventListener('timeupdate', () => {
        chapters.forEach((c, i) => {
          const a = VIDEO_CHAPTERS[i], b = VIDEO_CHAPTERS[i + 1] ?? VIDEO_DURATION;
          c.style.setProperty('--fill', Math.min(1, Math.max(0, (v.currentTime - a) / (b - a))).toFixed(3));
          c.classList.toggle('is-current', v.currentTime >= a && v.currentTime < b);
        });
      });
      v.addEventListener('play', () => { mini.innerHTML = PAUSE_ICON; });
      v.addEventListener('pause', () => { mini.innerHTML = PLAY_ICON; });
      v.play()?.catch(() => {});
    };
    toggle.addEventListener('click', start);
    mini.addEventListener('click', () => {
      const v = media.querySelector('video');
      if (!v) return start();
      v.paused ? v.play() : v.pause();
      mini.innerHTML = v.paused ? PLAY_ICON : PAUSE_ICON;
    });
    chapters.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
      if (!media.querySelector('video')) start();
      const v = media.querySelector('video');
      if (v) v.currentTime = VIDEO_CHAPTERS[i];
    }));
    return;
  }

  // ─── Film intégré (repli si aucune vidéo n'est configurée) ───
  import('./film.js').then(({ buildFilm }) => import('./sound.js').then(({ createSoundtrack }) => initLiveFilm(buildFilm, createSoundtrack)));
  function initLiveFilm(buildFilm, createSoundtrack) {
  let film = null;
  const sound = createSoundtrack();
  let nextEv = 0;
  let schedTimer = null;

  const ensureFilm = () => {
    if (film) return film;
    anim.hidden = false;
    film = buildFilm(anim);
    anim.filmTimeline = film.tl; // accès pour les tests automatisés
    film.tl.eventCallback('onUpdate', render);
    film.tl.eventCallback('onComplete', () => { stopSched(); setState('ended'); });
    return film;
  };

  const render = () => {
    const t = film.tl.time();
    chapters.forEach((c, i) => {
      const a = CHAPTERS[i];
      const b = CHAPTERS[i + 1] ?? FILM_DURATION;
      const fill = Math.min(1, Math.max(0, (t - a) / (b - a)));
      c.style.setProperty('--fill', fill.toFixed(3));
      c.classList.toggle('is-current', t >= a && t < b);
    });
  };

  // Planification audio en avance sur la timeline
  const seekScore = (t) => { nextEv = film.score.findIndex((e) => e.t >= t - 0.01); if (nextEv < 0) nextEv = film.score.length; };
  const tickSched = () => {
    if (!sound || !film) return;
    const t = film.tl.time();
    const base = sound.now();
    while (nextEv < film.score.length && film.score[nextEv].t < t + 0.15) {
      const e = film.score[nextEv++];
      if (e.t >= t - 0.05) sound.play(e.type, base + (e.t - t), e.arg);
    }
  };
  const startSched = () => { stopSched(); seekScore(film.tl.time()); schedTimer = setInterval(tickSched, 25); tickSched(); };
  function stopSched() { if (schedTimer) clearInterval(schedTimer); schedTimer = null; }

  const setState = (s) => {
    player.dataset.state = s;
    mini.innerHTML = s === 'playing' ? PAUSE_ICON : s === 'ended' ? REPLAY_ICON : PLAY_ICON;
    mini.setAttribute('aria-label', s === 'playing' ? 'Pause' : s === 'ended' ? 'Revoir' : 'Lecture');
  };

  const play = () => {
    ensureFilm();
    sound?.unlock();
    if (film.tl.progress() >= 1) film.tl.seek(0);
    player.classList.add('is-playing');
    film.tl.play();
    startSched();
    setState('playing');
  };
  const pause = () => {
    if (!film) return;
    film.tl.pause();
    stopSched();
    setState('paused');
  };

  toggle.addEventListener('click', play);
  mini.addEventListener('click', () => (film && film.tl.isActive() ? pause() : play()));
  anim.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    film?.tl.isActive() ? pause() : play();
  });
  chapters.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
    ensureFilm();
    film.tl.seek(CHAPTERS[i] + 0.001, false);
    render();
    play();
  }));

  if (sound) {
    soundBtn.addEventListener('click', () => {
      const m = !sound.muted;
      sound.setMuted(m);
      soundBtn.setAttribute('aria-pressed', String(!m));
      soundBtn.setAttribute('aria-label', m ? 'Activer le son' : 'Couper le son');
    });
  } else {
    soundBtn.hidden = true;
  }

  // Raccourci clavier : espace quand le lecteur a le focus
  player.addEventListener('keydown', (e) => {
    if (e.key === 'k' || (e.key === ' ' && e.target === player)) { e.preventDefault(); film?.tl.isActive() ? pause() : play(); }
  });

  // Pause automatique hors écran
  new IntersectionObserver(([e]) => { if (!e.isIntersecting && film?.tl.isActive()) pause(); }, { threshold: 0.25 }).observe(player);

  // Transition d'entrée dans le viewport
  if (!prefersReducedMotion()) {
    gsap.from(player.querySelector('.player-screen'), {
      scale: 0.88, y: 60, rotateX: 14, transformPerspective: 1400, opacity: 0.2,
      ease: 'power2.out',
      scrollTrigger: { trigger: player, start: 'top 95%', end: 'top 35%', scrub: 0.8 },
    });
  }
  setState('idle');
  }
}
