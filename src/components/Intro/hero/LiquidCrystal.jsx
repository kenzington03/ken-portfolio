// Liquid Crystal Shader, ported from dhileepkumargm's 21st.dev component
// (liquid-crystal-shader). Changes: plain JS; the blob cluster sits in the
// right half (u_center) so the glow rims never cross the name; DPR capped;
// `runningRef` parks the loop once the MacBook owns the screen; one static
// frame under prefers-reduced-motion; StrictMode-safe context release.

import { useEffect, useRef } from 'react';

const FRAG = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_speed;
uniform vec3 u_radii;
uniform vec2 u_smoothK;
out vec4 fragColor;

float sdCircle(vec2 p, float r) { return length(p) - r; }

float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

float mapScene(vec2 uv) {
  float t = u_time * u_speed;
  vec2 p1 = vec2(cos(t * 0.5), sin(t * 0.5)) * 0.3;
  vec2 p2 = vec2(cos(t * 0.7 + 2.1), sin(t * 0.6 + 2.1)) * 0.4;
  vec2 p3 = vec2(cos(t * 0.4 + 4.2), sin(t * 0.8 + 4.2)) * 0.35;
  float b1 = sdCircle(uv - p1, u_radii.x);
  float b2 = sdCircle(uv - p2, u_radii.y);
  float b3 = sdCircle(uv - p3, u_radii.z);
  return opSmoothUnion(opSmoothUnion(b1, b2, u_smoothK.x), b3, u_smoothK.y);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y - u_center;
  float d = mapScene(uv);
  vec3 base = vec3(0.01 / abs(d));
  vec3 pha = 0.5 + 0.5 * cos(u_time * 0.5 + uv.xyx + vec3(0, 1, 2));
  // Off-black floor (#09090b) so the canvas matches the page ground.
  vec3 col = max(clamp(base * pha, 0.0, 1.0), vec3(0.035, 0.035, 0.043));
  fragColor = vec4(col, 1.0);
}
`;

const VERT = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const SPEED = 0.6;
const RADII = [0.25, 0.18, 0.3];
const SMOOTH_K = [0.2, 0.3];

const pendingReleases = new WeakMap();

export default function LiquidCrystal({ className, runningRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    clearTimeout(pendingReleases.get(canvas));
    pendingReleases.delete(canvas);
    const gl = canvas.getContext('webgl2', { antialias: false });
    if (!gl) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const u = (n) => gl.getUniformLocation(prog, n);
    const uRes = u('u_resolution');
    const uTime = u('u_time');
    const uCenter = u('u_center');
    gl.uniform1f(u('u_speed'), SPEED);
    gl.uniform3fv(u('u_radii'), RADII);
    gl.uniform2fv(u('u_smoothK'), SMOOTH_K);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      // Right half on wide screens (clear of the name); lower centre when
      // the layout stacks.
      const aspect = w / h;
      gl.uniform2f(uCenter, aspect > 1.2 ? aspect * 0.3 : 0, aspect > 1.2 ? 0 : -0.28);
    };

    let raf = 0;
    let park = 0;
    let disposed = false;
    const frame = (t) => {
      raf = 0;
      if (disposed) return;
      if (runningRef && !runningRef.current) {
        park = window.setTimeout(() => (raf = requestAnimationFrame(frame)), 250);
        return;
      }
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduced ? 6 : t * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const onResize = () => {
      if (reduced && !raf) raf = requestAnimationFrame(frame);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(park);
      window.removeEventListener('resize', onResize);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      const timer = window.setTimeout(() => {
        if (pendingReleases.get(canvas) !== timer) return;
        pendingReleases.delete(canvas);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }, 0);
      pendingReleases.set(canvas, timer);
    };
  }, [runningRef]);

  return <canvas ref={canvasRef} className={className} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
