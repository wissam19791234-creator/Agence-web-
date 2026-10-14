// Visuels 3D de démonstration, rendus hors ligne avec three.js.
// Ils remplacent les photos tant que Maison EL Events n'a pas fourni les siennes.
// Lancement : node scripts/render3d/render.cjs  (voir README).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* ───────────── Outils ───────────── */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
let R = rng(7);
const rr = (a, b) => a + (b - a) * R();
const V2 = (x, y) => new THREE.Vector2(x, y);
const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([x, y]) => V2(x, y)), seg);
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = shadow; o.receiveShadow = true; return o; };
const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/* ───────────── Matières ───────────── */
function materials() {
  const std = (color, roughness = 0.6, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const linen = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#ececec'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(0,0,0,${R() * 0.035})`; g.fillRect(R() * w, R() * h, R() * 40, 1); g.fillRect(R() * w, R() * h, 1, R() * 40); }
  });
  linen.wrapS = linen.wrapT = THREE.RepeatWrapping; linen.repeat.set(6, 6);
  const wood = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#4a3526'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(${R() > 0.5 ? '255,230,200' : '0,0,0'},${R() * 0.08})`; g.fillRect(0, y + Math.sin(y * 0.05) * 3, w, 2); }
  });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0, transmission: 1, thickness: 0.003, ior: 1.5, specularIntensity: 1, envMapIntensity: 1.4 });
  const flame = new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 6.2, 3.2) });
  return {
    cloth: std(0xf4ede3, 0.92, 0, { map: linen }),
    clothDark: std(0x2a1d24, 0.95, 0, { map: linen }),
    porcelain: new THREE.MeshPhysicalMaterial({ color: 0xfbf8f3, roughness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.15 }),
    charger: std(0xd9b46a, 0.32, 1, { envMapIntensity: 5 }),
    silver: std(0xe6d3a8, 0.24, 1, { envMapIntensity: 5 }),
    brass: std(0xd9b46a, 0.28, 1, { envMapIntensity: 6 }),
    glass,
    glassFrost: new THREE.MeshPhysicalMaterial({ color: 0xfff6ea, roughness: 0.25, transmission: 1, thickness: 0.004, ior: 1.5 }),
    wax: std(0xf7efe2, 0.5, 0, { emissive: 0x3a2410 }),
    wick: std(0x111111, 0.9),
    flame,
    petal: std(0xffffff, 0.6, 0, { side: THREE.DoubleSide, emissive: 0x140a0a }),
    leaf: std(0x5f7f4f, 0.55, 0, { side: THREE.DoubleSide }),
    euca: std(0x8eaa98, 0.6, 0, { side: THREE.DoubleSide }),
    paper: std(0xfbf7ef, 0.85),
    floor: std(0x1b130e, 0.38),
    wood: std(0xffffff, 0.62, 0, { map: wood }),
    white: std(0xf3eee6, 0.55),
    gold: std(0xcfa65a, 0.35, 0.7, { envMapIntensity: 4 }),
    black: std(0x0d0b0c, 0.5),
    drape: std(0xf1d9d6, 0.9, 0, { side: THREE.DoubleSide, map: linen }),
    burgundy: std(0x6a1a2e, 0.85, 0, { side: THREE.DoubleSide, map: linen }),
    emerald: std(0x123a2e, 0.85, 0, { side: THREE.DoubleSide, map: linen }),
    velvet: std(0xf0e6d6, 0.95, 0, { map: linen }),
    blush: std(0xe7a2b0, 0.9, 0, { map: linen }),
    sage: std(0x9db49a, 0.9, 0, { map: linen }),
    rose: std(0xa82e4f, 0.85, 0, { side: THREE.DoubleSide, map: linen }),
    bulb: new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 2.9, 1.6) }),
  };
}
// Palettes de roses : poudré (tables), vif (coin mariés, arche).
const PALETTES = {
  soft: [0xf6c9cf, 0xf9e4dc, 0xf2b8c2, 0xfbf3ea, 0xf6c6a0],
  vivid: [0xe0507e, 0xf2b8c2, 0xb0304e, 0xf6c6a0, 0xfbf3ea, 0xd8487a],
  white: [0xfbf3ea, 0xf9e4dc, 0xffffff, 0xf6c9cf],
};
let MT;

/* ───────────── Objets ───────────── */
function wineGlass(h = 0.2, r = 0.04) {
  const p = [[0, 0], [r * 0.9, 0.001], [r * 0.9, 0.004], [0.006, 0.006], [0.0045, h * 0.42], [r * 0.55, h * 0.5], [r, h * 0.72], [r * 0.86, h], [r * 0.84, h], [r * 0.97, h * 0.72], [r * 0.52, h * 0.52], [0.0025, h * 0.45], [0, h * 0.45]];
  return mesh(lathe(p, 40), MT.glass, false);
}
function tumbler(h = 0.11, r = 0.034) {
  const p = [[0, 0], [r * 0.92, 0], [r, 0.006], [r * 1.06, h], [r * 1.02, h], [r * 0.96, 0.012], [0, 0.012]];
  return mesh(lathe(p, 40), MT.glass, false);
}
function plateGeo(r = 0.13) {
  return lathe([[0, 0.002], [r * 0.62, 0.002], [r * 0.95, 0.016], [r, 0.018], [r, 0.014], [r * 0.6, 0], [0, 0]], 56);
}
function candle(h = 0.25, r = 0.0105, lit = true) {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(r, r, h, 24), MT.wax), 0, h / 2, 0));
  if (lit) {
    g.add(at(mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 0.012, 6), MT.wick, false), 0, h + 0.005, 0));
    const f = mesh(new THREE.SphereGeometry(0.0055, 16, 12), MT.flame, false);
    f.scale.set(1, 2.7, 1); f.position.set(0, h + 0.022, 0); g.add(f);
  }
  return g;
}
function candleLight(parent, x, y, z, intensity = 0.5) {
  const l = new THREE.PointLight(0xffb46b, intensity, 4, 2); l.position.set(x, y, z); parent.add(l); return l;
}
function taperHolder(h = 0.22) {
  const g = new THREE.Group();
  g.add(mesh(lathe([[0, 0], [0.04, 0], [0.04, 0.006], [0.012, 0.016], [0.008, h * 0.4], [0.014, h * 0.46], [0.007, h * 0.52], [0.007, h - 0.02], [0.016, h - 0.006], [0.016, h], [0, h]], 32), MT.brass));
  const c = candle(0.24); c.position.y = h - 0.004; g.add(c);
  g.userData.flameY = h + 0.24 + 0.02;
  return g;
}
function floorCandelabra(h = 1.15) {
  // Bougeoir sur pied de plus d'un mètre (coin mariés).
  const g = new THREE.Group();
  g.add(mesh(lathe([[0, 0], [0.2, 0], [0.2, 0.016], [0.07, 0.06], [0.03, 0.14], [0.024, h * 0.5], [0.042, h * 0.53], [0.024, h * 0.56], [0.022, h - 0.07], [0.08, h - 0.02], [0.085, h], [0, h]], 40), MT.brass));
  const c = candle(0.22, 0.042); c.position.y = h; g.add(c);
  c.children[2].scale.set(1.6, 3.4, 1.6);
  g.userData.flameY = h + 0.25;
  return g;
}
function votive() {
  const g = new THREE.Group();
  g.add(mesh(lathe([[0, 0], [0.028, 0], [0.03, 0.065], [0.027, 0.065], [0.025, 0.006], [0, 0.006]], 32), MT.glassFrost, false));
  const c = candle(0.02, 0.019); c.position.y = 0.006; g.add(c);
  return g;
}

