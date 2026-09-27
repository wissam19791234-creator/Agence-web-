// Bande-son du film, rendue hors ligne (48 kHz stéréo) :
// musique composée (Am–F–C–G, 120 BPM), batterie, basse en sidechain, arpège avec delay,
// pads, réverbération, impacts et whooshes de synthèse, sons d'interface CC0 (uisfx).
import { spawnSync } from 'node:child_process';
import { writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import ffmpegPath from 'ffmpeg-static';

const SR = 48000;
const TAU = Math.PI * 2;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function decode(file) {
  const r = spawnSync(ffmpegPath, ['-loglevel', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
  const f = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.byteLength / 4);
  const n = f.length / 2;
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = f[i * 2]; R[i] = f[i * 2 + 1]; }
  return { L, R, n };
}

class Bus {
  constructor(n) { this.L = new Float32Array(n); this.R = new Float32Array(n); this.n = n; }
  add(i, l, r) { if (i >= 0 && i < this.n) { this.L[i] += l; this.R[i] += r; } }
}

// Filtre biquad (RBJ) — coefficients recalculés à la demande
class Biquad {
  constructor() { this.x1 = this.x2 = this.y1 = this.y2 = 0; }
  set(type, f, q = 0.707) {
    const w = TAU * Math.min(f, SR * 0.45) / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
    else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
    else { b0 = a; b1 = 0; b2 = -a; } // passe-bande
    a0 = 1 + a; a1 = -2 * c; a2 = 1 - a;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
    return this;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

const noise = () => Math.random() * 2 - 1;
const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));
const panLR = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];

