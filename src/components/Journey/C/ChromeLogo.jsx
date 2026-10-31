// The chrome ball becoming the Apple logo, as one piece of liquid metal.
// Ray-marched: the shape is a blend of two distance fields, the ball (a
// sphere) and the logo (the glyph's 2D distance field, extruded into a domed,
// bevelled slab), so the ball swells and flows out into the bite and the
// leaf rather than cross-fading into them. It reflects the same studio as
// the ball on the career's line (chromeEnv.js), so the hand-over cannot be
// seen. It turns in 3D (the coin spin onto the lid) and can take on the lid's
// own paint at the end.
//
// The element it draws into is the logo element (its box is the glyph's
// box); JourneyC places and scales that, and drives this through `apiRef`:
//   set({ morph, ball: [x, y, r], spin, tilt, idle, ink })
// in world units, where the element's height is 1 and its centre is 0.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CHROME_GLSL } from './chromeEnv.js';

const SDF_N = 640; // the glyph's distance field, texels a side
const SDF_R = 0.62; // ... covering [-R, R] world units both ways

/** Squared distance transform along one line (Felzenszwalb and Huttenlocher). */
function edt1d(f, n, d, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -1e20;
  z[1] = 1e20;
  for (let q = 1; q < n; q += 1) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k -= 1;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

/** Distance (texels) from each texel to the nearest texel where `on` is true. */
function distanceTo(on, n) {
  const INF = 1e20;
  const g = new Float64Array(n * n);
  for (let i = 0; i < n * n; i += 1) g[i] = on[i] ? 0 : INF;
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < n; x += 1) {
    for (let y = 0; y < n; y += 1) f[y] = g[y * n + x];
    edt1d(f, n, d, v, z);
    for (let y = 0; y < n; y += 1) g[y * n + x] = d[y];
  }
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) f[x] = g[y * n + x];
    edt1d(f, n, d, v, z);
    for (let x = 0; x < n; x += 1) g[y * n + x] = Math.sqrt(d[x]);
  }
  return g;
}

/** The glyph's signed distance field (world units; negative inside), rows
 *  bottom first, as GL reads them. */
function glyphField(path, box) {
  const c = document.createElement('canvas');
  c.width = SDF_N;
  c.height = SDF_N;
  const ctx = c.getContext('2d');
  // Glyph units to texels: the glyph's height is 1 world unit, centred.
  const k = SDF_N / (2 * SDF_R);
  const unit = 1 / box.h;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  ctx.setTransform(k * unit, 0, 0, k * unit, k * (SDF_R - cx * unit), k * (SDF_R - cy * unit));
  ctx.fillStyle = '#fff';
  ctx.fill(new Path2D(path));
  const px = ctx.getImageData(0, 0, SDF_N, SDF_N).data;
  const inside = new Uint8Array(SDF_N * SDF_N);
  for (let i = 0; i < inside.length; i += 1) inside[i] = px[i * 4 + 3] > 127 ? 1 : 0;
  const outside = inside.map((x) => 1 - x);
  const toIn = distanceTo(inside, SDF_N);
  const toOut = distanceTo(outside, SDF_N);
  const texel = (2 * SDF_R) / SDF_N;
  const raw = new Float32Array(SDF_N * SDF_N);
  for (let i = 0; i < raw.length; i += 1) raw[i] = (inside[i] ? -(toOut[i] - 0.5) : toIn[i] - 0.5) * texel;
  // Softened a touch (two passes of a 3 x 3 average), so the pixel steps of
  // the outline never show up as streaks in the reflections.
  let field = raw;
  for (let pass = 0; pass < 2; pass += 1) {
    const out = new Float32Array(field.length);
    for (let y = 0; y < SDF_N; y += 1) {
      for (let x = 0; x < SDF_N; x += 1) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          const yy = Math.min(SDF_N - 1, Math.max(0, y + dy));
          for (let dx = -1; dx <= 1; dx += 1) sum += field[yy * SDF_N + Math.min(SDF_N - 1, Math.max(0, x + dx))];
        }
        out[y * SDF_N + x] = sum / 9;
      }
    }
    field = out;
  }
  const data = new Uint16Array(SDF_N * SDF_N);
  for (let y = 0; y < SDF_N; y += 1) {
    for (let x = 0; x < SDF_N; x += 1) data[(SDF_N - 1 - y) * SDF_N + x] = THREE.DataUtils.toHalfFloat(field[y * SDF_N + x]);
  }
  const tex = new THREE.DataTexture(data, SDF_N, SDF_N, THREE.RedFormat, THREE.HalfFloatType);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uSdf;