let roseGeo;
function makeRoseGeo() {
  // Pétales courbes disposés en spirale, de plus en plus ouverts vers l'extérieur.
  const parts = [];
  const layers = [[0.012, 0.022, 3, 0.05], [0.017, 0.028, 4, 0.25], [0.022, 0.032, 5, 0.55], [0.027, 0.034, 6, 0.85], [0.031, 0.033, 7, 1.15]];
  layers.forEach(([w, h, n, tilt], li) => {
    for (let i = 0; i < n; i++) {
      const g = new THREE.PlaneGeometry(w, h, 6, 6);
      const p = g.attributes.position, cup = w * 0.55;
      for (let k = 0; k < p.count; k++) {
        const x = p.getX(k), y = p.getY(k) + h / 2, a = x / cup, t = y / h;
        p.setXYZ(k, Math.sin(a) * cup * (1 - 0.15 * t), y, (1 - Math.cos(a)) * cup - t * t * w * 0.35 * (li / 4));
      }
      g.computeVertexNormals();
      g.rotateX(-tilt);
      g.translate(0, 0, -0.004 - li * 0.0035);
      g.rotateY((i / n) * Math.PI * 2 + li * 0.9);
      parts.push(g.toNonIndexed());
    }
  });
  const core = new THREE.SphereGeometry(0.008, 10, 8); core.scale(1, 1.4, 1); core.translate(0, 0.012, 0);
  parts.push(core.toNonIndexed());
  const m = mergeGeometries(parts);
  m.translate(0, -0.015, 0);
  return m;
}
/** Bouquet : roses, feuilles et branches d'eucalyptus en instances. */
function bouquet(parent, cx, cy, cz, radius = 0.18, count = 18, seed = 1, spreadY = 0.05, scale = 1, face = 0, palette = 'soft') {
  const r0 = R; R = rng(seed);
  roseGeo ||= makeRoseGeo();
  const roses = new THREE.InstancedMesh(roseGeo, MT.petal, count);
  const d = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const a = R() * Math.PI * 2, rad = Math.sqrt(R()) * radius;
    const x = cx + Math.cos(a) * rad, z = cz + Math.sin(a) * rad * 0.8;
    const y = cy + (1 - rad / radius) * spreadY + rr(-0.01, 0.01);
    d.position.set(x, y, z);
    d.rotation.set(face + rr(-0.5, 0.5) + (x - cx) * 2, R() * 6, rr(-0.5, 0.5) + (z - cz) * 2);
    const s = rr(0.8, 1.35) * scale; d.scale.set(s, s, s); d.updateMatrix();
    roses.setMatrixAt(i, d.matrix);
    const pal = PALETTES[palette]; col.setHex(pal[Math.floor(R() * pal.length)]).offsetHSL(rr(-0.01, 0.01), rr(-0.05, 0.05), rr(-0.04, 0.03)); roses.setColorAt(i, col);
  }
  roses.castShadow = true; roses.receiveShadow = true; parent.add(roses);
  const leafG = new THREE.SphereGeometry(0.018, 10, 6); leafG.scale(1, 0.12, 0.42);
  const n2 = Math.round(count * 2.2);
  const leaves = new THREE.InstancedMesh(leafG, MT.leaf, n2);
  for (let i = 0; i < n2; i++) {
    const a = R() * Math.PI * 2, rad = radius * rr(0.75, 1.35);
    d.position.set(cx + Math.cos(a) * rad, cy + rr(-0.03, 0.03), cz + Math.sin(a) * rad * 0.8);
    d.rotation.set(rr(-0.4, 0.4), -a, rr(-0.6, 0.2)); const s = rr(0.8, 1.6) * scale; d.scale.set(s, s, s); d.updateMatrix();
    leaves.setMatrixAt(i, d.matrix);
  }
  leaves.castShadow = true; leaves.receiveShadow = true; parent.add(leaves);
  R = r0;
}
/** Guirlande d'eucalyptus le long d'une ligne. */
function garland(parent, x0, z0, x1, z1, y, n = 260, seed = 3) {
  const r0 = R; R = rng(seed);
  const g = new THREE.SphereGeometry(0.016, 10, 6); g.scale(1, 0.12, 0.7);
  const m = new THREE.InstancedMesh(g, MT.euca, n);
  const d = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const t = R();
    const off = Math.sin(t * 40) * 0.05 + rr(-0.06, 0.06);
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L;
    d.position.set(x0 + dx * t + nx * off, y + rr(0.002, 0.03), z0 + dz * t + nz * off);
    d.rotation.set(rr(-0.6, 0.6), R() * 6, rr(-0.6, 0.6)); const s = rr(0.6, 1.3); d.scale.set(s, s, s); d.updateMatrix();
    m.setMatrixAt(i, d.matrix);
  }
  m.castShadow = true; m.receiveShadow = true; parent.add(m);
  R = r0;
}

let chairGeo;
function makeChairGeo() {
  const parts = [];
  const leg = (x, z, h, tilt = 0) => { const g = new THREE.CylinderGeometry(0.011, 0.009, h, 10); g.rotateX(tilt); g.translate(x, h / 2, z); return g; };
  parts.push(leg(-0.19, 0.18, 0.45), leg(0.19, 0.18, 0.45), leg(-0.19, -0.18, 0.92, -0.05), leg(0.19, -0.18, 0.92, -0.05));
  const seat = new RoundedBoxGeometry(0.44, 0.045, 0.42, 3, 0.015); seat.translate(0, 0.46, 0); parts.push(seat);
  for (let i = -2; i <= 2; i++) { const s = new THREE.CylinderGeometry(0.007, 0.007, 0.38, 8); s.translate(i * 0.075, 0.68, -0.2); parts.push(s); }
  [0.88, 0.62].forEach((y) => { const b = new THREE.CylinderGeometry(0.012, 0.012, 0.4, 10); b.rotateZ(Math.PI / 2); b.translate(0, y, -0.2); parts.push(b); });
  return mergeGeometries(parts.map((g) => g.toNonIndexed()));
}
function chair() { chairGeo ||= makeChairGeo(); return mesh(chairGeo, MT.gold); }

let cardTex;
function card() {
  cardTex ||= canvasTex(256, 384, (g, w, h) => {
    g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8c8c8c'; g.lineWidth = 2; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#1a1a1a'; g.textAlign = 'center';
    g.font = 'italic 52px Georgia, "DejaVu Serif", serif'; g.fillText('Bienvenue', w / 2, h * 0.46);
    g.fillRect(w / 2 - 30, h * 0.53, 60, 2);
    g.font = '20px Georgia, "DejaVu Serif", serif'; g.fillText('M A I S O N   E L', w / 2, h * 0.66);
  });
  const m = [MT.paper, MT.paper, MT.paper, MT.paper, new THREE.MeshStandardMaterial({ map: cardTex, roughness: 0.85 }), MT.paper];
  const o = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.128, 0.001), m); o.castShadow = true; o.receiveShadow = true;
  return o;
}

