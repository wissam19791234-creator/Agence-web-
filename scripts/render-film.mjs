// Exporte le film intégré en vrai MP4 (1080p 60 i/s, bande-son mixée).
// Usage : npm run film          → version courte de 30 s (celle du site)
//        npm run film -- --full → version longue de 60 s
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { renderSoundtrack } from './soundtrack.mjs';

// Structure musicale de la version courte (temps de sortie, en secondes)
const PLAN_30 = {
  introEnd: 6.5, introTicks: 3, drop: 7, beatEnd: 27, breaks: [], hatFrom: 9, fullFrom: 12.5, bigFrom: 20,
  padFrom: 7, brightFrom: 12.5, breakPad: null, melody: [21, 26.9], endAt: 27.05,
  risers: [[5.6, 1.4], [11.3, 1.2], [18.8, 1.2], [25.8, 1.2]],
  typing: [17.85, 18.65], camWhooshes: [10.8], toggleAt: 20.92,
  success: [-1, -1], chaos: [3, 6.5], toasts: [22.1, 25.7, 22.2], select: [-1, -1], achieveFrom: 27,
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'public/media');
const FPS = 60;
const FULL = process.argv.includes('--full');
const W = 1920;
const H = 1080;
mkdirSync(OUT, { recursive: true });
const only = process.argv.includes('--audio-only');

// Polices locales (le rendu doit être identique, avec ou sans accès à Google Fonts)
const F = resolve(root, 'node_modules/@fontsource');
const faces = [
  ['Syne', 'normal', 800, 'syne/files/syne-latin-800-normal.woff2'],
  ['Syne', 'normal', 700, 'syne/files/syne-latin-700-normal.woff2'],
  ['Syne', 'normal', 600, 'syne/files/syne-latin-600-normal.woff2'],
  ['IBM Plex Mono', 'normal', 400, 'ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2'],
  ['IBM Plex Mono', 'normal', 500, 'ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2'],
  ...[400, 500, 600, 700].map((w) => ['Inter Tight', 'normal', w, `inter-tight/files/inter-tight-latin-${w}-normal.woff2`]),
];

const server = await createServer({ root, logLevel: 'error', server: { port: 5188, strictPort: false, hmr: false, watch: null } });
await server.listen();
const url = `http://localhost:${server.config.server.port}/tools/film.html`;

const exe = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: exe, args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const css = faces.map(([f, s, w, file], i) => `@font-face{font-family:'${f}';font-style:${s};font-weight:${w};src:url(/__font/${i}.woff2) format('woff2')}`).join('\n');
await page.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: css, contentType: 'text/css' }));
await page.route('**/__font/*', (r) => {
  const i = +r.request().url().match(/(\d+)\.woff2/)[1];
  r.fulfill({ body: readFileSync(resolve(F, faces[i][3])), contentType: 'font/woff2' });
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.filmReady === true);
const DURATION = await page.evaluate((full) => (full ? 60 : window.filmCut.duration), FULL);
await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;caret-color:transparent!important}' });

const score = await page.evaluate((full) => (full ? window.film.score : window.film.cutScore), FULL);
writeFileSync(resolve(OUT, 'score.json'), JSON.stringify(score));

// ── Audio ──
console.log('Mixage de la bande-son…');
const wav = resolve(OUT, 'scalify-demo.wav');
await renderSoundtrack(score, wav, { duration: DURATION, root, ...(FULL ? {} : { plan: PLAN_30 }) });

if (!only) {
  // ── Images : 60 i/s natifs (mouvements parfaitement fluides, sans images fantômes) ──
  console.log('Capture des images…');
  const mp4 = resolve(OUT, 'scalify-demo.mp4');
  const ff = spawn(ffmpegPath, [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', wav,
    '-filter_complex', '[0:v]format=yuv420p[v]',
    '-map', '[v]', '-map', '1:a',
    '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-tune', 'animation', '-profile:v', 'high', '-g', '120',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', mp4,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = FPS * DURATION;
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await page.evaluate(([t, full]) => { window.film.tl.pause(); window.film.tl.seek(full ? t : window.filmCut.map(t), false); }, [i / FPS, FULL]);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: W, height: H } });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`  ${Math.round((i / total) * 100)} % (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));

  // Affiche (poster) et version légère pour mobile
  const still = (t, out, scale) => new Promise((r) => spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-ss', String(t), '-i', mp4, '-frames:v', '1', ...(scale ? ['-vf', `scale=${scale}`] : []), '-q:v', '3', out]).on('close', r));
  await still(FULL ? 2.9 : 9.4, resolve(OUT, 'scalify-demo-poster.jpg'), '1280:-2');
  await new Promise((r) => spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-i', mp4, '-vf', 'scale=960:-2,fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', resolve(OUT, 'scalify-demo-mobile.mp4')], { stdio: 'inherit' }).on('close', r));
  await new Promise((r) => spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-i', mp4, '-vf', 'scale=1280:-2,fps=30', '-c:v', 'libvpx-vp9', '-b:v', '1400k', '-deadline', 'good', '-cpu-used', '5', '-row-mt', '1', '-c:a', 'libopus', '-b:a', '128k', resolve(OUT, 'scalify-demo.webm')], { stdio: 'inherit' }).on('close', r));
  console.log('Film exporté :', mp4);
}

await browser.close();
await server.close();