uniform float uR, uMorph, uSpin, uTilt, uInk, uPx, uTime, uIdle;
uniform vec4 uBall;
uniform vec2 uHalf;
uniform vec3 uPaint;
varying vec2 vUv;
${CHROME_GLSL}

const float THICK = 0.03;   // half the slab's thickness at its edge
const float DOME = 0.085;   // how much fuller it is in the middle (so the
                            // face curves: light above, the floor below)
const float BEVEL = 0.02;

vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }

float sdLogo(vec3 p) {
  vec2 uv = p.xy / (2.0 * uR) + 0.5;
  vec2 q = abs(p.xy) - (uR - 0.004);
  float d2 = texture2D(uSdf, clamp(uv, 0.0, 1.0)).r + length(max(q, 0.0));
  // Domed: fuller toward the middle of each shape, like a pressed badge.
  float k = clamp(-d2 / 0.2, 0.0, 1.0);
  float h = THICK + DOME * k * (2.0 - k);
  vec2 w = vec2(d2 + BEVEL, abs(p.z) - h + BEVEL);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - BEVEL;
}

float map(vec3 p) {
  float spin = uSpin + uIdle * sin(uTime * 0.7) * 0.42;
  p = rotX(rotY(p, -spin), -uTilt - uIdle * sin(uTime * 0.5 + 1.3) * 0.08);
  float ball = length(p - uBall.xyz) - uBall.w;
  float logo = sdLogo(p);
  return mix(ball, logo, uMorph);
}

vec3 normalAt(vec3 p) {
  // Wider than a texel of the glyph's field, so its steps never show.
  const vec2 e = vec2(0.0032, -0.0032);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}

void main() {
  vec3 ro = vec3((vUv - 0.5) * 2.0 * uHalf, 1.2);
  vec3 rd = vec3(0.0, 0.0, -1.0);
  float t = 0.0;
  float best = 1e9;
  float bestT = 0.0;
  bool hit = false;
  for (int i = 0; i < 96; i++) {
    float d = map(ro + rd * t);
    if (d < best) { best = d; bestT = t; }
    if (d < 0.0004) { hit = true; break; }
    t += d * 0.6;
    if (t > 2.4) break;
  }
  // Edges: a miss that passed within a pixel still covers part of it.
  float a = hit ? 1.0 : 1.0 - smoothstep(0.0, uPx * 1.2, best);
  if (a <= 0.0) discard;
  vec3 p = ro + rd * (hit ? t : bestT);
  vec3 n = normalAt(p);
  vec3 col = chrome(rd, n);
  // The lid's own paint, at the very end.
  col = mix(col, uPaint, uInk);
  gl_FragColor = vec4(col * a, a);
}
`;

export default function ChromeLogo({ apiRef, path, box, className, maxScale = 2 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true });
    } catch {
      return undefined;
    }
    // Drawn at the size it reaches at its biggest, so it stays crisp there.
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(canvas.clientWidth * maxScale * dpr);
    const H = Math.round(canvas.clientHeight * maxScale * dpr);
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    const aspect = canvas.clientWidth / canvas.clientHeight;

    const sdf = glyphField(path, box);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      // Written as is: it is the only thing drawn, already premultiplied.
      blending: THREE.NoBlending,
      uniforms: {
        uSdf: { value: sdf },
        uR: { value: SDF_R },
        uHalf: { value: new THREE.Vector2(aspect / 2, 0.5) },
        uPx: { value: 1 / H },
        uMorph: { value: 0 },
        uBall: { value: new THREE.Vector4(0, 0, 0, 0.05) },
        uSpin: { value: 0 },
        uTilt: { value: 0 },
        uIdle: { value: 0 },
        uTime: { value: 0 },
        uInk: { value: 0 },
        uPaint: { value: new THREE.Color('#090a0e') },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: FRAG,
    });
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let dirty = true;
    const u = mat.uniforms;
    apiRef.current = {
      set({ morph, ball, spin, tilt, idle, ink }) {
        u.uMorph.value = morph;
        u.uBall.value.set(ball[0], ball[1], 0, ball[2]);
        u.uSpin.value = spin;
        u.uTilt.value = tilt;
        u.uIdle.value = idle;
        u.uInk.value = ink;
        dirty = true;
      },
    };

    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      // While it idles (big in the middle), it sways: draw every frame.
      if (!dirty && u.uIdle.value <= 0) return;
      dirty = false;
      u.uTime.value = (now - t0) / 1000;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      apiRef.current = null;
      sdf.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, [apiRef, path, box, maxScale]);

  return <canvas ref={canvasRef} className={className} />;
}