function placeSetting(withCard = true) {
  const g = new THREE.Group();
  g.add(at(mesh(lathe([[0, 0.001], [0.16, 0.001], [0.165, 0.008], [0.158, 0.009], [0, 0.004]], 56), MT.charger), 0, 0, 0));
  g.add(at(mesh(plateGeo(0.125), MT.porcelain), 0, 0.006, 0));
  g.add(at(mesh(plateGeo(0.085), MT.porcelain), 0, 0.02, 0));
  const nap = mesh(new RoundedBoxGeometry(0.11, 0.018, 0.16, 2, 0.008), MT.cloth); nap.position.set(0, 0.04, 0.01); g.add(nap);
  if (withCard) { const c = card(); c.position.set(0, 0.107, -0.02); c.rotation.x = -0.32; g.add(c); }
  const fork = mesh(new RoundedBoxGeometry(0.016, 0.004, 0.19, 2, 0.002), MT.silver); fork.position.set(-0.2, 0.004, 0.0); g.add(fork);
  const knife = mesh(new RoundedBoxGeometry(0.014, 0.004, 0.21, 2, 0.002), MT.silver); knife.position.set(0.2, 0.004, 0.0); g.add(knife);
  const w1 = wineGlass(0.2, 0.04); w1.position.set(0.17, 0, -0.19); g.add(w1);
  const w2 = wineGlass(0.17, 0.034); w2.position.set(0.25, 0, -0.12); g.add(w2);
  return g;
}

function hangingCloth(width, height, folds = 22, depth = 0.025, seg = 260) {
  const g = new THREE.PlaneGeometry(width, height, seg, 12);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const t = (x / width + 0.5) * folds * Math.PI * 2;
    p.setZ(i, Math.sin(t) * depth * (0.7 + 0.3 * Math.sin(t * 0.37 + y)) + Math.sin(t * 2.3) * depth * 0.25);
  }
  g.computeVertexNormals();
  return g;
}

/** Table nappée : plateau, retombées plissées. Origine au sol, au centre. */
function clothedTable(len, wid, h = 0.76, mat = MT.cloth) {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.BoxGeometry(wid + 0.04, 0.02, len + 0.04), mat), 0, h, 0));
  const side = (w, x, z, ry) => { const m = mesh(hangingCloth(w, h, Math.round(w * 9), 0.02), mat); m.position.set(x, h / 2, z); m.rotation.y = ry; g.add(m); };
  side(len + 0.04, wid / 2 + 0.03, 0, Math.PI / 2); side(len + 0.04, -wid / 2 - 0.03, 0, -Math.PI / 2);
  side(wid + 0.06, 0, len / 2 + 0.03, 0); side(wid + 0.06, 0, -len / 2 - 0.03, Math.PI);
  return g;
}

/** Guirlandes lumineuses lointaines : elles deviennent des halos flous (bokeh). */
function fairyLights(parent, { z = -9, y = 3.2, width = 14, strings = 4, per = 34, sag = 0.7, spread = 3 } = {}) {
  const geo = new THREE.SphereGeometry(0.03, 8, 6);
  const total = strings * per;
  const m = new THREE.InstancedMesh(geo, MT.bulb, total);
  const d = new THREE.Object3D(); let k = 0;
  for (let s = 0; s < strings; s++) {
    const zz = z - s * spread * 0.6 + rr(-0.5, 0.5), yy = y + rr(-0.3, 0.5);
    for (let i = 0; i < per; i++) {
      const t = i / (per - 1);
      d.position.set((t - 0.5) * width, yy - sag * 4 * t * (1 - t) + rr(-0.03, 0.03), zz + rr(-0.2, 0.2));
      d.scale.setScalar(rr(0.8, 1.3)); d.updateMatrix(); m.setMatrixAt(k++, d.matrix);
    }
  }
  parent.add(m);
}

function floor(scene, mat = MT.floor, size = 60) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f);
}
function spot(scene, pos, target, lux, angle = 0.5, penumbra = 0.8, shadow = true) {
  const d2 = (pos[0] - target[0]) ** 2 + (pos[1] - target[1]) ** 2 + (pos[2] - target[2]) ** 2;
  const l = new THREE.SpotLight(0xffe4c4, lux * d2, 0, angle, penumbra, 2);
  l.position.set(...pos); l.target.position.set(...target);
  if (shadow) { l.castShadow = true; l.shadow.mapSize.set(2048, 2048); l.shadow.bias = -0.0002; l.shadow.normalBias = 0.01; l.shadow.camera.near = 0.5; l.shadow.camera.far = 20; }
  scene.add(l, l.target); return l;
}

/* ───────────── Scènes ───────────── */
function receptionHall() {
  const s = new THREE.Scene();
  floor(s);
  const tables = [-2.7, 0, 2.7];
  tables.forEach((tx, ti) => {
    const len = 7.2, wid = 1.1, h = 0.76;
    const t = clothedTable(len, wid, h); t.position.set(tx, 0, -2.6); s.add(t);
    garland(s, tx, 0.9, tx, -6.1, h + 0.01, 420, 10 + ti);
    for (let i = 0; i < 10; i++) {
      const z = 0.55 - i * 0.68;
      [-1, 1].forEach((side) => {
        const ps = placeSetting(ti === 1); ps.position.set(tx + side * 0.36, h + 0.01, z); ps.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; s.add(ps);
        const c = chair(); c.position.set(tx + side * 0.78, 0, z); c.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; s.add(c);
      });
    }
    for (let i = 0; i < 5; i++) {
      const z = 0.25 - i * 1.4;
      bouquet(s, tx, h + 0.06, z, 0.16, 16, 100 + i + ti * 10, 0.06);
      [[-0.09, 0.22], [0.1, 0.3], [0.0, 0.26]].forEach(([dx, hh], k) => {
        const th = taperHolder(hh); th.position.set(tx + dx, h + 0.01, z + (k - 1) * 0.3 + 0.15); s.add(th);
        if (ti === 1 && k === 1) candleLight(s, tx + dx, h + th.userData.flameY, z + 0.15, 0.6);
      });
      const v = votive(); v.position.set(tx + 0.12, h + 0.01, z - 0.55); s.add(v);
      const v2 = votive(); v2.position.set(tx - 0.1, h + 0.01, z + 0.6); s.add(v2);
    }
  });
  fairyLights(s, { z: -10, y: 3.4, width: 16, strings: 5, per: 40 });
  fairyLights(s, { z: -16, y: 4.5, width: 22, strings: 4, per: 50, sag: 1 });
  spot(s, [0.6, 5.5, 1.8], [0, 0.76, -1.8], 1.25, 0.4, 0.95);
  spot(s, [-2.8, 5.5, 0.5], [-2.7, 0.76, -3], 0.45, 0.45, 0.95, false);
  spot(s, [2.9, 5.5, 0.5], [2.7, 0.76, -3], 0.45, 0.45, 0.95, false);
  s.add(new THREE.HemisphereLight(0xffe9d6, 0x1a1012, 0.08));
  return s;
}

/** Drap posé sur l'assise puis retombant devant le canapé. */
function drapedThrow(width, seatDepth, drop, y0, z0) {
  const r = 0.06, arc = (Math.PI / 2) * r, L = seatDepth + arc + drop;
  const g = new THREE.PlaneGeometry(width, L, 80, 60);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), v = p.getY(i) + L / 2;
    let y, z;
    if (v < seatDepth) { y = y0; z = z0 + v; }
    else if (v < seatDepth + arc) { const t = (v - seatDepth) / r; y = y0 - r + Math.cos(t) * r; z = z0 + seatDepth + Math.sin(t) * r; }
    else { y = y0 - r - (v - seatDepth - arc); z = z0 + seatDepth + r; }
    const hang = Math.max(0, v - seatDepth) / drop;
    z += Math.sin(x * 26 + hang * 2) * 0.012 * (0.3 + hang) + hang * hang * 0.03;
    y += v < seatDepth ? Math.sin(x * 20) * 0.004 : 0;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

