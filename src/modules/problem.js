import { gsap, ScrollTrigger } from './motion.js';
import { icon } from './icons.js';
import { prefersReducedMotion } from './utils.js';

export function initProblem() {
  const sec = document.getElementById('probleme');
  const stage = sec.querySelector('.prob-stage');
  const svg = sec.querySelector('[data-prob-lines]');
  const frags = [...sec.querySelectorAll('[data-frag]')];
  const hub = sec.querySelector('[data-hub]');
  const hubCore = hub.querySelector('.hub-core');
  const chain = [...sec.querySelectorAll('.prob-chain span')];
  const foot = sec.querySelector('[data-prob-foot]');

  frags.forEach((f) => {
    const ic = f.querySelector('[data-ic]');
    if (ic) ic.innerHTML = icon(ic.dataset.ic, 13);
  });

  if (prefersReducedMotion()) {
    chain.forEach((c) => c.classList.add('is-lit'));
    return;
  }

  // Centre du noyau, calculé depuis la mise en page (indépendant des transformations)
  const hubCenter = () => [
    hub.offsetLeft,
    hub.offsetTop - hub.offsetHeight / 2 + hubCore.offsetTop + hubCore.offsetHeight / 2,
  ];

  // Lignes de flux (recalculées à chaque refresh)
  let paths = [];
  let dots = [];
  const NS = 'http://www.w3.org/2000/svg';
  const build = () => {
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
    const [hx, hy] = hubCenter();
    paths = frags.map((f) => {
      const x = f.offsetLeft;
      const y = f.offsetTop;
      const p = document.createElementNS(NS, 'path');
      const cx = (x + hx) / 2;
      p.setAttribute('d', `M${x},${y} C${cx},${y} ${cx},${hy} ${hx},${hy}`);
      p.setAttribute('pathLength', '1');
      p.style.strokeDasharray = '1';
      p.style.strokeDashoffset = String(1 - lineProgress);
      svg.appendChild(p);
      return p;
    });
    dots = paths.map((p, i) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '2.5');
      c.style.opacity = '0';
      c.dataset.offset = String(i / paths.length);
      svg.appendChild(c);
      return c;
    });
  };

  let lineProgress = 0;
  const lines = { p: 0, flow: 0 };

  const setLines = () => {
    paths.forEach((p) => { p.style.strokeDashoffset = String(1 - lines.p); });
    lineProgress = lines.p;
  };

  // Particules le long des lignes
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(sec);
  gsap.ticker.add((time) => {
    if (!visible || !paths.length || lines.flow <= 0.01) {
      dots.forEach((d) => { d.style.opacity = '0'; });
      return;
    }
    dots.forEach((d, i) => {
      const p = paths[i];
      const len = p.getTotalLength();
      const k = ((time * 0.35 + Number(d.dataset.offset)) % 1);
      const pt = p.getPointAtLength(k * len);
      d.setAttribute('cx', pt.x);
      d.setAttribute('cy', pt.y);
      d.style.opacity = String(lines.flow * Math.sin(k * Math.PI));
    });
  });

  const toHub = (f, axis) => () => {
    const [hx, hy] = hubCenter();
    return axis === 'x' ? hx - f.offsetLeft : hy - f.offsetTop;
  };

  const lightChain = (n) => chain.forEach((c, i) => c.classList.toggle('is-lit', i < n));

  const mm = gsap.matchMedia();
  const buildTimeline = (scrollTrigger) => {
    const tl = gsap.timeline({ scrollTrigger, defaults: { ease: 'power2.out' } });
    const chainState = { n: 0 };
    tl.set(frags, { opacity: 0, scale: 0.85, y: 30 })
      .set(hub, { opacity: 0, scale: 0.6 })
      .set(foot, { opacity: 0, y: 20 })
      .to(chainState, { n: chain.length, duration: 3, ease: 'none', onUpdate: () => lightChain(Math.round(chainState.n)) }, 0)
      .to(frags, { opacity: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.36 }, 0)
      .to(hub, { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.6)' }, 2.8)
      .to(lines, { p: 1, duration: 1.2, onUpdate: setLines }, 3)
      .to(lines, { flow: 1, duration: 0.6 }, 3.4)
      .to({}, { duration: 0.8 });
    frags.forEach((f, i) => {
      tl.to(f, { x: toHub(f, 'x'), y: toHub(f, 'y'), scale: 0.2, opacity: 0, rotate: 0, duration: 1.4, ease: 'power3.in' }, 5 + i * 0.08);
    });
    tl.to(lines, { p: 0, flow: 0, duration: 1.2, ease: 'power3.in', onUpdate: setLines }, 5.2)
      .to(hubCore, { scale: 1.25, boxShadow: '0 0 0 1px rgba(0,0,0,.5), 0 30px 100px 0 rgba(255,107,44,.55), inset 0 1px 0 rgba(255,255,255,.12)', duration: 0.6 }, 6.2)
      .to(hub.querySelector('.hub-label'), { scale: 1.12, duration: 0.6 }, 6.2)
      .to(foot, { opacity: 1, y: 0, duration: 0.8 }, 6.6)
      .to({}, { duration: 0.6 });
    return tl;
  };

  mm.add('(min-width: 900px)', () => {
    sec.classList.add('is-pinned');
    ScrollTrigger.refresh();
    build();
    const tl = buildTimeline({ trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.4, invalidateOnRefresh: true, onRefresh: build });
    return () => { tl.kill(); sec.classList.remove('is-pinned'); gsap.set([...frags, hub, hubCore, foot], { clearProps: 'all' }); };
  });

  mm.add('(max-width: 899px)', () => {
    build();
    const tl = buildTimeline({ trigger: stage, start: 'top 70%', toggleActions: 'play none none none', onRefresh: build });
    tl.timeScale(1.1);
    return () => { tl.kill(); gsap.set([...frags, hub, hubCore, foot], { clearProps: 'all' }); };
  });

  window.addEventListener('resize', () => requestAnimationFrame(build));
}
