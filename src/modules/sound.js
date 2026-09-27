// Bande-son du film générée en direct (Web Audio) : aucun fichier à charger.
// 120 BPM — les événements sont planifiés à partir du temps de la timeline.

export function createSoundtrack() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  let ctx = null;
  let master = null;
  let noise = null;
  let muted = false;

  const ensure = () => {
    if (ctx) return ctx;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.32;
    master.connect(comp).connect(ctx.destination);
    const len = ctx.sampleRate * 1.5;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  };

  const env = (g, t, peak, attack, decay) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  };
  const noiseSrc = (t, dur) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.start(t, Math.random() * 0.5, dur + 0.05);
    return s;
  };

  const voices = {
    kick(t, v = 1) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
      env(g, t, 0.95 * v, 0.004, 0.34);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.4);
    },
    hat(t, v = 1) {
      const s = noiseSrc(t, 0.06);
      const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 7500;
      const g = ctx.createGain();
      env(g, t, 0.18 * v, 0.002, 0.05);
      s.connect(f).connect(g).connect(master);
    },
    clap(t) {
      const s = noiseSrc(t, 0.2);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1600; f.Q.value = 0.8;
      const g = ctx.createGain();
      env(g, t, 0.45, 0.003, 0.16);
      s.connect(f).connect(g).connect(master);
    },
    bass(t, freq = 55, dur = 0.42) {
      const o = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = freq;
      f.type = 'lowpass'; f.frequency.setValueAtTime(420, t); f.frequency.exponentialRampToValueAtTime(120, t + dur);
      env(g, t, 0.34, 0.01, dur);
      o.connect(f).connect(g).connect(master);
      o.start(t); o.stop(t + dur + 0.05);
    },
    tick(t) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 2400;
      env(g, t, 0.06, 0.001, 0.025);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.05);
    },
    pop(t) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1320, t + 0.06);
      env(g, t, 0.12, 0.003, 0.09);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.12);
    },
    whoosh(t, dur = 0.45) {
      const s = noiseSrc(t, dur);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(master);
    },
    riser(t, dur = 1.5) {
      const s = noiseSrc(t, dur);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.Q.value = 2;
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + dur);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.02);
      s.connect(f).connect(g).connect(master);
    },
    impact(t) {
      voices.kick(t, 1.2);
      const s = noiseSrc(t, 1.2);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.setValueAtTime(3000, t); f.frequency.exponentialRampToValueAtTime(80, t + 1.1);
      const g = ctx.createGain();
      env(g, t, 0.5, 0.005, 1.1);
      s.connect(f).connect(g).connect(master);
    },
    drone(t, dur = 5) {
      [55, 55.4, 82.4].forEach((fr) => {
        const o = ctx.createOscillator();
        const f = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = fr;
        f.type = 'lowpass'; f.frequency.setValueAtTime(150, t); f.frequency.linearRampToValueAtTime(900, t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.09, t + dur * 0.9);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(f).connect(g).connect(master);
        o.start(t); o.stop(t + dur + 0.05);
      });
    },
    pad(t, dur = 5) {
      [220, 277.2, 329.6, 440].forEach((fr, i) => {
        const o = ctx.createOscillator();
        const f = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = (i % 2 ? 7 : -7);
        f.type = 'lowpass'; f.frequency.value = 1400;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.05, t + 0.8);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(f).connect(g).connect(master);
        o.start(t); o.stop(t + dur + 0.05);
      });
    },
  };

  return {
    unlock() { ensure(); if (ctx.state === 'suspended') ctx.resume(); },
    play(type, when, arg) {
      if (!ctx || muted) return;
      const fn = voices[type];
      if (fn) fn(Math.max(ctx.currentTime, when), arg);
    },
    now() { return ctx ? ctx.currentTime : 0; },
    setMuted(m) {
      muted = m;
      if (master) master.gain.setTargetAtTime(m ? 0 : 0.32, ctx.currentTime, 0.05);
    },
    get muted() { return muted; },
  };
}

/** Partition : liste d'événements { t, type, arg } triés par temps. */
export function buildScore(hits = []) {
  const ev = [];
  const add = (t, type, arg) => ev.push({ t, type, arg });
  // Intro : horloge + tension
  for (let t = 0.1; t < 4.8; t += 0.5) add(t, 'tick');
  add(0.2, 'drone', 4.7);
  add(3.4, 'riser', 1.4);
  // Beat principal
  const bassline = [55, 55, 65.4, 49];
  for (let t = 8; t < 55; t += 0.5) {
    const beat = Math.round((t - 8) / 0.5);
    const inBreak = (t >= 29.5 && t < 32.8) || (t >= 44.5 && t < 45.5);
    if (inBreak) continue;
    if (beat % 2 === 0) add(t, 'kick');
    if (t >= 15) add(t + 0.25, 'hat', 0.8);
    if (t >= 33 && beat % 4 === 2) add(t, 'clap');
    if (beat % 2 === 0) add(t, 'bass', bassline[Math.floor(beat / 8) % bassline.length]);
  }
  for (let t = 5.2; t < 8; t += 1) add(t, 'hat', 0.5);
  // Montées avant chaque chapitre
  add(13.6, 'riser', 1.4);
  add(28.4, 'riser', 1.5);
  add(43.4, 'riser', 1.5);
  add(53.4, 'riser', 1.5);
  add(55, 'pad', 5);
  hits.forEach((h) => add(h.t, h.type, h.arg));
  return ev.sort((a, b) => a.t - b.t);
}