export async function renderSoundtrack(score, outFile, { duration = 60, root }) {
  const N = Math.ceil(SR * duration);
  const drums = new Bus(N), bass = new Bus(N), music = new Bus(N), sfx = new Bus(N), send = new Bus(N), dsend = new Bus(N);
  const S = (theme, name) => decode(resolve(root, `node_modules/uisfx/sounds/${theme}/${name}.mp3`));
  const smp = {
    drop: S('glass', 'drop'), notif: S('cinematic', 'notification'), receive: S('glass', 'receive'),
    select: S('studio', 'select'), step: S('studio', 'progress-step'), typing: S('studio', 'typing'),
    toggle: S('cinematic', 'toggle-on'), success: S('cinematic', 'success'), achievement: S('cinematic', 'achievement'),
    error: S('scifi', 'error'), warning: S('cinematic', 'warning'), open: S('cinematic', 'open'), press: S('cinematic', 'press'),
  };
  const place = (bus, s, t, gain = 1, pan = 0, rate = 1, sendAmt = 0.15) => {
    const [gl, gr] = panLR(pan);
    const start = Math.round(t * SR);
    const len = Math.floor(s.n / rate);
    for (let i = 0; i < len; i++) {
      const p = i * rate, j = Math.floor(p), fr = p - j;
      const l = (s.L[j] * (1 - fr) + (s.L[j + 1] || 0) * fr) * gain;
      const r = (s.R[j] * (1 - fr) + (s.R[j + 1] || 0) * fr) * gain;
      bus.add(start + i, l * gl * 1.4, r * gr * 1.4);
      send.add(start + i, l * sendAmt, r * sendAmt);
    }
  };

  // ───────── Batterie ─────────
  const kickAt = [];
  const kick = (t, v = 1) => {
    kickAt.push(t);
    const st = Math.round(t * SR), len = Math.round(0.45 * SR);
    let ph = 0;
    for (let i = 0; i < len; i++) {
      const tt = i / SR;
      const f = 45 + 110 * Math.exp(-tt * 28);
      ph += f / SR;
      const env = Math.exp(-tt * 9);
      const click = i < 90 ? noise() * 0.25 * (1 - i / 90) : 0;
      const x = (Math.sin(TAU * ph) * env * 0.95 + click) * v;
      drums.add(st + i, x, x);
    }
  };
  const clap = (t, v = 1) => {
    const bp = new Biquad().set('bp', 1500, 0.9);
    const st = Math.round(t * SR), len = Math.round(0.28 * SR);
    for (let i = 0; i < len; i++) {
      const tt = i / SR;
      const bursts = (tt < 0.01 || (tt > 0.012 && tt < 0.02) || tt > 0.024) ? 1 : 0.2;
      const x = bp.run(noise()) * Math.exp(-(tt > 0.024 ? tt - 0.024 : 0) * 18) * bursts * 0.9 * v;
      drums.add(st + i, x * 0.9, x);
      dsend.add(st + i, x * 0.35, x * 0.35);
    }
  };
  const hat = (t, v = 1, open = false) => {
    const hp = new Biquad().set('hp', 7200, 0.8);
    const st = Math.round(t * SR), len = Math.round((open ? 0.25 : 0.06) * SR);
    const pan = (Math.random() - 0.5) * 0.5;
    const [gl, gr] = panLR(pan);
    for (let i = 0; i < len; i++) {
      const x = hp.run(noise()) * Math.exp(-(i / SR) * (open ? 14 : 60)) * 0.28 * v;
      drums.add(st + i, x * gl, x * gr);
    }
  };

  // ───────── Instruments mélodiques ─────────
  const note = (bus, t, midi, dur, { vol = 0.2, cutoff = 1200, detune = [0, 7, -7], attack = 0.01, release = 0.25, pan = 0, fenv = 0, q = 0.8, sendAmt = 0.2, sub = 0 } = {}) => {
    const st = Math.round(t * SR), len = Math.round((dur + release) * SR);
    const fl = new Biquad(), fr = new Biquad();
    const phases = detune.map(() => Math.random());
    const freqs = detune.map((c) => mtof(midi) * Math.pow(2, c / 1200));
    let subPh = 0;
    for (let i = 0; i < len; i++) {
      const tt = i / SR;
      const env = tt < attack ? tt / attack : tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / release);
      if (i % 32 === 0) { const f = cutoff + fenv * Math.exp(-tt * 9); fl.set('lp', f, q); fr.set('lp', f * 1.03, q); }
      let l = 0, r = 0;
      for (let k = 0; k < freqs.length; k++) {
        phases[k] += freqs[k] / SR;
        const s = saw(phases[k]);
        const p = freqs.length > 1 ? (k / (freqs.length - 1)) * 2 - 1 : 0;
        l += s * (1 - p) * 0.5; r += s * (1 + p) * 0.5;
      }
      if (sub) { subPh += mtof(midi - 12) / SR; const sb = Math.sin(TAU * subPh) * sub; l += sb; r += sb; }
      const [gl, gr] = panLR(pan);
      const yl = fl.run(l / freqs.length) * env * vol * gl * 1.4, yr = fr.run(r / freqs.length) * env * vol * gr * 1.4;
      bus.add(st + i, yl, yr);
      send.add(st + i, yl * sendAmt, yr * sendAmt);
    }
  };

  // Harmonie : Am – F – C – G (2 s par accord)
  const prog = [
    { root: 45, tones: [57, 60, 64, 69] }, // Am
    { root: 41, tones: [53, 57, 60, 65] }, // F
    { root: 48, tones: [55, 60, 64, 67] }, // C
    { root: 43, tones: [55, 59, 62, 67] }, // G
  ];
  const chordAt = (t) => prog[Math.floor(Math.max(0, t - 8) / 2) % 4];
  const inBreak = (t) => (t >= 29.5 && t < 32.8) || (t >= 44.5 && t < 45.5) || t >= 55;

  // Intro : nappe grave qui monte + tic-tac
  note(music, 0.1, 33, 4.6, { vol: 0.35, cutoff: 180, fenv: 0, attack: 3.5, release: 0.15, detune: [0, 9, -9, 12], sub: 0.3 });
  for (let t = 0.1; t < 4.8; t += 0.5) place(sfx, smp.step, t, 0.35, 0, 1.6, 0.05);

  // Pads : accords tenus
  for (let t = 5.7; t < 55; t += 2) {
    if (t > 29.5 && t < 32.8) continue;
    const c = t < 8 ? prog[0] : chordAt(t);
    c.tones.slice(0, 3).forEach((m, k) => note(music, t, m, 1.9, { vol: 0.095, cutoff: t < 15 ? 1100 : 1900, attack: 0.35, release: 0.6, pan: (k - 1) * 0.5, sendAmt: 0.45 }));
  }
  // Break 29.5–32.8 : pad filtré seulement
  [57, 60, 64].forEach((m, k) => note(music, 29.6, m, 3, { vol: 0.08, cutoff: 500, attack: 0.8, release: 0.4, pan: (k - 1) * 0.6, sendAmt: 0.6 }));

  // Batterie + basse + arpège
  for (let t = 8; t < 55; t += 0.125) {
    if (inBreak(t)) continue;
    const step = Math.round((t - 8) / 0.125);
    const beatPos = step % 4; // 0 = temps
    const c = chordAt(t);
    if (beatPos === 0 && step % 8 === 0) kick(t);
    if (beatPos === 0 && step % 8 === 4) { kick(t, 0.9); if (t >= 15) clap(t, t >= 32.8 ? 1 : 0.7); }
    if (t >= 12 && beatPos === 2) hat(t, 0.8, t >= 32.8 && step % 16 === 14);
    if (t >= 15 && beatPos % 2 === 1) hat(t, 0.45);
    // basse : croches sur la fondamentale, octave sur le contretemps
    if (step % 2 === 0) {
      const off = step % 4 === 2 ? 12 : 0;
      note(bass, t, c.root + off, 0.2, { vol: 0.27, cutoff: 240, fenv: 900, q: 1.2, detune: [0, 6], attack: 0.004, release: 0.05, sendAmt: 0, sub: 0.32 });
    }
    // arpège en doubles croches
    if (t >= 15) {
      const pattern = [0, 1, 2, 3, 2, 1, 2, 0];
      const m = c.tones[pattern[step % 8]] + 12;
      note(music, t, m, 0.09, { vol: t >= 32.8 ? 0.075 : 0.055, cutoff: 900, fenv: 3200, q: 2, detune: [0, 5], attack: 0.002, release: 0.12, pan: step % 2 ? 0.45 : -0.45, sendAmt: 0.3 });
    }
  }
  // Mélodie principale (45.5–55)
  const motif = [[0, 76, 0.5], [0.5, 74, 0.25], [0.75, 72, 0.25], [1, 74, 0.75], [1.75, 69, 0.25]];
  for (let bar = 45.5; bar < 54.9; bar += 2) motif.forEach(([o, m, d]) => note(music, bar + o, m, d, { vol: 0.09, cutoff: 2600, fenv: 1500, detune: [0, 10, -10], attack: 0.01, release: 0.3, sendAmt: 0.4 }));
  // Fin : accord final ouvert
  [45, 57, 60, 64, 71].forEach((m, k) => note(music, 55.05, m, 3.8, { vol: m < 50 ? 0.2 : 0.07, cutoff: 1800, attack: 0.05, release: 1.1, pan: (k - 2) * 0.3, sendAmt: 0.6, sub: m < 50 ? 0.4 : 0 }));

  // ───────── Effets de synthèse ─────────
  const whoosh = (t, dur = 0.45, v = 1) => {
    const bp = new Biquad(), bp2 = new Biquad();
    const st = Math.round((t - dur * 0.75) * SR), len = Math.round(dur * 1.2 * SR);
    for (let i = 0; i < len; i++) {
      const x = i / len;
      if (i % 32 === 0) { const f = 250 * Math.pow(28, x); bp.set('bp', f, 1.1); bp2.set('bp', f * 1.9, 2); }
      const env = x < 0.7 ? Math.pow(x / 0.7, 2.2) : Math.exp(-(x - 0.7) * 14);
      const n = noise();
      const y = (bp.run(n) + bp2.run(n) * 0.5) * env * 0.9 * v;
      const p = -0.8 + x * 1.6; const [gl, gr] = panLR(p);
      sfx.add(st + i, y * gl, y * gr);
      send.add(st + i, y * 0.2, y * 0.2);
    }
  };
  const impact = (t, v = 1) => {
    kick(t, 1.25 * v);
    const lp = new Biquad();
    const st = Math.round(t * SR), len = Math.round(1.8 * SR);
    let ph = 0;
    for (let i = 0; i < len; i++) {
      const tt = i / SR;
      if (i % 32 === 0) lp.set('lp', 4000 * Math.exp(-tt * 3) + 60, 0.7);
      ph += (38 + 30 * Math.exp(-tt * 6)) / SR;
      const y = (lp.run(noise()) * 0.55 * Math.exp(-tt * 2.6) + Math.sin(TAU * ph) * 0.5 * Math.exp(-tt * 2.2)) * v;
      sfx.add(st + i, y, y);
      send.add(st + i, y * 0.35, y * 0.35);
    }
  };
  const riser = (t, dur) => {
    const bp = new Biquad();
    const st = Math.round(t * SR), len = Math.round(dur * SR);
    let ph = 0;
    for (let i = 0; i < len; i++) {
      const x = i / len;
      if (i % 32 === 0) bp.set('bp', 300 * Math.pow(25, x), 1.6);
      ph += (110 * Math.pow(4, x)) / SR;
      const y = (bp.run(noise()) * 0.5 + saw(ph) * 0.06) * Math.pow(x, 2) * 0.8;
      sfx.add(st + i, y, y);
      send.add(st + i, y * 0.3, y * 0.3);
    }
  };
  [[3.4, 1.4], [13.6, 1.25], [28.4, 1.1], [31.4, 1.35], [43.4, 1.6], [53.4, 1.6]].forEach(([t, d]) => riser(t, d));

  // ───────── Événements du montage ─────────
  const hits = score.filter((e) => e.hit);
  for (const e of hits) {
    const t = e.t;
    if (e.type === 'impact') impact(t);
    else if (e.type === 'whoosh') whoosh(t, e.arg || 0.45, 0.9);
    else if (e.type === 'kick') {
      if (Math.abs(t - 34.72) < 0.05) place(sfx, smp.toggle, t, 0.9, 0.2);
      else if (t > 20 && t < 30) place(sfx, smp.success, t, 0.8, 0.1);
      else { kick(t, 1.1); clap(t, 0.5); }
    } else if (e.type === 'tick') place(sfx, smp.step, t, 0.55, (t % 2) - 0.5, 1.2);
    else if (e.type === 'pop') {
      if (t < 5) place(sfx, Math.random() < 0.3 ? smp.error : smp.drop, t, 0.32, (Math.random() - 0.5) * 1.4, 0.9 + Math.random() * 0.3);
      else if (t > 35.9 && t < 39.5) place(sfx, smp.receive, t, 0.45, 0.4, 1 + (t - 36) * 0.06);
      else if (t > 32 && t < 34) place(sfx, smp.select, t, 0.6, -0.3);
      else if (t > 55) place(sfx, smp.achievement, t, 0.75);
      else place(sfx, smp.notif, t, 0.55, 0.3);
    }
  }
  // frappe au clavier de l'assistant (25.35 → 26.15)
  for (let t = 25.35; t < 26.15; t += 0.055 + Math.random() * 0.02) place(sfx, smp.typing, t, 0.5, 0.25, 0.9 + Math.random() * 0.25, 0.05);
  // coups de caméra vers les KPI / graphique / insight
  [9.5, 11.15, 12.55, 13.85].forEach((t) => whoosh(t + 0.35, 0.5, 0.7));

  // ───────── Réverbération (Freeverb simplifié) + delay ping-pong ─────────
  const reverb = (inL, inR, outL, outR, room = 0.84, damp = 0.3, wet = 1) => {
    const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round(d * SR / 44100));
    const aps = [556, 441, 341, 225].map((d) => Math.round(d * SR / 44100));
    for (const [inp, out, spread] of [[inL, outL, 0], [inR, outR, 23]]) {
      const cb = combs.map((d) => ({ buf: new Float32Array(d + spread), i: 0, f: 0 }));
      const ab = aps.map((d) => ({ buf: new Float32Array(d + spread), i: 0 }));
      for (let n = 0; n < inp.length; n++) {
        const x = inp[n] * 0.015;
        let y = 0;
        for (const c of cb) {
          const o = c.buf[c.i];
          c.f = o * (1 - damp) + c.f * damp;
          c.buf[c.i] = x + c.f * room;
          c.i = (c.i + 1) % c.buf.length;
          y += o;
        }
        for (const a of ab) {
          const o = a.buf[a.i];
          a.buf[a.i] = y + o * 0.5;
          a.i = (a.i + 1) % a.buf.length;
          y = o - y;
        }
        out[n] += y * wet;
      }
    }
  };
  const rev = new Bus(N);
  reverb(send.L, send.R, rev.L, rev.R);
  const dly = new Bus(N);
  const D = Math.round(0.375 * SR);
  for (let i = 0; i < N; i++) {
    const inL = dsend.L[i] + music.L[i] * 0.12, inR = dsend.R[i] + music.R[i] * 0.12;
    dly.L[i] = inL + (i >= D ? dly.R[i - D] * 0.42 : 0);
    dly.R[i] = inR * 0.2 + (i >= D ? dly.L[i - D] * 0.42 : 0);
  }

  // ───────── Mixage : sidechain de la basse et des pads sur la grosse caisse ─────────
  kickAt.sort((a, b) => a - b);
  const out = new Float32Array(N * 2);
  let k = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    while (k + 1 < kickAt.length && kickAt[k + 1] <= t) k++;
    const since = kickAt[k] <= t ? t - kickAt[k] : 10;
    const duck = 1 - 0.7 * Math.exp(-since / 0.11);
    const fade = t > duration - 1.2 ? Math.max(0, (duration - t) / 1.2) : 1;
    let l = drums.L[i] * 0.85 + bass.L[i] * duck * 0.8 + music.L[i] * (0.4 + 0.6 * duck) * 0.8 + sfx.L[i] * 0.85 + rev.L[i] * 0.55 + (dly.L[i] - dsend.L[i] - music.L[i] * 0.12) * 0.3;
    let r = drums.R[i] * 0.85 + bass.R[i] * duck * 0.8 + music.R[i] * (0.4 + 0.6 * duck) * 0.8 + sfx.R[i] * 0.85 + rev.R[i] * 0.55 + (dly.R[i] - dsend.R[i] * 0.2 - music.R[i] * 0.024) * 0.3;
    out[i * 2] = Math.tanh(l * 1.1) * fade;
    out[i * 2 + 1] = Math.tanh(r * 1.1) * fade;
  }

  // Écriture WAV 32 bits flottant puis mastering ffmpeg (EQ légère, compression, -14 LUFS)
  const raw = outFile.replace(/\.wav$/, '.raw.wav');
  const header = Buffer.alloc(44);
  const bytes = out.length * 4;
  header.write('RIFF', 0); header.writeUInt32LE(36 + bytes, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(3, 20); header.writeUInt16LE(2, 22);
  header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 8, 28); header.writeUInt16LE(8, 32); header.writeUInt16LE(32, 34);
  header.write('data', 36); header.writeUInt32LE(bytes, 40);
  writeFileSync(raw, Buffer.concat([header, Buffer.from(out.buffer)]));
  const r = spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', '-i', raw,
    '-af', 'highpass=f=32,equalizer=f=90:t=q:w=1:g=-2,equalizer=f=3500:t=q:w=1:g=2,acompressor=threshold=-16dB:ratio=3:attack=8:release=120:makeup=2,loudnorm=I=-14:TP=-1.2:LRA=9,aresample=48000',
    '-c:a', 'pcm_s16le', outFile], { stdio: 'inherit' });
  if (r.status !== 0) renameSync(raw, outFile);
  else unlinkSync(raw);
  return outFile;
}