function hennaSofa() {
  const g = new THREE.Group(), W = 1.9;
  const sh = new THREE.Shape();
  sh.moveTo(-W / 2, 0); sh.lineTo(-W / 2, 0.5);
  sh.bezierCurveTo(-W / 2 + 0.12, 0.7, -0.5, 0.66, -0.28, 0.86);
  sh.bezierCurveTo(-0.14, 0.99, 0.14, 0.99, 0.28, 0.86);
  sh.bezierCurveTo(0.5, 0.66, W / 2 - 0.12, 0.7, W / 2, 0.5);
  sh.lineTo(W / 2, 0); sh.lineTo(-W / 2, 0);
  const back = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 5, curveSegments: 40 }), MT.velvet);
  back.position.set(0, 0.38, -0.42); g.add(back);
  const top = sh.getPoints(80).filter((q) => q.y > 0.45 && Math.abs(q.x) < W / 2 + 0.01);
  const frame = new THREE.CatmullRomCurve3(top.map((q) => new THREE.Vector3(q.x * 1.035, q.y * 1.02 + 0.38 + 0.01, -0.3)));
  g.add(mesh(new THREE.TubeGeometry(frame, 160, 0.022, 10), MT.brass));
  g.add(at(mesh(new RoundedBoxGeometry(W + 0.12, 0.26, 0.82, 4, 0.06), MT.velvet), 0, 0.28, -0.02));
  g.add(at(mesh(new RoundedBoxGeometry(W - 0.02, 0.15, 0.72, 4, 0.07), MT.velvet), 0, 0.48, 0.0));
  g.add(at(mesh(new THREE.BoxGeometry(W + 0.16, 0.035, 0.03), MT.brass), 0, 0.16, 0.4));
  [-1, 1].forEach((k) => {
    const scroll = mesh(new THREE.TorusGeometry(0.11, 0.05, 16, 40, Math.PI * 1.4), MT.velvet); scroll.position.set(k * (W / 2 + 0.02), 0.6, 0.02); scroll.rotation.y = Math.PI / 2; scroll.rotation.z = k > 0 ? -0.2 : Math.PI + 0.2; g.add(scroll);
    const trim = mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 40, Math.PI * 1.4), MT.brass); trim.position.set(k * (W / 2 + 0.065), 0.6, 0.02); trim.rotation.copy(scroll.rotation); g.add(trim);
    g.add(at(mesh(new RoundedBoxGeometry(0.16, 0.34, 0.78, 4, 0.06), MT.velvet), k * (W / 2 + 0.01), 0.42, -0.02));
  });
  [[-0.9, 0.36], [0.9, 0.36], [-0.9, -0.36], [0.9, -0.36]].forEach(([x, z]) => g.add(at(mesh(lathe([[0, 0], [0.03, 0], [0.018, 0.06], [0.03, 0.14], [0.04, 0.16], [0, 0.16]], 20), MT.brass), x, 0, z)));
  [[-0.55, 0.12], [0, 0.0], [0.55, -0.12]].forEach(([x, rz], i) => { const c = mesh(new RoundedBoxGeometry(0.42, 0.34, 0.12, 4, 0.06), [MT.blush, MT.sage, MT.blush][i]); c.position.set(x, 0.73, -0.24); c.rotation.set(-0.25, 0, rz); g.add(c); });
  g.add(mesh(drapedThrow(1.15, 0.55, 0.34, 0.565, -0.2), MT.rose));
  return g;
}

function weddingCorner() {
  const s = new THREE.Scene();
  floor(s);
  const rug = mesh(new RoundedBoxGeometry(3.6, 0.012, 2.4, 2, 0.005), MT.cloth); rug.position.set(0, 0.006, 0.25); s.add(rug);
  const back = mesh(hangingCloth(7, 3.8, 48, 0.06), MT.burgundy); back.position.set(0, 1.9, -1.5); s.add(back);
  [-1, 1].forEach((k) => { const d = mesh(hangingCloth(1.1, 3.6, 9, 0.05, 90), MT.drape); d.position.set(k * 2.25, 1.8, -1.35); d.rotation.y = -k * 0.2; s.add(d); });
  const sofa = hennaSofa(); sofa.position.set(0, 0, -0.45); s.add(sofa);
  // Arche fleurie derrière le canapé
  for (let i = 0; i <= 14; i++) {
    const t = (i / 14) * Math.PI;
    if (i > 4 && i < 10) continue; // ouverture au sommet, plus aérienne
    bouquet(s, Math.cos(t) * 1.45, 0.25 + Math.sin(t) * 1.75, -1.2, 0.18, 11, 200 + i, 0.04, 2.3, 1.35, 'vivid');
  }
  bouquet(s, 0.0, 2.02, -1.2, 0.3, 18, 230, 0.06, 2.4, 1.35, 'vivid');
  // Grands bougeoirs sur pied (plus d'un mètre)
  [[-1.4, -0.5, 1.25], [1.4, -0.5, 1.25], [-1.85, -0.85, 1.55], [1.85, -0.85, 1.55]].forEach(([x, z, h]) => {
    const c = floorCandelabra(h); c.position.set(x, 0, z); s.add(c); candleLight(s, x, c.userData.flameY, z + 0.05, 0.25);
  });
  bouquet(s, -1.15, 0.06, -0.2, 0.22, 16, 21, 0.18, 2.1, 0, 'vivid');
  bouquet(s, 1.15, 0.06, -0.2, 0.22, 16, 22, 0.18, 2.1, 0, 'vivid');
  for (let i = 0; i < 16; i++) { const v = votive(); v.position.set(rr(-1.6, 1.6), 0.012, rr(0.75, 1.35)); s.add(v); }
  const petalG = new THREE.CircleGeometry(0.022, 8); petalG.rotateX(-Math.PI / 2);
  const pm = new THREE.InstancedMesh(petalG, MT.petal, 160); const d = new THREE.Object3D();
  for (let i = 0; i < 160; i++) { d.position.set(rr(-1.7, 1.7), 0.014, rr(0.2, 1.4)); d.rotation.set(rr(-0.2, 0.2), R() * 6, rr(-0.2, 0.2)); d.updateMatrix(); pm.setMatrixAt(i, d.matrix); }
  s.add(pm);
  fairyLights(s, { z: -1.42, y: 3.3, width: 6.6, strings: 3, per: 34, sag: 0.35, spread: 0.01 });
  spot(s, [0.3, 4.4, 3.2], [0, 0.6, -0.45], 1.25, 0.34, 0.9);
  spot(s, [0, 4.2, 1.2], [0, 1.4, -1.2], 0.5, 0.45, 1, false);
  s.add(new THREE.HemisphereLight(0xffe9d6, 0x1a1012, 0.07));
  return s;
}

