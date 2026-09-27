// Fond « braise en fusion » en WebGL pur (aucune bibliothèque) :
// bruit fractal déformé, rampe de couleurs flamme → or, réagit à la souris.
// Rendu à résolution réduite, mis en pause hors écran.
import { prefersReducedMotion, isFinePointer } from './utils.js';

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uIntensity;
uniform float uFocus; // 0 = plein cadre, 1 = lueur concentrée en haut

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
  return v;
}
vec3 ramp(float t){
  vec3 c0 = vec3(0.039, 0.027, 0.024);   // noir chaud
  vec3 c1 = vec3(0.30, 0.04, 0.03);      // grenat
  vec3 c2 = vec3(0.93, 0.20, 0.09);      // rouge braise
  vec3 c3 = vec3(1.00, 0.42, 0.17);      // flamme
  vec3 c4 = vec3(1.00, 0.78, 0.34);      // or
  vec3 c5 = vec3(1.00, 0.94, 0.86);      // crème
  if (t < 0.25) return mix(c0, c1, t / 0.25);
  if (t < 0.5) return mix(c1, c2, (t - 0.25) / 0.25);
  if (t < 0.7) return mix(c2, c3, (t - 0.5) / 0.2);
  if (t < 0.88) return mix(c3, c4, (t - 0.7) / 0.18);
  return mix(c4, c5, (t - 0.88) / 0.12);
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;
  float t = uTime * 0.07;
  vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float md = length(p - m);
  p += (p - m) * 0.12 * exp(-md * 3.0);

  vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, t)), fbm(p * 1.3 + vec2(5.2, -t * 0.8)));
  vec2 r = vec2(fbm(p * 1.6 + 3.2 * q + vec2(1.7, 9.2) + t * 0.6), fbm(p * 1.6 + 3.2 * q + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(p * 1.4 + 3.6 * r);

  // Masque : plus chaud en haut (focus) ou réparti
  float top = smoothstep(-0.25, 0.75, uv.y);
  float mask = mix(0.65 + 0.35 * top, smoothstep(0.0, 1.0, uv.y) * 1.1, uFocus);
  float heat = f * f * 1.55 * mask * uIntensity + 0.18 * exp(-md * 2.4) * uIntensity;
  vec3 col = ramp(clamp(heat, 0.0, 1.0));

  // Vignette et fondu vers le noir en bas
  col *= smoothstep(1.35, 0.25, length((uv - vec2(0.5, 0.6)) * vec2(1.1, 1.3)));
  col = mix(vec3(0.039, 0.027, 0.024), col, smoothstep(0.0, 0.35, uv.y));
  gl_FragColor = vec4(col, 1.0);
}`;

export function mountEmber(canvas, { intensity = 1, focus = 0, scale = 0.5 } = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  if (!gl) { canvas.classList.add('is-fallback'); return null; }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.classList.add('is-fallback'); return null; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const uRes = u('uRes'), uTime = u('uTime'), uMouse = u('uMouse'), uInt = u('uIntensity'), uFocus = u('uFocus');
  gl.uniform1f(uInt, intensity);
  gl.uniform1f(uFocus, focus);

  const mobile = window.innerWidth < 760;
  const res = mobile ? scale * 0.8 : scale;
  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * res));
    const h = Math.max(1, Math.round(canvas.clientHeight * res));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(uRes, w, h);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const mouse = { x: 0.5, y: 0.75, tx: 0.5, ty: 0.75 };
  if (isFinePointer()) {
    const host = canvas.parentElement;
    host.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
    }, { passive: true });
  }

  const reduced = prefersReducedMotion();
  let visible = true;
  let raf = 0;
  const t0 = performance.now() - 12000;
  const frame = (now) => {
    raf = 0;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (visible && !reduced && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { rootMargin: '100px' }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });
  start();
  return { canvas };
}
