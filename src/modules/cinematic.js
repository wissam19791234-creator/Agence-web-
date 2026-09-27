import { gsap } from './motion.js';
import { prefersReducedMotion, splitWords } from './utils.js';

export function initCinematic() {
  const sec = document.getElementById('produit');
  const l1 = sec.querySelector('[data-cine="1"]');
  const l2 = sec.querySelector('[data-cine="2"]');
  const l3 = sec.querySelector('[data-cine="3"]');
  const stage = sec.querySelector('[data-cine="stage"]');
  const beam = sec.querySelector('.cine-beam');
  if (prefersReducedMotion()) return;

  const mm = gsap.matchMedia();

  mm.add('(min-width: 900px)', () => {
    sec.classList.add('is-pinned');
    const w1 = splitWords(l1);
    const w2 = splitWords(l2);
    const w3 = splitWords(l3);

    gsap.set([w1, w2, w3], { yPercent: 110, opacity: 0, filter: 'blur(8px)' });
    gsap.set(stage, { opacity: 0, scale: 0.72, y: 80, rotateX: 18, transformPerspective: 1600 });
    gsap.set(beam, { left: '0%', opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.4 },
    });
    tl.to(w1, { yPercent: 0, opacity: 1, filter: 'blur(0px)', stagger: 0.08, duration: 1 })
      .to({}, { duration: 0.8 })
      .to(l1, { opacity: 0, y: -40, filter: 'blur(10px)', duration: 0.8 })
      .to(w2, { yPercent: 0, opacity: 1, filter: 'blur(0px)', stagger: 0.1, duration: 1 }, '-=0.3')
      .to({}, { duration: 0.8 })
      .to(l2, { opacity: 0, scale: 0.94, filter: 'blur(10px)', duration: 0.8 })
      .to(stage, { opacity: 1, scale: 1, y: 0, rotateX: 0, duration: 2, ease: 'power2.out' }, '-=0.5')
      .to(beam, { opacity: 1, duration: 0.15 }, '-=0.6')
      .to(beam, { left: '100%', duration: 1.4, ease: 'power1.inOut' }, '<')
      .to(beam, { opacity: 0, duration: 0.2 }, '-=0.2')
      .to(w3, { yPercent: 0, opacity: 1, filter: 'blur(0px)', stagger: 0.06, duration: 1 }, '-=0.6')
      .to(stage, { scale: 0.96, y: 30, duration: 1 }, '<')
      .to({}, { duration: 0.6 });

    return () => sec.classList.remove('is-pinned');
  });

  mm.add('(max-width: 899px)', () => {
    [l1, l2, stage, l3].forEach((el) => {
      gsap.from(el, {
        y: 40, opacity: 0, filter: 'blur(8px)', duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });
    gsap.fromTo(beam, { left: '0%', opacity: 1 }, {
      left: '100%', opacity: 0, duration: 1.6, ease: 'power1.inOut',
      scrollTrigger: { trigger: stage, start: 'top 60%', once: true },
    });
  });
}