function sweetsTable() {
  const s = new THREE.Scene();
  floor(s);
  const t = clothedTable(2.2, 0.9, 0.76); t.rotation.y = Math.PI / 2; s.add(t);
  const H = 0.77;
  // Plateau à étages
  const stand = new THREE.Group();
  [[0.2, 0], [0.15, 0.17], [0.1, 0.32]].forEach(([r, y]) => stand.add(at(mesh(lathe([[0, 0], [r, 0], [r, 0.01], [r - 0.01, 0.012], [0, 0.012]], 48), MT.porcelain), 0, y + 0.03, 0)));
  stand.add(at(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.36, 12), MT.brass), 0, 0.2, 0));
  stand.add(at(mesh(lathe([[0, 0], [0.07, 0], [0.04, 0.03], [0, 0.03]], 32), MT.brass), 0, 0, 0));
  stand.position.set(0.32, H, -0.12); s.add(stand);
  // Tartelettes fraise sur les étages
  const tart = () => {
    const g = new THREE.Group();
    g.add(mesh(lathe([[0, 0], [0.026, 0], [0.03, 0.012], [0.028, 0.014], [0.024, 0.004], [0, 0.004]], 32), new THREE.MeshStandardMaterial({ color: 0xc89058, roughness: 0.75 })));
    g.add(at(mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.006, 24), new THREE.MeshStandardMaterial({ color: 0xf2e1b8, roughness: 0.5 })), 0, 0.011, 0));
    for (let i = 0; i < 4; i++) { const f = mesh(new THREE.SphereGeometry(0.009, 14, 10), new THREE.MeshPhysicalMaterial({ color: 0xa8102a, roughness: 0.25, clearcoat: 1 })); f.scale.set(1, 1.3, 1); f.position.set(Math.cos(i * 1.6) * 0.011, 0.02, Math.sin(i * 1.6) * 0.011); g.add(f); }
    return g;
  };
  [[0.2, 0.042, 7], [0.15, 0.212, 5], [0.1, 0.362, 3]].forEach(([r, y, n]) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const g = tart(); g.position.set(0.32 + Math.cos(a) * (r - 0.05), H + y, -0.12 + Math.sin(a) * (r - 0.05)); s.add(g); } });
  // Verrines en rangées
  const layers = [[0x3a2214, 0.018], [0xf1e7d4, 0.02], [0x9a6a3e, 0.008]];
  const verrine = (top) => {
    const g = new THREE.Group();
    g.add(mesh(lathe([[0, 0], [0.022, 0], [0.024, 0.075], [0.022, 0.075], [0.02, 0.003], [0, 0.003]], 36), MT.glass, false));
    let y = 0.003;
    layers.forEach(([c, h]) => { g.add(at(mesh(new THREE.CylinderGeometry(0.0205, 0.0198, h, 28), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }), false), 0, y + h / 2, 0)); y += h; });
    const cream = mesh(new THREE.SphereGeometry(0.016, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xfaf4ea, roughness: 0.45 }));
    cream.scale.set(1, 0.9, 1); cream.position.y = y; g.add(cream);
    const tp = mesh(new THREE.SphereGeometry(0.006, 12, 8), new THREE.MeshPhysicalMaterial({ color: top, roughness: 0.3, clearcoat: 1 })); tp.position.y = y + 0.015; g.add(tp);
    const spoon = mesh(new RoundedBoxGeometry(0.004, 0.09, 0.008, 2, 0.002), MT.silver); spoon.position.set(0.012, y + 0.02, 0); spoon.rotation.z = -0.25; g.add(spoon);
    return g;
  };
  const tray = mesh(new RoundedBoxGeometry(0.62, 0.016, 0.3, 3, 0.006), MT.wood); tray.position.set(-0.35, H + 0.008, 0.06); s.add(tray);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const v = verrine([0x6a3b1c, 0xffe26a, 0xc68b4a][r]); v.position.set(-0.6 + i * 0.1, H + 0.016, -0.04 + r * 0.095); s.add(v); }
  // Salade de fruits en coupelles
  const bowl = mesh(lathe([[0, 0], [0.05, 0.002], [0.08, 0.05], [0.077, 0.052], [0.047, 0.006], [0, 0.006]], 40), MT.glass, false); bowl.position.set(-0.05, H, -0.26); s.add(bowl);
  for (let i = 0; i < 26; i++) { const f = mesh(new THREE.IcosahedronGeometry(0.012, 1), new THREE.MeshPhysicalMaterial({ color: [0xb5122c, 0xf5c242, 0x6aa84f, 0xf08a24][i % 4], roughness: 0.3, clearcoat: 0.8 }), false); f.position.set(-0.05 + rr(-0.05, 0.05), H + 0.03 + rr(0, 0.02), -0.26 + rr(-0.05, 0.05)); s.add(f); }
  bouquet(s, 0.75, H + 0.05, -0.25, 0.14, 14, 31, 0.08);
  [[-0.85, 0.3], [0.85, 0.24], [0.0, 0.34]].forEach(([x, hh], k) => { const th = taperHolder(hh); th.position.set(x, H, -0.36 + k * 0.02); s.add(th); candleLight(s, x, H + th.userData.flameY, -0.36, 0.06); });
  const back = mesh(hangingCloth(6, 3.6, 46, 0.05), MT.drape); back.position.set(0, 1.8, -0.9); s.add(back);
  fairyLights(s, { z: -0.85, y: 2.2, width: 4.4, strings: 2, per: 26, sag: 0.35, spread: 0.01 });
  spot(s, [0.6, 3.4, 2.2], [0, 0.85, -0.1], 1.2, 0.3, 0.9);
  spot(s, [-1.4, 2.2, -0.2], [0, 0.9, 0], 0.25, 0.6, 1, false);
  s.add(new THREE.HemisphereLight(0xffe9d6, 0x1a1012, 0.08));
  return s;
}

