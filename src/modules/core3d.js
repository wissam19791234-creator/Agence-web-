import * as THREE from 'three';

const vert = /* glsl */ `
  uniform float uTime;
  uniform float uPixel;
  attribute float aSeed;
  varying float vHeat;
  varying float vAlpha;

  // bruit pseudo-aléatoire léger
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
    return n;
  }

  void main() {
    vec3 p = position;
    float n = noise(p * 2.2 + vec3(uTime * 0.25));
    float wave = sin(uTime * 1.2 + aSeed * 6.2831) * 0.015;
    p *= 1.0 + (n - 0.5) * 0.16 + wave;
    vHeat = smoothstep(0.62, 0.85, n);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vAlpha = 0.2 + 0.8 * smoothstep(-7.4, -5.1, mv.z);
    gl_PointSize = (1.6 + vHeat * 2.6 + aSeed * 1.0) * uPixel * (7.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  uniform vec3 uCold;
  uniform vec3 uHot;
  varying float vHeat;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uCold, uHot, vHeat);
    gl_FragColor = vec4(col, a * (0.35 + vHeat * 0.65) * vAlpha);
  }
`;

function glowTexture(color) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, color);
  grd.addColorStop(0.25, color.replace('1)', '.35)'));
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function startCore(canvas, container, { reduced = false } = {}) {
  const mobile = window.innerWidth < 760;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 6.2);

  const root = new THREE.Group();
  scene.add(root);

  // Sphère de particules (répartition de Fibonacci)
  const COUNT = mobile ? 1100 : 2400;
  const pos = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    pos[i * 3] = Math.cos(th) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(th) * r;
    seeds[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const uniforms = {
    uTime: { value: 0 },
    uPixel: { value: dpr },
    uCold: { value: new THREE.Color('#d4ff3a') },
    uHot: { value: new THREE.Color('#eaff8f') },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, uniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const sphere = new THREE.Points(geo, mat);
  sphere.scale.setScalar(1.05);
  root.add(sphere);

  // Lueur centrale
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(185,167,255,1)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 }));
  glow.scale.setScalar(1.7);
  root.add(glow);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(212,255,58,1)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.22 }));
  halo.scale.setScalar(4.6);
  root.add(halo);

  // Orbites + satellites
  const orbits = [];
  const ringDefs = [
    { r: 1.65, tilt: [1.2, 0.2, 0], speed: 0.35, color: '#d4ff3a', dash: false },
    { r: 1.95, tilt: [1.45, -0.5, 0.3], speed: -0.22, color: '#d4ff3a', dash: true },
    { r: 2.3, tilt: [1.05, 0.7, -0.2], speed: 0.16, color: '#eaff8f', dash: true },
  ];
  ringDefs.forEach((d) => {
    const pts = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * d.r, Math.sin(a) * d.r, 0));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = d.dash
      ? new THREE.LineDashedMaterial({ color: d.color, transparent: true, opacity: 0.28, dashSize: 0.05, gapSize: 0.07 })
      : new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.22 });
    const line = new THREE.Line(g, m);
    if (d.dash) line.computeLineDistances();
    const pivot = new THREE.Group();
    pivot.rotation.set(...d.tilt);
    pivot.add(line);
    const sat = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), new THREE.MeshBasicMaterial({ color: d.color }));
    const satGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(d.color === '#eaff8f' ? 'rgba(185,167,255,1)' : 'rgba(212,255,58,1)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
    satGlow.scale.setScalar(0.35);
    sat.add(satGlow);
    pivot.add(sat);
    root.add(pivot);
    orbits.push({ pivot, sat, d, a: Math.random() * Math.PI * 2 });
  });

  // Poussière ambiante
  const DUST = mobile ? 200 : 500;
  const dpos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    const r = 2.6 + Math.random() * 3;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    dpos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    dpos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
    dpos[i * 3 + 2] = r * Math.cos(ph);
  }
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ color: '#d4ff3a', size: 0.012, transparent: true, opacity: 0.4, depthWrite: false }));
  scene.add(dust);

  // Taille
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1.2 ? 46 : 38;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  // Parallaxe souris
  const target = { x: 0, y: 0 };
  container.addEventListener('pointermove', (e) => {
    const r = container.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 0.35;
  });
  container.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });

  let visible = true;
  let raf = 0;
  let prev = performance.now();
  let elapsed = 0;
  let lastDraw = 0;
  const loop = (ts = performance.now()) => {
    raf = 0;
    if (!visible) return;
    if (ts - lastDraw < 32) { raf = requestAnimationFrame(loop); return; }
    lastDraw = ts;
    const now = performance.now();
    const dt = Math.min((now - prev) / 1000, 0.05);
    prev = now;
    elapsed += dt;
    const t = elapsed;
    uniforms.uTime.value = t;
    sphere.rotation.y += dt * 0.08;
    sphere.rotation.x = Math.sin(t * 0.15) * 0.15;
    const pulse = 1 + Math.sin(t * 1.6) * 0.06;
    glow.scale.setScalar(1.6 * pulse);
    orbits.forEach((o) => {
      o.a += dt * o.d.speed;
      o.sat.position.set(Math.cos(o.a) * o.d.r, Math.sin(o.a) * o.d.r, 0);
      o.pivot.rotation.z += dt * o.d.speed * 0.1;
    });
    dust.rotation.y -= dt * 0.015;
    root.rotation.y += (target.x - root.rotation.y) * 0.04;
    root.rotation.x += (target.y - root.rotation.x) * 0.04;
    renderer.render(scene, camera);
    if (!reduced) raf = requestAnimationFrame(loop);
  };

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) { prev = performance.now(); raf = requestAnimationFrame(loop); }
  }, { rootMargin: '100px 0px' }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  });
  raf = requestAnimationFrame(loop);
}