function mocktails() {
  const s = new THREE.Scene();
  floor(s);
  const bar = mesh(new RoundedBoxGeometry(2.4, 0.05, 0.9, 3, 0.01), MT.black); bar.position.set(0, 0.9, 0); s.add(bar);
  const H = 0.925;
  const drinks = [
    { x: -0.11, z: 0.02, liquid: [0xd8506e, 0x8fb35a], h: 0.12 }, // matcha fraise (deux couches)
    { x: 0.03, z: -0.07, liquid: [0xd88a3a], h: 0.14 },            // thé glacé pêche citron
    { x: 0.16, z: 0.03, liquid: [0x8e5bc2], h: 0.12 },             // violet citron
  ];
  const citrus = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f2e27a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff7c8'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.45, 0, 7); g.fill();
    for (let i = 0; i < 10; i++) { g.fillStyle = '#f6d84a'; g.beginPath(); g.moveTo(w / 2, h / 2); g.arc(w / 2, h / 2, w * 0.41, (i / 10) * 6.283 + 0.05, ((i + 1) / 10) * 6.283 - 0.05); g.fill(); }
  });
  const citrusM = [new THREE.MeshStandardMaterial({ color: 0xf2e27a, roughness: 0.5 }), new THREE.MeshPhysicalMaterial({ map: citrus, roughness: 0.3, clearcoat: 1 }), new THREE.MeshPhysicalMaterial({ map: citrus, roughness: 0.3, clearcoat: 1 })];
  drinks.forEach(({ x, z, liquid, h }) => {
    const g = new THREE.Group();
    g.add(tumbler(h, 0.034));
    const per = (h * 0.74) / liquid.length;
    liquid.forEach((c, i) => {
      const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
      g.add(at(mesh(new THREE.CylinderGeometry(0.0318 + 0.0022 * ((i + 1) * per) / h, 0.0318 + 0.0022 * (i * per) / h, per, 40), m, false), 0, 0.012 + per * i + per / 2, 0));
    });
    for (let k = 0; k < 3; k++) { const ice = mesh(new RoundedBoxGeometry(0.022, 0.02, 0.022, 2, 0.006), new THREE.MeshPhysicalMaterial({ color: 0xf4f4f4, roughness: 0.15, clearcoat: 1 }), false); ice.position.set(rr(-0.012, 0.012), 0.012 + h * 0.74 + 0.004, rr(-0.012, 0.012)); ice.rotation.set(R() * 3, R() * 3, R() * 3); g.add(ice); }
    const straw = mesh(new THREE.CylinderGeometry(0.003, 0.003, h + 0.08, 10), MT.white); straw.position.set(0.012, h * 0.7, 0.006); straw.rotation.z = -0.22; g.add(straw);
    const slice = mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.005, 32), citrusM); slice.rotation.set(Math.PI / 2, 0, 0.3); slice.position.set(-0.03, h - 0.004, 0.0); g.add(slice);
    const mint = mesh(new THREE.SphereGeometry(0.012, 10, 6), MT.leaf); mint.scale.set(1, 0.15, 0.55); mint.position.set(0.008, h * 0.74 + 0.03, -0.01); mint.rotation.set(0.6, 0.4, 0.3); g.add(mint);
    g.position.set(x, H, z); s.add(g);
  });
  // Fleurs de violette et feuilles de menthe éparses
  for (let i = 0; i < 9; i++) { const l = mesh(new THREE.SphereGeometry(0.012, 10, 6), MT.leaf); l.scale.set(1, 0.15, 0.55); l.position.set(rr(-0.35, 0.35), H + 0.002, rr(0.08, 0.22)); l.rotation.y = R() * 6; s.add(l); }
  for (let i = 0; i < 4; i++) { const c = mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.006, 32), citrusM); c.position.set(rr(-0.4, 0.4), H + 0.004, rr(0.1, 0.2)); s.add(c); }
  [-0.45, 0.42].forEach((x, k) => { const v = votive(); v.position.set(x, H, -0.12 + k * 0.05); s.add(v); candleLight(s, x, H + 0.04, -0.12, 0.04); });
  fairyLights(s, { z: -3, y: 1.4, width: 6, strings: 3, per: 30, sag: 0.3, spread: 1.5 });
  [[3.2, 0.7, 1.7], [1.6, 0.9, 3.4], [3.6, 2.0, 0.6]].forEach((c, k) => { for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(...c) })); b.position.set(rr(-1.6, 1.6), rr(1.1, 1.9), rr(-3.6, -2.4)); s.add(b); } });
  // Contre-jour : les verres s'illuminent
  spot(s, [0.2, 1.6, -1.4], [0.03, 0.98, 0], 1.6, 0.25, 0.8, false);
  spot(s, [-0.8, 2.6, 1.6], [0, 0.95, 0], 0.7, 0.3, 0.9);
  s.add(new THREE.HemisphereLight(0xffe9d6, 0x1a1012, 0.06));
  return s;
}

function savoryBoard() {
  const s = new THREE.Scene();
  floor(s);
  const t = clothedTable(2, 1, 0.76, MT.clothDark); t.rotation.y = Math.PI / 2; s.add(t);
  const runner = mesh(new THREE.BoxGeometry(2, 0.004, 0.42), MT.burgundy); runner.position.set(0, 0.772, 0.02); s.add(runner);
  const H = 0.774;
  const board = mesh(new RoundedBoxGeometry(0.7, 0.025, 0.34, 3, 0.008), MT.wood); board.position.set(0, H + 0.0125, 0); s.add(board);
  const B = H + 0.025;
  const bunM = new THREE.MeshPhysicalMaterial({ color: 0xc6803c, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.4 });
  const burger = () => {
    const g = new THREE.Group();
    g.add(at(mesh(new THREE.CylinderGeometry(0.026, 0.025, 0.012, 28), bunM), 0, 0.006, 0));
    g.add(at(mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.01, 28), new THREE.MeshStandardMaterial({ color: 0x3a2117, roughness: 0.8 })), 0, 0.017, 0));
    const ch = mesh(new THREE.BoxGeometry(0.044, 0.002, 0.044), new THREE.MeshStandardMaterial({ color: 0xf2a42a, roughness: 0.4 })); ch.position.y = 0.023; ch.rotation.y = 0.78; g.add(ch);
    const top = mesh(new THREE.SphereGeometry(0.027, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), bunM); top.scale.set(1, 0.7, 1); top.position.y = 0.024; g.add(top);
    for (let i = 0; i < 14; i++) { const ses = mesh(new THREE.SphereGeometry(0.0018, 6, 4), MT.white, false); const a = R() * 6.28, r = Math.sqrt(R()) * 0.02; ses.scale.set(1, 0.5, 1.8); ses.position.set(Math.cos(a) * r, 0.024 + Math.sqrt(Math.max(0, 0.027 ** 2 - r * r)) * 0.7, Math.sin(a) * r); g.add(ses); }
    g.add(at(mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.09, 6), MT.wood), 0, 0.045, 0));
    return g;
  };
  const maki = () => {
    const g = new THREE.Group();
    g.add(at(mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.026, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x141a12, roughness: 0.5, side: THREE.DoubleSide })), 0, 0.013, 0));
    g.add(at(mesh(new THREE.CylinderGeometry(0.0175, 0.0175, 0.0255, 28), new THREE.MeshStandardMaterial({ color: 0xf7f5f0, roughness: 0.95 })), 0, 0.013, 0));
    g.add(at(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.026, 12), new THREE.MeshStandardMaterial({ color: 0x6aa33f, roughness: 0.4 })), 0.004, 0.0132, 0));
    g.add(at(mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.026, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })), -0.005, 0.0133, 0.002));
    return g;
  };
  const wrapTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#e1c48d'; g.fillRect(0, 0, w, h);
    g.lineWidth = 9; g.strokeStyle = '#f08f6f'; g.beginPath();
    for (let a = 0; a < 26; a += 0.05) { const r = 4 + a * 4.4; g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
    g.stroke(); g.lineWidth = 3; g.strokeStyle = '#ffffff'; g.stroke();
  });
  const wrap = () => {
    const m = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.032, 32), [new THREE.MeshStandardMaterial({ color: 0xd9b77a, roughness: 0.8 }), new THREE.MeshStandardMaterial({ map: wrapTex, roughness: 0.7 }), new THREE.MeshStandardMaterial({ map: wrapTex, roughness: 0.7 })]);
    m.rotation.x = Math.PI / 2; m.position.y = 0.022; const g = new THREE.Group(); g.add(m); return g;
  };
  const skewer = () => {
    const g = new THREE.Group();
    [[0xc8102e, 0.012], [0xffffff, 0.011], [0xc8102e, 0.01]].forEach(([c, r], i) => g.add(at(mesh(new THREE.SphereGeometry(r, 18, 12), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: c === 0xc8102e ? 1 : 0 })), 0, 0.012 + i * 0.022, 0)));
    g.add(at(mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.09, 6), MT.wood), 0, 0.045, 0));
    return g;
  };
  for (let i = 0; i < 4; i++) { const b = burger(); b.position.set(-0.26 + i * 0.075, B, -0.08); s.add(b); }
  for (let i = 0; i < 6; i++) { const m = maki(); m.position.set(0.06 + (i % 3) * 0.045, B, -0.09 + Math.floor(i / 3) * 0.045); s.add(m); }
  for (let i = 0; i < 5; i++) { const w = wrap(); w.position.set(-0.27 + i * 0.055, B, 0.06); w.rotation.y = (i - 2) * 0.12; s.add(w); }
  for (let i = 0; i < 4; i++) { const k = skewer(); k.position.set(0.08 + i * 0.05, B, 0.08); s.add(k); }
  // Mini hot-dogs sur une seconde planche
  const board2 = mesh(new RoundedBoxGeometry(0.4, 0.02, 0.2, 3, 0.006), MT.wood); board2.position.set(0.55, H + 0.01, -0.22); board2.rotation.y = -0.3; s.add(board2);
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    const bun = mesh(new THREE.CapsuleGeometry(0.014, 0.05, 8, 16), bunM); bun.rotation.z = Math.PI / 2; bun.scale.set(1, 1, 1.1); bun.position.y = 0.012; g.add(bun);
    const sau = mesh(new THREE.CapsuleGeometry(0.008, 0.06, 8, 16), new THREE.MeshPhysicalMaterial({ color: 0x8a3a22, roughness: 0.35, clearcoat: 0.8 })); sau.rotation.z = Math.PI / 2; sau.position.y = 0.022; g.add(sau);
    g.position.set(0.55 + (i - 1.5) * 0.08 * Math.cos(0.3), H + 0.02, -0.22 + (i - 1.5) * 0.08 * Math.sin(0.3)); g.rotation.y = -0.3 + Math.PI / 2; s.add(g);
  }
  [[-0.5, 0.26], [0.42, 0.3]].forEach(([x, hh]) => { const th = taperHolder(hh); th.position.set(x, H, -0.3); s.add(th); candleLight(s, x, H + th.userData.flameY, -0.3, 0.06); });
  bouquet(s, -0.62, H + 0.04, 0.05, 0.1, 10, 41, 0.05);
  fairyLights(s, { z: -3.5, y: 1.6, width: 7, strings: 3, per: 30, sag: 0.3, spread: 1.2 });
  spot(s, [0.3, 3, 1.6], [0, H, 0], 1.2, 0.25, 0.9);
  s.add(new THREE.HemisphereLight(0xffe9d6, 0x1a1012, 0.06));
  return s;
}

function ceremonyArch() {
  const s = new THREE.Scene();
  floor(s);
  const runner = mesh(new THREE.BoxGeometry(1.3, 0.008, 9), MT.cloth); runner.position.set(0, 0.004, 1.5); s.add(runner);
  // Arche ronde : deux montants et un demi-cercle
  const tube = (g) => mesh(g, MT.brass);
  s.add(at(tube(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 16)), -1.2, 0.7, -3));
  s.add(at(tube(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 16)), 1.2, 0.7, -3));
  const top = tube(new THREE.TorusGeometry(1.2, 0.025, 12, 80, Math.PI)); top.position.set(0, 1.4, -3); s.add(top);
  const veil = mesh(hangingCloth(0.9, 2.3, 7, 0.05, 90), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false }), false); veil.position.set(-0.75, 1.3, -3.05); veil.rotation.z = 0.04; 
  bouquet(s, -0.95, 2.25, -2.95, 0.42, 38, 51, 0.2, 2.4, 1.2, 'vivid');
  bouquet(s, -1.2, 1.55, -2.95, 0.3, 24, 52, 0.1, 2.4, 1.2, 'vivid');
  bouquet(s, -1.22, 0.9, -2.95, 0.22, 14, 55, 0.1, 2.2, 1.2, 'vivid');
  bouquet(s, 1.15, 0.2, -2.95, 0.4, 34, 53, 0.25, 2.4, 0.6, 'vivid');
  bouquet(s, 0.55, 2.55, -2.95, 0.2, 12, 54, 0.05, 2.0, 1.2, 'vivid');
  // Allée : chaises et lanternes
  for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) [-1, 1].forEach((side) => { const c = chair(); c.position.set(side * (1.0 + k * 0.5), 0, -1.6 + r * 0.9); c.rotation.y = Math.PI; s.add(c); });
  for (let i = 0; i < 7; i++) [-0.75, 0.75].forEach((x) => {
    const g = new THREE.Group();
    g.add(mesh(lathe([[0, 0], [0.07, 0], [0.075, 0.35], [0.07, 0.35], [0.065, 0.01], [0, 0.01]], 32), MT.glassFrost, false));
    const c = candle(0.12, 0.03); c.position.y = 0.01; g.add(c);
    g.position.set(x, 0, -2.4 + i * 0.95); s.add(g);
    if (i < 4) candleLight(s, x, 0.16, -2.4 + i * 0.95, 0.12);
  });
  // Pétales sur l'allée
  const petalG = new THREE.CircleGeometry(0.02, 8); petalG.rotateX(-Math.PI / 2);
  const pm = new THREE.InstancedMesh(petalG, MT.petal, 500); const d = new THREE.Object3D();
  for (let i = 0; i < 500; i++) { d.position.set(rr(-0.6, 0.6), 0.01, rr(-2.6, 5)); d.rotation.set(rr(-0.2, 0.2), R() * 6, rr(-0.2, 0.2)); d.updateMatrix(); pm.setMatrixAt(i, d.matrix); }
  s.add(pm);
  fairyLights(s, { z: -6, y: 3, width: 14, strings: 5, per: 44, sag: 0.6, spread: 2 });
  const back = mesh(hangingCloth(12, 5, 70, 0.06), MT.emerald); back.position.set(0, 2.5, -4.2); s.add(back);
  spot(s, [0, 5, 0.5], [0, 1, -3], 1.3, 0.3, 0.9);
  spot(s, [0, 4.5, 4], [0, 0, 0], 0.2, 0.6, 1, false);
  s.add(new THREE.HemisphereLight(0xffe9d6, 0x1a1012, 0.08));
  return s;
}

function buffetScene() {
  const s = new THREE.Scene();
  floor(s);
  const t = clothedTable(3.4, 0.9, 0.86); t.rotation.y = Math.PI / 2; s.add(t);
  const H = 0.87;
  const cake = new THREE.Group();
  [[0.17, 0.16], [0.13, 0.14], [0.09, 0.12]].reduce((y, [r, h]) => { cake.add(at(mesh(new THREE.CylinderGeometry(r, r, h, 48), MT.white), 0, y + h / 2, 0)); return y + h; }, 0.05);
  cake.add(mesh(lathe([[0, 0], [0.24, 0], [0.24, 0.012], [0.05, 0.02], [0.03, 0.05], [0, 0.05]], 48), MT.porcelain));
  cake.position.set(0, H, -0.1); s.add(cake);
  bouquet(s, 0.06, H + 0.48, -0.1, 0.08, 9, 61, 0.03);
  bouquet(s, -0.12, H + 0.22, -0.02, 0.06, 6, 62, 0.02);
  const standRow = (x, n, r) => {
    const st = mesh(lathe([[0, 0], [0.05, 0], [0.02, 0.1], [r, 0.11], [r, 0.12], [0, 0.12]], 40), MT.porcelain); st.position.set(x, H, -0.05); s.add(st);
    for (let i = 0; i < n; i++) { const a = (i / n) * 6.28; const m = mesh(new RoundedBoxGeometry(0.035, 0.022, 0.035, 2, 0.008), new THREE.MeshStandardMaterial({ color: [0xf3e3c8, 0x5a3420, 0xe9b8c4][i % 3], roughness: 0.6 })); m.position.set(x + Math.cos(a) * r * 0.6, H + 0.135, -0.05 + Math.sin(a) * r * 0.6); m.rotation.y = a; s.add(m); }
  };
  standRow(-0.75, 8, 0.15); standRow(0.75, 8, 0.15); standRow(-1.3, 6, 0.12); standRow(1.3, 6, 0.12);
  for (let i = 0; i < 10; i++) { const v = votive(); v.position.set(-1.5 + i * 0.33, H, 0.3); s.add(v); }
  [[-0.45, 0.3], [0.45, 0.34], [-1.05, 0.26], [1.05, 0.28]].forEach(([x, hh]) => { const th = taperHolder(hh); th.position.set(x, H, -0.28); s.add(th); candleLight(s, x, H + th.userData.flameY, -0.28, 0.15); });
  garland(s, -1.7, 0.12, 1.7, 0.12, H + 0.005, 300, 63);
  const back = mesh(hangingCloth(8, 4, 60, 0.05), MT.drape); back.position.set(0, 2, -0.8); s.add(back);
  bouquet(s, -1.6, 1.9, -0.75, 0.45, 50, 64, 0.2, 1.6, 1.2, 'vivid');
  bouquet(s, 1.6, 1.7, -0.75, 0.4, 44, 65, 0.2, 1.6, 1.2, 'vivid');
  fairyLights(s, { z: -0.75, y: 2.8, width: 6, strings: 3, per: 34, sag: 0.4, spread: 0.01 });
  spot(s, [0.5, 4, 2.8], [0, H, -0.1], 1.2, 0.36, 0.9);
  s.add(new THREE.HemisphereLight(0xffe9d6, 0x1a1012, 0.08));
  return s;
}

/* ───────────── Prises de vue ───────────── */
// fov, position, cible, mise au point (m), ouverture, exposition
export const SHOTS = {
  cover: { scene: 'hall', fov: 38, pos: [0.18, 1.32, 1.75], look: [-0.02, 0.8, -2.2], focus: 1.75, aperture: 0.0016, exposure: 1.0 },
  'cover@m': { scene: 'hall', fov: 46, pos: [0.42, 1.02, 1.25], look: [-0.02, 0.86, -2.4], focus: 1.4, aperture: 0.0016, exposure: 1.0 },
  'svc-deco-tables': { scene: 'hall', fov: 30, pos: [1.0, 1.25, 0.7], look: [0.25, 0.8, -0.15], focus: 1.05, aperture: 0.003, exposure: 1.05 },
  'gal-centre': { scene: 'hall', fov: 34, pos: [-0.62, 1.3, -0.25], look: [0.0, 0.86, -1.15], focus: 1.18, aperture: 0.003, exposure: 1.05 },
  'coin-maries': { scene: 'corner', fov: 42, pos: [0.3, 1.2, 3.4], look: [0, 1.0, -0.5], focus: 3.8, aperture: 0.0008, exposure: 1.0 },
  'coin-maries@m': { scene: 'corner', fov: 58, pos: [0.15, 1.15, 3.3], look: [0, 1.15, -0.5], focus: 3.7, aperture: 0.0008, exposure: 1.0 },
  'svc-location': { scene: 'corner', fov: 30, pos: [2.6, 1.4, 1.6], look: [1.4, 1.0, -0.6], focus: 2.7, aperture: 0.0016, exposure: 1.0 },
  'menu-sucre': { scene: 'sweets', fov: 30, pos: [-0.25, 1.12, 0.72], look: [-0.2, 0.83, 0.0], focus: 0.72, aperture: 0.006, exposure: 1.05 },
  'menu-sucre@m': { scene: 'sweets', fov: 42, pos: [-0.12, 1.15, 0.62], look: [-0.12, 0.82, 0.0], focus: 0.64, aperture: 0.006, exposure: 1.05 },
  'gal-verrines': { scene: 'sweets', fov: 26, pos: [0.65, 1.05, 0.6], look: [0.3, 0.92, -0.12], focus: 0.82, aperture: 0.006, exposure: 1.05 },
  'menu-mocktail': { scene: 'mocktail', fov: 30, pos: [0.05, 1.1, 0.78], look: [0.03, 0.99, 0.0], focus: 0.78, aperture: 0.005, exposure: 1.0 },
  'menu-mocktail@m': { scene: 'mocktail', fov: 40, pos: [0.04, 1.1, 0.7], look: [0.03, 1.0, 0.0], focus: 0.7, aperture: 0.005, exposure: 1.0 },
  'menu-sale': { scene: 'savory', fov: 30, pos: [-0.15, 1.12, 0.62], look: [-0.02, 0.8, 0.0], focus: 0.66, aperture: 0.006, exposure: 1.05 },
  'menu-sale@m': { scene: 'savory', fov: 40, pos: [-0.08, 1.14, 0.55], look: [-0.02, 0.8, 0.0], focus: 0.6, aperture: 0.006, exposure: 1.05 },
  'svc-buffets': { scene: 'buffet', fov: 40, pos: [0.45, 1.22, 1.75], look: [0, 1.05, -0.2], focus: 1.95, aperture: 0.0016, exposure: 1.0 },
  'gal-arche': { scene: 'arch', fov: 44, pos: [0.0, 1.45, 1.1], look: [0, 1.25, -3], focus: 4.1, aperture: 0.0006, exposure: 1.05 },
  'gal-arche@m': { scene: 'arch', fov: 58, pos: [0.0, 1.4, 1.0], look: [0, 1.4, -3], focus: 4.0, aperture: 0.0006, exposure: 1.05 },
  'faq': { scene: 'hall', fov: 22, pos: [0.9, 1.05, -0.6], look: [0.0, 1.0, -2.1], focus: 1.7, aperture: 0.004, exposure: 1.0 },
  'faq@m': { scene: 'hall', fov: 30, pos: [0.7, 1.05, -0.7], look: [0.0, 1.0, -2.1], focus: 1.55, aperture: 0.004, exposure: 1.0 },
};
const BUILDERS = { hall: receptionHall, corner: weddingCorner, sweets: sweetsTable, mocktail: mocktails, savory: savoryBoard, arch: ceremonyArch, buffet: buffetScene };

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uGrain: { value: 0.025 }, uVig: { value: 0.5 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uGrain; uniform float uVig; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, 1.12);                       // saturation un peu renforcée
      c = mix(c, smoothstep(0.0, 1.0, c), 0.25);       // contraste doux
      c += vec3(0.012, 0.004, -0.006) * (1.0 - l);     // ombres légèrement chaudes
      float d = distance(vUv, vec2(0.5));
      c *= 1.0 - uVig * smoothstep(0.32, 0.9, d);
      c += (h(vUv * uRes) - 0.5) * uGrain;
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

/** Rend une prise de vue et renvoie une image PNG (data URL). */
export async function render(name, w, h) {
  const shot = SHOTS[name];
  if (!shot) throw new Error('Prise de vue inconnue : ' + name);
  R = rng(7); roseGeo = undefined; chairGeo = undefined; cardTex = undefined;
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = shot.exposure;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  MT = materials();
  const scene = BUILDERS[shot.scene]();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.045);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = shot.env ?? 0.05;
  const cam = new THREE.PerspectiveCamera(shot.fov, w / h, 0.02, 80);
  cam.position.set(...shot.pos); cam.lookAt(...shot.look);
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
  const comp = new EffectComposer(renderer, rt);
  comp.addPass(new RenderPass(scene, cam));
  comp.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.45, 0.55, 1.1));
  comp.addPass(new BokehPass(scene, cam, { focus: shot.focus, aperture: shot.aperture, maxblur: 0.012 }));
  comp.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader); grade.uniforms.uRes.value.set(w, h); comp.addPass(grade);
  comp.render();
  return renderer.domElement.toDataURL('image/png');
}
