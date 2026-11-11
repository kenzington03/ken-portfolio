// Toothless, the desktop cat: a small black cat, drawn and moved live.
//
// How he is built:
// - One silhouette. Body, legs, tail and head are the same flat black, so
//   they merge into one shape the way a black cat reads in life. His narrow
//   green eyes carry the expression.
// - A skeleton. A curved spine from hip to shoulder; legs solved with inverse
//   kinematics (front legs bend back at the elbow, hind legs are a cat's
//   zig-zag: thigh forward, shin back, then the long foot up to the hock);
//   a tail of sprung segments that lag, overshoot and settle.
// - Real gaits, driven by distance so a planted paw never slides: a
//   lateral-sequence walk (hind, fore on one side, then the other; each paw
//   down about 65% of the stride, hips and shoulders rising over the planted
//   leg, the head held steady), a trot (diagonal pairs), and at speed a
//   bounding gallop (the spine gathers and stretches, with moments in the air).
// - Jumps the way cats jump: stop and look at the target, crouch, wiggle the
//   hind feet, freeze, then the hind legs throw him. Forelegs reach, he lands
//   front paws first and the landing compresses through him like a spring.
//
// His world is the desktop's real surfaces, read from the page every frame:
// the floor (level with the Dock's top), window title bars and desktop icons
// (anything marked [data-cat-surface] or [data-window-titlebar]). He stands
// on them, rides them when they move, falls when they go (or when a window
// opens over them), and plans his own jumps. He is always drawn in front:
// never behind the Dock or a window.
//
// Left to himself he wanders, climbs, sits, loafs, grooms, naps (and
// stretches and yawns after), gets the zoomies, bats a ball of yarn, chases
// a mouse and, up high, watches a butterfly and swats at it. Asked for the
// zoomies, he powers up wherever he is (a blue, violet and gold aura, eyes
// and all), drops to the floor and goes.

import SIT from './toothlessSit.json';
import { lottiePlayer } from './lottieMini.js';

const G = 2400; // gravity, px/s²
const S = 1.5; // his scale: the rig is in units of 1px at S = 1
const WALK = 58; // px/s
const RUN = 280;
const ZOOM = 520;
const MAX_UP = 250; // the highest he will jump, px
const MAX_ACROSS = 460;
const EDGE = 14; // how close to a surface's end he will stand

const INK = '#000';
// His eyes: green almonds with a black slit, as in the animation he sits in.
const EYE = '#9ee05a';
// Sitting and grooming are the animation itself ("Black cat" by PoPoF,
// LottieFiles, Lottie Simple License): its scale on screen, the point under
// him (his feet, the middle of his body), and where the grooming starts.
const SIT_K = 0.14;
const SIT_AT = [775, 750];
const GROOM_AT = 97;
// Super Saiyan: the aura's colours, top to bottom, which his eyes cycle through.
const SSJ = ['#4f8bff', '#9b6bff', '#ffc94d'];
// He is built like the cat he sits as: a deep, round body, a small head with
// small ears, sturdy legs on round paws, a thick tail. Legs short enough that
// he stands up on them: the forelegs nearly straight under the shoulder, the
// hind knee near a right angle.
const FORE = [10.8, 10.8]; // upper arm, forearm
const HIND = [7.8, 7.8]; // thigh, shin
const HOCK = [-3, -9]; // the hock from the paw, standing (the long foot)
const PAW = 3;
const TAIL_N = 14;
const TAIL_SEG = 4;
const LEASH = 150; // how far the butterfly strays before it fades
const WIDE = 420; // the least room, px, he needs to play with the yarn
const LEGS = ['xh', 'xf', 'nh', 'nf']; // far hind, far fore, near hind, near fore

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ss = (a, b, v) => {
  const x = clamp((v - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mixRgb = (p, q, u) => p.map((v, i) => lerp(v, q[i], u));
const css = (p, a = 1) => `rgba(${p.map(Math.round).join(',')},${a})`;
/** A colour going round a list of #rrggbb colours, smoothly, as k grows. */
const cycle = (list, k) => {
  const n = list.length;
  const i = Math.floor(k) % n;
  const u = k - Math.floor(k);
  return mixRgb(rgbOf(list[i]), rgbOf(list[(i + 1) % n]), u * u * (3 - 2 * u));
};

// Poses, in his own space: x forward, y down, the ground at y = 0.
// hip/shoulder centres (hx hy, sx sy), how much the back arches, the head
// from the shoulder (nx ny) with its tilt and turn (0 faces you, 1 profile),
// the rest positions of the paws (fx front, bx hind, from the shoulder and
// hip), hock (1 = sitting on the hind foot), hs (1 = foot in line with the
// shin, as in the air), haunch (the round thigh of a sitting cat), tuck (paws
// folded under), the tail (ta its angle at the root, tc its curl per segment,
// th the hook at its tip), eye openness and how far back the ears are.
const BASE = { hx: -14, hy: -27, sx: 14, sy: -28, arch: 3, nx: 11, ny: -12, tilt: 0, turn: 0.3, fx: 1, bx: 0, hock: 0, hs: 0, haunch: 0, tuck: 0, ta: -1.95, tc: 0.02, th: 0.3, lid: 1, ears: 0 };
const POSES = {
  stand: BASE,
  aim: { ...BASE, hy: -24, sy: -25, nx: 12, ny: -11, tilt: -0.2, turn: 0.55, ta: 2.95, tc: 0.03, th: 0.12 },
  crouch: { ...BASE, hx: -12, hy: -16, sx: 13, sy: -16.5, arch: 1, nx: 12, ny: -9, tilt: -0.12, turn: 0.6, fx: -1, bx: 6, ta: 3.05, tc: 0, th: 0.1 },
  land: { ...BASE, hx: -13, hy: -19, sx: 13, sy: -17, arch: 2, nx: 11, ny: -10, turn: 0.45, fx: 2, bx: 2, ta: -2.5, tc: 0.05, th: 0.2 },
  // Sitting tall, as in the animation he sits in: the tail round his feet.
  sit: { ...BASE, hx: -6, hy: -11, sx: 6, sy: -30, arch: 4, nx: 4, ny: -13, turn: 0.1, fx: 4, bx: 9, hock: 1, haunch: 1, ta: -2.3, tc: 0.05, th: 0.38 },
  loaf: { ...BASE, hx: -13, hy: -12, sx: 11, sy: -12.5, arch: 5.5, nx: 9, ny: -9, turn: 0.15, tuck: 1, ta: 2.6, tc: -0.22, th: 0, lid: 0.55 },
  sleep: { ...BASE, hx: -10, hy: -11, sx: 9, sy: -11, arch: 10, nx: 9, ny: -2, tilt: 0.35, turn: 0, tuck: 1, ta: 2.3, tc: -0.3, th: 0, lid: 0 },
  stretch: { ...BASE, hx: -12, hy: -31, sx: 12, sy: -13, arch: -3, nx: 13, ny: -6, tilt: -0.25, turn: 0.35, fx: 23, bx: -1, ta: -1.85, tc: 0.04, th: 0.25, lid: 0.25 },
  air: { ...BASE, hx: -16, hy: -27, sx: 16, sy: -28, arch: 0, nx: 11, ny: -11, turn: 0.6, hs: 1, ta: 3.35, tc: 0.03, th: 0.05 },
  drag: { ...BASE, hx: 0, hy: 50, sx: 1, sy: 19, arch: -2, nx: 2, ny: -16, turn: 0, hs: 0.8, ta: 1.65, tc: 0.06, th: 0.15, lid: 0.6, ears: 0.6 },
};
POSES.groom = { ...POSES.sit, nx: 5, ny: -12, tilt: 0.3, lid: 0.25 };
// How quickly he moves into each (sleep curls up slowly, landings are fast).
const RATES = { crouch: 14, land: 20, air: 12, drag: 12, aim: 8, stretch: 5, sleep: 3.5, loaf: 4, sit: 7, groom: 7, stand: 8 };

// The gaits: when each paw lands (fraction of the stride), how long it stays
// down, how high the front and hind paws lift.
const GAITS = {
  walk: { duty: 0.64, off: { nh: 0, nf: 0.25, xh: 0.5, xf: 0.75 }, lift: [7, 6] },
  trot: { duty: 0.42, off: { nh: 0, xf: 0, xh: 0.5, nf: 0.5 }, lift: [9, 8] },
  gallop: { duty: 0.24, off: { nh: 0, xh: 0.07, nf: 0.5, xf: 0.57 }, lift: [11, 10] },
};

/** Two-bone IK: the joint between a and b for bones l1, l2. bend 1 puts the
 *  joint behind the line (an elbow), -1 in front (a knee). */
function ik(ax, ay, bx, by, l1, l2, bend) {
  let dx = bx - ax;
  let dy = by - ay;
  let d = Math.hypot(dx, dy) || 1e-3;
  const reach = l1 + l2 - 0.01;
  if (d > reach) {
    dx *= reach / d;
    dy *= reach / d;
    d = reach;
  }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / d;
  const uy = dy / d;
  return [ax + ux * a - uy * h * bend, ay + uy * a + ux * h * bend, ax + dx, ay + dy];
}

/** A soft tube through points, its top and bottom radii given per point. */
function tube(g, pts, rT, rB, roundAll) {
  const n = pts.length;
  const top = [];
  const bot = [];
  for (let i = 0; i < n; i += 1) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const m = Math.hypot(tx, ty) || 1;
    tx /= m;
    ty /= m;
    top.push([pts[i][0] + ty * rT[i], pts[i][1] - tx * rT[i]]);
    bot.push([pts[i][0] - ty * rB[i], pts[i][1] + tx * rB[i]]);
  }
  // The outline curves through the points (no corners at the joints).
  const through = (ps) => {
    for (let i = 1; i < ps.length - 1; i += 1) g.quadraticCurveTo(ps[i][0], ps[i][1], (ps[i][0] + ps[i + 1][0]) / 2, (ps[i][1] + ps[i + 1][1]) / 2);
    g.lineTo(ps[ps.length - 1][0], ps[ps.length - 1][1]);
  };
  g.beginPath();
  g.moveTo(top[0][0], top[0][1]);
  through(top);
  const back = [...bot].reverse();
  g.lineTo(back[0][0], back[0][1]);
  through(back);
  g.closePath();
  g.fill();
  for (let i = 0; i < n; i += roundAll ? 1 : n - 1) {
    const r = (rT[i] + rB[i]) / 2;
    g.beginPath();
    g.arc((top[i][0] + bot[i][0]) / 2, (top[i][1] + bot[i][1]) / 2, r, 0, Math.PI * 2);
    g.fill();
  }
  return { top, bot };
}

/** The open windows, front to back, as screen rectangles with their
 *  stacking order (closing and minimising ones are already gone). */
function readWindows() {
  const out = [];
  document.querySelectorAll('[data-window-titlebar]').forEach((tb) => {
    const el = tb.closest('[role="dialog"]') || tb.parentElement;
    if (/windowClosing|windowMinimizing/.test(el.className)) return;
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 30) return;
    out.push({ el, r, z: Number(el.style.zIndex) || 0 });
  });
  return out.sort((a, b) => b.z - a.z);
}

/** Is a point on a surface of `layer` under a window in front of it? */
const coveredAt = (wins, layer, x, y) => wins.some((w) => w.z > layer && x > w.r.left && x < w.r.right && y > w.r.top && y < w.r.bottom);

/** How high a surface is under x: the floor steps up over the Dock. */
const yAt = (s, x) => (s.step && x > s.step.x0 && x < s.step.x1 ? s.step.y : s.y);

/**
 * Every surface he can stand on, as screen-space segments, each on a layer:
 * the desktop's things behind every window, a window's things on that
 * window's layer. A surface hidden behind a window in front of it can't be
 * jumped to (`hidden`). The floor is the bottom of the screen, with the Dock
 * (the element marked [data-cat-dock]) a step up in it: he hops up onto it
 * and down off it, and never goes behind it.
 */
// Inside any window, the same rule everywhere: its toolbars, section heads
// and dividers, buttons, cards, headings and images are ledges he can climb
// (top edges, the way a cat climbs shelves). Marked [data-cat-surface]
// elements count anywhere; [data-cat-skip] opts something out.
const LEDGES = [
  'nav', 'header', 'button', 'h1', 'h2', 'h3', 'li', 'figure', 'img',
  '[class*="toolbar"]', '[class*="Toolbar"]', '[class*="navBar"]',
  '[class*="ivider"]', '[class*="sidebarSection"]', '[class*="card"]', '[class*="Card"]',
].map((q) => `[role="dialog"] ${q}`).join(', ');

// The element each ledge scrolls inside (found once, kept), so a ledge
// scrolled under a header or out of view is not one.
const clipOf = new WeakMap();
function clipFor(el, win) {
  if (clipOf.has(el)) return clipOf.get(el);
  let box = null;
  for (let p = el.parentElement; p && p !== win; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if (o === 'auto' || o === 'scroll' || o === 'hidden') {
      box = p;
      break;
    }
  }
  clipOf.set(el, box);
  return box;
}

function readSurfaces(wins) {
  const dock = document.querySelector('[data-cat-dock]')?.getBoundingClientRect();
  const step = dock && dock.height > 0 ? { x0: dock.left + 8, x1: dock.right - 8, y: dock.top } : null;
  const out = [{ key: 'floor', el: null, x0: -200, x1: window.innerWidth + 200, y: window.innerHeight - 1, layer: -1, step }];
  const seen = new Set();
  const add = (el, r, host, thin) => {
    // (el is always an element here; the window feet are added below.)
    if (r.width < 40 || (!thin && r.height < 8) || r.bottom < 0 || r.top > window.innerHeight) return;
    let x0 = r.left;
    let x1 = r.right;
    const y = r.top;
    if (host) {
      // Only what shows inside its window (not scrolled out of it).
      if (y < host.r.top - 1 || y > host.r.bottom - 8) return;
      x0 = Math.max(x0, host.r.left);
      x1 = Math.min(x1, host.r.right);
      const clip = el && clipFor(el, host.el);
      if (clip) {
        const c = clip.getBoundingClientRect();
        if (y < c.top - 1 || y > c.bottom - 8) return;
        x0 = Math.max(x0, c.left);
        x1 = Math.min(x1, c.right);
      }
      if (x1 - x0 < 40) return;
      // Two ledges at the same height, side by side, are one he walks along.
      const k = `${host.z}:${Math.round(y)}:${Math.round(x0)}`;
      if (seen.has(k)) return;
      seen.add(k);
    }
    const layer = host ? host.z : -1;
    const hidden = coveredAt(wins, layer, (x0 + x1) / 2, y);
    out.push({ key: el, el, x0, x1, y, layer, hidden, bed: el.dataset.catSurface === 'bed' });
  };
  document.querySelectorAll('[data-cat-surface], [data-window-titlebar]').forEach((el) => {
    const inWindow = el.closest('[role="dialog"]');
    const host = inWindow && wins.find((w) => w.el === inWindow);
    if (inWindow && !host) return; // its window is closing
    add(el, el.getBoundingClientRect(), host, false);
  });
  document.querySelectorAll(LEDGES).forEach((el) => {
    if (el.hasAttribute('data-cat-surface') || el.closest('[data-cat-skip]')) return;
    const host = wins.find((w) => w.el === el.closest('[role="dialog"]'));
    if (!host) return;
    add(el, el.getBoundingClientRect(), host, /ivider/.test(el.className));
  });
  // And each window's bottom edge, a ledge along its foot, on its layer.
  wins.forEach((w) => {
    const y = w.r.bottom;
    if (y > window.innerHeight - 4) return;
    const x0 = w.r.left + 6;
    const x1 = w.r.right - 6;
    out.push({ key: w.el, el: w.el, x0, x1, y, layer: w.z, hidden: coveredAt(wins, w.z, (x0 + x1) / 2, y), bed: false });
  });
  return out;
}

export function createCat({ canvas, onSay }) {
  const ctx = canvas.getContext('2d');
  // He is drawn into his own small canvases first (the rig in one, the
  // sitting animation in another), then laid on the screen each in one
  // piece, so crossfading between them shows no seams. The aura is his
  // silhouette again, coloured, behind him.
  const buf = document.createElement('canvas');
  const g = buf.getContext('2d');
  const lbuf = document.createElement('canvas');
  const lg = lbuf.getContext('2d');
  const aura = document.createElement('canvas');
  const ag = aura.getContext('2d');
  const BW = 380;
  const BH = 360;
  const OX = 190;
  const OY = 240;
  let dpr = 1;
  const size = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    [buf, lbuf, aura].forEach((b) => {
      b.width = BW * dpr;
      b.height = BH * dpr;
    });
  };
  size();
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const c = {
    x: -40,
    y: window.innerHeight - 1,
    vx: 0,
    vy: 0,
    face: 1,
    yaw: 1, // which way he faces, turning through 0 (towards you)
    tn: 0.3,
    on: { key: 'floor', dx: 0 },
    mode: 'walk',
    until: 0,
    plan: { tx: 180 },
    phase: 0,
    speed: 0,
    prevV: 0,
    accel: 0,
    pitch: 0,
    sq: 0, // the landing spring: + compressed
    sqv: 0,
    turn: 0.3,
    lookX: 0,
    lookY: 0,
    lookTilt: 0,
    pupil: 0.9,
    blink: 0,
    nextBlink: 2,
    slow: 0,
    nextSlow: 8,
    ears: 0,
    earTw: 0,
    nextEar: 3,
    mouth: 0,
    yawn: 0,
    purr: 0,
    groom: 0,
    drag: null,
    laser: false,
    impact: 0,
    bat: 0, // a paw swipe, 1 .. 0
    count: 0,
    aimAt: null,
    swat: false,
    thrown: false,
    quick: false,
    box: [-30, 30, -60],
    lot: 0, // how far he's into the sitting animation (0 skeleton, 1 animation)
    lotF: 0, // its frame
    collapse: false,
    pending: null,
    super: false, // asked for the zoomies: powered up until they're done
    ssj: 0, // the aura, 0 .. 1
    zoomNext: false, // on landing, straight into the zoomies
    chargeNext: false, // on landing, power up
  };
  const P = { ...POSES.sit }; // he starts out sitting
  const F = { nf: [12, 0], xf: [9.5, 0], nh: [-11, 0], xh: [-13.5, 0] };
  const ta = Array.from({ length: TAIL_N }, (_, i) => -1.95 + i * 0.02);
  const tv = new Array(TAIL_N).fill(0);
  let R = null; // this frame's rig
  let eyeFill = EYE; // his eye colour this frame (it changes when he powers up)
  let eyeGlow = SSJ[0];
  const sitAnim = lottiePlayer(SIT, { colour: ([r, g2, b]) => (r > 0.9 && g2 > 0.6 && b < 0.1 ? () => eyeFill : null) });
  let windows = readWindows();
  let surfaces = readSurfaces(windows);
  let pointer = { x: -999, y: -999 };
  const hearts = [];
  const sparks = []; // the aura's rising embers
  const bolts = []; // crackles while he powers up
  const ghosts = []; // afterimages behind him at full power
  // His things: a ball of yarn, a mouse, a butterfly.
  const toys = { yarn: null, mouse: null, fly: null };

  const surfaceOf = (on) => (on ? surfaces.find((s) => s.key === on.key) : null);
  const span = (s) => [Math.max(s.x0 + EDGE, -60), Math.min(s.x1 - EDGE, window.innerWidth + 60)];
  const say = (t) => {
    c.mouth = 1;
    onSay?.(t);
  };
  const set = (mode, secs = 0) => {
    c.mode = mode;
    c.until = performance.now() / 1000 + secs;
  };
  const onFloor = () => c.on?.key === 'floor';
  const floorY = () => surfaces[0].y; // the floor proper, below the Dock
  // On the floor proper, not up on the Dock.
  const onBase = () => onFloor() && yAt(surfaces[0], c.x) === surfaces[0].y;
  /** The stretch of floor at one level around x: beside the Dock, or on it. */
  function level(x) {
    const st = surfaces[0].step;
    if (!st) return [0, window.innerWidth];
    if (x <= st.x0) return [0, st.x0];
    if (x >= st.x1) return [st.x1, window.innerWidth];
    return [st.x0, st.x1];
  }
  /** Where he can play on what he's on: a level of the floor, or the surface. */
  const room = (s) => (s.key === 'floor' ? level(c.x) : span(s));
  // Room to bat a ball of yarn about: the floor, the Dock, a wide window.
  const roomy = (s) => !!s && room(s)[1] - room(s)[0] >= WIDE;

  // He's there when you arrive: sitting on the Dock, at his ease.
  {
    const st = surfaces[0].step;
    c.x = st ? rand(st.x0 + 80, st.x1 - 80) : 160;
    c.y = yAt(surfaces[0], c.x);
    c.face = Math.random() < 0.5 ? 1 : -1;
    c.yaw = c.face;
    c.lot = 1;
    c.lotF = rand(0, 80);
    c.plan = null;
    set('sit', rand(8, 12));
  }

  // ---------- Thinking ----------
  function reachable() {
    const here = surfaceOf(c.on);
    if (!here) return [];
    const [h0, h1] = span(here);
    const out = [];
    surfaces.forEach((s) => {
      if (s.key === here.key || s.hidden || s.x1 - s.x0 < 40) return;
      const [s0, s1] = span(s);
      if (s1 < s0) return;
      const lx = rand(s0, s1);
      const sy = yAt(s, lx);
      if (coveredAt(windows, s.layer, lx, sy)) return;
      const tx = clamp(lx - Math.sign(lx - c.x || 1) * 90, h0, h1);
      const up = c.y - sy;
      const across = Math.abs(lx - tx);
      if (up > MAX_UP || across > MAX_ACROSS || across < 12) return;
      out.push({ s, lx, tx, up });
    });
    return out;
  }

  function decide() {
    if (still) return set('sit', 1e6);
    const here = surfaceOf(c.on);
    const high = here && c.y < window.innerHeight * 0.62;
    const r = Math.random();
    const options = reachable();
    if (high && r < 0.22) return startButterfly();
    if (onBase() && r < 0.1) return startZoomies();
    if (onBase() && r < 0.18) return startMouse();
    if (roomy(here) && r < 0.28) return startYarn();
    if (here?.bed && r < 0.75) return set(Math.random() < 0.6 ? 'sleep' : 'loaf', rand(10, 20));
    // Bed time: somewhere cosy, if one is in reach.
    const beds = options.filter((o) => o.s.bed);
    if (beds.length && r < 0.36) {
      c.plan = { tx: beds[0].tx, jump: beds[0] };
      return set('walk');
    }
    if (options.length && r < 0.42) {
      options.sort((a, b) => b.up - a.up + rand(-120, 120));
      c.plan = { tx: options[0].tx, jump: options[0] };
      return set('walk');
    }
    if (here && r < 0.6) {
      const [a, b] = span(here);
      c.plan = { tx: clamp(c.x + rand(-260, 260), a, b) };
      return set('walk');
    }
    if (r < 0.76) return set('sit', rand(4, 8));
    if (r < 0.84) return set('loaf', rand(6, 10));
    if (r < 0.93) return set('groom', (sitAnim.frames - GROOM_AT) / sitAnim.fps);
    return set('sleep', rand(12, 22));
  }

  /** What next: one thing at a time. From sitting, lying or grooming he
   *  gets up first (the pose settles) before he walks, runs or plays. */
  function next() {
    const was = c.mode;
    decide();
    if (['sit', 'groom', 'loaf', 'pet', 'watch', 'stretch'].includes(was) && ['walk', 'zoom', 'yarn'].includes(c.mode)) {
      c.pending = c.mode;
      set('rise', was === 'idle' ? 0.25 : 0.6);
    }
  }

  function startZoomies() {
    // Off one side of the screen at full tilt, back in from the other, up
    // over the Dock and down again on the way. Starting up on the Dock, he
    // makes for its nearer end and gets down first.
    c.count = 0;
    const st = surfaces[0].step;
    const toRight = onFloor() && !onBase() && st ? st.x1 - c.x < c.x - st.x0 : c.x < window.innerWidth / 2;
    c.plan = { tx: toRight ? window.innerWidth + 120 : -120 };
    if (!c.super) say(pick(['!!!', 'zoomies.', 'brb.']));
    set('zoom');
  }

  /** Asked for the zoomies: wherever he is, he drops what he's doing and
   *  powers up (down low, shaking, the aura flaring), then, if he's up on
   *  something, leaps down to the floor, and goes. */
  function superZoomies() {
    if (c.mode === 'drag' || c.super) return;
    toys.yarn = null;
    toys.mouse = null;
    if (toys.fly) toys.fly.fade = true;
    c.watch = null;
    c.plan = null;
    c.pending = null;
    c.aimAt = null;
    c.super = true;
    say(pick(['!!!', 'power up.', 'hhhhHHHH']));
    if (c.on) set('charge', 1.1);
    else c.chargeNext = true; // mid-air: once he lands
  }

  function startYarn() {
    const here = surfaceOf(c.on);
    if (!roomy(here)) return set('sit', 3);
    const [a, b] = room(here);
    // Towards the side with more room.
    if ((c.face > 0 ? b - c.x : c.x - a) < 160) c.face = -c.face;
    const x = clamp(c.x + c.face * rand(70, 140), a + 10, b - 10);
    toys.yarn = { x, vx: 0, on: c.on.key, lo: a + 8, hi: b - 8, spin: 0, trail: [] };
    c.count = Math.round(rand(3, 5));
    set('yarn');
  }

  function startMouse() {
    // From the open end of his stretch of floor: it makes for the Dock, and
    // under it (where he can't follow).
    const st = surfaces[0].step;
    const left = st ? c.x <= st.x0 : Math.random() < 0.5;
    toys.mouse = { x: left ? -30 : window.innerWidth + 30, dir: left ? 1 : -1, t: 0 };
    say('!');
    set('watch', 0.6);
    c.watch = 'mouse';
  }

  function startButterfly() {
    // It flutters about a spot near him, never far (it fades out if it
    // strays past its leash, or when it's done).
    const home = { x: c.x + c.face * 70, y: c.y - 85 };
    toys.fly = { x: home.x + rand(-40, 40), y: home.y + rand(-20, 20), vx: 0, vy: 0, t: 0, life: rand(7, 11), home, alpha: 0, fade: false };
    c.watch = 'fly';
    set('watch', rand(3, 4.5));
  }

  function launch(target, lift = 34) {
    const apex = Math.min(c.y, target.y) - lift - Math.abs(target.x - c.x) * 0.12;
    const vy0 = -Math.sqrt(2 * G * Math.max(8, c.y - apex));
    const tUp = -vy0 / G;
    const tDown = Math.sqrt((2 * Math.max(4, target.y - apex)) / G);
    c.vx = (target.x - c.x) / (tUp + tDown);
    c.vy = vy0;
    c.face = Math.sign(c.vx) || c.face;
    c.on = null;
    c.sqv = -55; // the hind legs throw him: the body extends
    c.quick = false;
    set('air');
  }

  // ---------- Moving ----------
  function walkTo(tx, max, dt, here) {
    const lim = here ? span(here) : [-200, window.innerWidth + 200];
    const goal = clamp(tx, lim[0], lim[1]);
    const d = goal - c.x;
    const speed = Math.min(max, Math.abs(d) * 4 + 10);
    if (Math.abs(d) > 1) c.face = Math.sign(d);
    const nx = c.x + Math.sign(d) * Math.min(Math.abs(d), speed * dt);
    // Coming to the Dock's end with somewhere to go past it: a hop up onto
    // it, or down off it (taking off a stride short, so he clears its side),
    // and on he goes.
    const st = surfaces[0].step;
    if (onFloor() && st) {
      const sg = Math.sign(d);
      const ends = [st.x0, st.x1].filter((e) => (e - c.x) * sg > 0 && (goal - e) * sg > 0);
      const end = sg > 0 ? Math.min(...ends) : Math.max(...ends);
      if (ends.length && Math.abs(end - nx) < 32) {
        hop(sg, end);
        return { d, speed: 0 };
      }
    }
    c.x = nx;
    if (here?.el) c.on.dx = c.x - here.x0;
    return { d: goal - c.x, speed: Math.abs(d) > 1 ? speed : 0 };
  }

  /** Up onto the Dock or down off it, a short spring, then carry on with
   *  whatever he was doing. */
  function hop(dir, edge) {
    const x = edge + dir * 30;
    c.resume = { mode: c.mode, plan: c.plan, count: c.count };
    launch({ x, y: yAt(surfaces[0], x) }, 20);
  }

  function step(dt, now) {
    windows = readWindows();
    surfaces = readSurfaces(windows);
    const here = surfaceOf(c.on);
    const t = now / 1000;

    if (c.on && c.mode !== 'drag') {
      if (!here || (here.el && coveredAt(windows, here.layer, c.x, here.y))) {
        // What he stood on is gone (a window closed): down to the floor. Or a
        // window has come over it: he drops off, onto whatever's below.
        c.collapse = !here;
        c.on = null;
        c.vx = 0;
        c.vy = 0;
        c.plan = null;
        set('air');
      } else {
        c.y = here.el ? here.y : yAt(here, c.x);
        if (here.el) c.x = clamp(here.x0 + c.on.dx, here.x0 + 4, here.x1 - 4);
      }
    }
    stepToys(dt);

    if (c.mode === 'drag') {
      const d = c.drag;
      c.vx = (d.x - d.px) / Math.max(dt, 1e-3);
      c.vy = (d.y - d.py) / Math.max(dt, 1e-3);
      d.px = d.x;
      d.py = d.y;
      d.swing = approach(d.swing, clamp(-c.vx / 900, -0.9, 0.9), 6, dt);
      c.x = d.x;
      c.y = d.y + 58 * S;
      c.speed = 0;
      return;
    }

    if (c.mode === 'air') {
      c.vy += G * dt;
      const px = c.x;
      const py = c.y;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.x < 20 || c.x > window.innerWidth - 20) {
        c.vx *= -0.4;
        c.x = clamp(c.x, 20, window.innerWidth - 20);
      }
      // The Dock's side is a wall: below its top, he bumps off it.
      const st = surfaces[0].step;
      const inside = (x) => st && x > st.x0 && x < st.x1;
      if (st && c.y > st.y + 2 && inside(c.x) && !inside(px)) {
        c.x = px;
        c.vx *= -0.3;
      }
      if (c.vy > 0) {
        // (The floor is solid: anything below it is on it.)
        const hit = surfaces
          .filter((s) =>
            s.key === 'floor'
              ? c.y >= yAt(s, c.x)
              : !c.collapse && !coveredAt(windows, s.layer, c.x, s.y) && c.x > s.x0 + 4 && c.x < s.x1 - 4 && py <= s.y + 1 && c.y >= s.y,
          )
          .sort((a, b) => a.y - b.y)[0];
        if (hit) {
          c.y = hit.el ? hit.y : yAt(hit, c.x);
          c.on = { key: hit.key, dx: c.x - hit.x0 };
          c.impact = clamp(c.vy / 1400, 0.3, 1);
          c.sqv += 70 + 70 * c.impact; // the landing runs through him
          c.vx = 0;
          c.vy = 0;
          c.swat = false;
          c.thrown = false;
          c.collapse = false;
          set('land', 0.22 + 0.14 * c.impact);
        }
      }
      c.speed = 0;
      return;
    }

    let speed = 0;
    switch (c.mode) {
      case 'walk':
      case 'chase': {
        const run = c.mode === 'chase';
        const m = walkTo(run ? pointer.x : c.plan?.tx ?? c.x, run ? RUN : WALK, dt, here);
        speed = m.speed;
        if (c.mode === 'air') break; // a hop onto or off the Dock
        if (Math.abs(m.d) < 1.5) {
          if (run) {
            if (c.laser && Math.abs(pointer.y - c.y) > 30) {
              const s = surfaces
                .filter((q) => pointer.x > q.x0 + 10 && pointer.x < q.x1 - 10 && q.y >= pointer.y - 10)
                .sort((a, b) => a.y - b.y)[0];
              if (s && s.key !== c.on?.key && c.y - s.y < MAX_UP) {
                c.plan = { jump: { s, lx: pointer.x } };
                c.aimAt = { x: pointer.x, y: s.y };
                c.quick = true;
                set('crouch', 0.3);
              }
            }
          } else if (c.plan?.jump) {
            // Stop, look at where he's going, and only then get down.
            const j = c.plan.jump;
            c.face = Math.sign(j.lx - c.x) || c.face;
            c.aimAt = { x: j.lx, y: yAt(j.s, j.lx) };
            set('aim', rand(0.4, 0.8));
          } else {
            c.plan = null;
            set('idle', rand(0.8, 2.2));
          }
        }
        break;
      }
      case 'zoom': {
        // Flat out along the floor; off the edge, back in from the other side.
        const m = walkTo(c.plan.tx, c.super ? ZOOM * 1.4 : ZOOM, dt, null);
        speed = m.speed;
        if (c.mode === 'air') break;
        if (Math.abs(m.d) < 2) {
          if (c.count === 0) {
            c.count = 1;
            c.x = c.plan.tx < 0 ? window.innerWidth + 100 : -100;
            c.on = { key: 'floor', dx: 0 };
            c.plan = { tx: rand(200, window.innerWidth - 300) };
          } else {
            set('sit', rand(2, 3));
            say(pick(['…what?', 'anyway.', '*pant*']));
            c.super = false;
          }
        }
        break;
      }
      case 'yarn': {
        // Up to the yarn, a swipe, after it again.
        const y = toys.yarn;
        if (!y) {
          set('idle', 1);
          break;
        }
        if (Math.abs(y.vx) < 25) {
          const m = walkTo(clamp(y.x - c.face * 22, y.lo + 4, y.hi - 4), RUN * 0.6, dt, here);
          speed = m.speed;
          c.face = Math.sign(y.x - c.x) || c.face;
          if (Math.abs(m.d) < 2 && c.bat <= 0) {
            c.bat = 1;
            y.vx = c.face * rand(260, 420);
            c.count -= 1;
          }
        }
        if (c.count <= 0 && Math.abs(y.vx) < 25) {
          toys.yarn = null;
          set('sit', 3);
        }
        break;
      }
      case 'hunt': {
        const mo = toys.mouse;
        if (!mo) {
          set('sit', 2);
          break;
        }
        const m = walkTo(mo.x - c.face * 60, RUN * 1.15, dt, null);
        speed = m.speed;
        if (c.mode === 'air') break;
        if (Math.abs(mo.x - c.x) < 120 && !c.pounced) {
          c.pounced = true;
          const [a, b] = level(c.x);
          c.plan = { jump: { s: surfaces[0], lx: clamp(mo.x + mo.dir * 40, a + 10, b - 10) } };
          c.quick = true;
          set('crouch', 0.18);
        }
        break;
      }
      case 'charge':
        if (t > c.until) {
          // On the floor, off he goes (from the Dock, he runs off its end).
          if (onFloor()) startZoomies();
          else {
            // Down from wherever he is to the floor proper, not the Dock,
            // landing a little ahead, and off.
            const st = surfaces[0].step;
            let x = clamp(c.x + c.face * rand(60, 140), 40, window.innerWidth - 40);
            if (st && x > st.x0 - 30 && x < st.x1 + 30) x = x - st.x0 < st.x1 - x ? st.x0 - rand(40, 90) : st.x1 + rand(40, 90);
            x = clamp(x, 30, window.innerWidth - 30);
            launch({ x, y: floorY() });
            c.collapse = true; // straight down past everything to the floor
            c.zoomNext = true;
          }
        }
        break;
      case 'aim':
        if (t > c.until) set('crouch', rand(0.5, 0.75));
        break;
      case 'rise':
        if (t > c.until) {
          set(c.pending || 'idle', c.pending ? 0 : 0.5);
          c.pending = null;
        }
        break;
      case 'crouch':
        if (t > c.until) {
          const j = c.plan?.jump;
          if (j) {
            launch({ x: j.lx, y: yAt(j.s, j.lx) });
          }
          else set('idle', 0.5);
          c.plan = null;
          c.aimAt = null;
        }
        break;
      case 'land':
        if (c.chargeNext) {
          c.chargeNext = false;
          c.resume = null;
          set('charge', 1.1);
        } else if (c.zoomNext) {
          c.zoomNext = false;
          c.resume = null;
          startZoomies();
        } else if (c.resume) {
          // Down from a hop: straight on with what he was doing.
          const r = c.resume;
          c.resume = null;
          c.plan = r.plan;
          c.count = r.count;
          set(r.mode);
        } else if (t > c.until) {
          if (toys.mouse && c.pounced) {
            say(pick(['missed.', 'next time.', '…']));
            c.pounced = false;
            set('sit', 2.5);
          } else set(c.laser ? 'chase' : 'idle', rand(0.5, 1.5));
        }
        break;
      case 'watch':
        if (t > c.until) {
          if (c.watch === 'mouse') {
            c.pounced = false;
            set('hunt');
          } else if (c.watch === 'fly' && toys.fly) {
            // A swat: up on the hind legs and a hop at it.
            c.vx = 0;
            c.vy = -Math.sqrt(2 * G * 60);
            c.on = null;
            c.swat = true;
            set('air');
            toys.fly.flee = true;
          } else set('idle', 1);
          c.watch = null;
        }
        break;
      case 'pet':
        if (t > c.until) set('sit', rand(2, 4));
        break;
      default:
        if (t > c.until && c.lot > 0.5 && c.lotF > GROOM_AT - 4 && c.lotF < sitAnim.frames - 3) {
          // Mid-groom: he finishes washing before he does anything else.
          c.until = t + (sitAnim.frames - c.lotF) / sitAnim.fps;
        } else if (t > c.until && held) {
          c.until = t + 0.5;
        } else if (t > c.until) {
          if (c.mode === 'sleep') {
            // Up, a long front stretch and a yawn.
            set('stretch', 2.1);
            c.yawn = 1;
          } else if (c.laser) set('chase');
          else next();
        }
    }
    c.speed = approach(c.speed, speed, 8, dt);
    c.accel = approach(c.accel, (c.speed - c.prevV) / Math.max(dt, 1e-3), 10, dt);
    c.prevV = c.speed;
    c.phase = (c.phase + (c.speed * dt) / clamp(32 + c.speed * 0.18, 34, 120)) % 1;
    c.bat = Math.max(0, c.bat - dt * 3);
  }

  function stepToys(dt) {
    const y = toys.yarn;
    if (y) {
      const s = surfaces.find((q) => q.key === y.on);
      if (!s) toys.yarn = null;
      else {
        y.x += y.vx * dt;
        y.vx *= Math.exp(-dt * 2.2);
        if (y.x < y.lo || y.x > y.hi) {
          y.vx *= -0.6;
          y.x = clamp(y.x, y.lo, y.hi);
        }
        y.spin += (y.vx * dt) / 9;
        y.y = yAt(s, y.x);
        y.trail.unshift([y.x, y.y]);
        y.trail.length = Math.min(y.trail.length, 22);
      }
    }
    const mo = toys.mouse;
    if (mo) {
      mo.t += dt;
      mo.x += mo.dir * (mo.t < 0.6 ? 60 : 300) * dt;
      const st = surfaces[0].step;
      if (mo.x < -60 || mo.x > window.innerWidth + 60 || (st && mo.x > st.x0 + 6 && mo.x < st.x1 - 6)) {
        toys.mouse = null;
        if (c.mode === 'hunt') {
          say('…');
          set('sit', 2.5);
        }
      }
    }
    const f = toys.fly;
    if (f) {
      // Fluttering: little random pushes, a pull back to its spot, drag.
      f.t += dt;
      f.home.x = approach(f.home.x, c.x + c.face * 70, 0.5, dt);
      f.vx += (rand(-1, 1) * 900 + (f.home.x - f.x) * 2.2) * dt;
      f.vy += (rand(-1, 1) * 900 + (f.home.y - f.y) * 2.2 - (f.flee ? 500 : 0)) * dt;
      const drag = Math.exp(-2.2 * dt);
      f.vx *= drag;
      f.vy *= drag;
      f.x += f.vx * dt;
      f.y += f.vy * dt + Math.sin(f.t * 13) * 0.35;
      const away = Math.hypot(f.x - f.home.x, f.y - f.home.y);
      if (f.flee || f.t > f.life || away > LEASH) f.fade = true;
      f.alpha = f.fade ? f.alpha - dt / 0.9 : Math.min(1, f.alpha + dt / 0.6);
      if (f.fade && f.alpha <= 0) toys.fly = null;
    }
  }

  // ---------- The rig ----------
  function poseOf() {
    switch (c.mode) {
      case 'aim':
      case 'crouch':
      case 'land':
      case 'sit':
      case 'groom':
      case 'loaf':
      case 'sleep':
      case 'stretch':
      case 'air':
      case 'drag':
        return c.mode;
      case 'pet':
      case 'watch':
        return 'sit';
      case 'charge':
        return 'crouch';
      default:
        return 'stand';
    }
  }

  /** A paw's place in a gait: ahead of or behind its hip/shoulder, and its lift. */
  function footRel(gait, k, L) {
    const d = gait.duty;
    const q = (((c.phase + gait.off[k]) % 1) + 1) % 1;
    if (q < d) return [L * (d / 2 - q), 0];
    const u = (q - d) / (1 - d);
    const e = u * u * (3 - 2 * u);
    return [L * (-d / 2 + d * e), -(k[1] === 'f' ? gait.lift[0] : gait.lift[1]) * Math.sin(Math.PI * u)];
  }

  function updateRig(dt, t) {
    const name = poseOf();
    const want = POSES[name];
    const rate = RATES[name] ?? 8;
    Object.keys(want).forEach((k) => {
      if (k === 'ta') P.ta += wrap(want.ta - P.ta) * (1 - Math.exp(-rate * dt));
      else P[k] = approach(P[k], want[k], rate, dt);
    });
    const grounded = name !== 'air' && name !== 'drag';
    const v = grounded ? c.speed : 0;
    const w = ss(3, 25, v);
    const wW = 1 - ss(85, 115, v);
    const wG = ss(230, 275, v);
    const wT = Math.max(0, 1 - wW - wG);
    const TAU = Math.PI * 2;
    const ph = c.phase;

    // The body over the gait: in the walk, the hips rise as a hind leg passes
    // under them and the shoulders as a foreleg does; the trot bounces once
    // per step; the gallop gathers, stretches and rocks.
    let hdx = 0;
    let hdy = 0;
    let sdx = 0;
    let sdy = 0;
    let arch = 0;
    let ndy = 0;
    if (w > 0.001) {
      const trot = 1.4 * Math.cos(2 * TAU * (ph - 0.21));
      const gal = -2.2 * Math.cos(2 * TAU * (ph - 0.38)) + 1.5;
      const flex = Math.cos(TAU * (ph - 0.3));
      const rock = 1.6 * Math.sin(TAU * (ph - 0.05));
      hdy = w * (wW * -Math.cos(2 * TAU * (ph - 0.32)) + wT * trot + wG * (gal + rock));
      sdy = w * (wW * -Math.cos(2 * TAU * (ph - 0.57)) + wT * trot + wG * (gal - rock));
      hdx = -w * wG * (3.5 * flex + 2);
      sdx = w * wG * (3.5 * flex + 2);
      arch = -w * wG * 5 * flex;
      ndy = sdy * (0.3 + 0.25 * wG); // the head stays steady
    }
    c.sqv += (-300 * c.sq - 18 * c.sqv) * dt;
    c.sq += c.sqv * dt;
    hdy += c.sq;
    sdy += c.sq * 1.15;
    ndy += c.sq * 0.6;
    // Before a jump: the hind end shuffles, then freezes.
    const wig = c.mode === 'crouch' && !c.quick && c.until - t > 0.12 ? Math.sin(t * 21) : 0;

    const H = [P.hx + hdx + wig * 1.3, P.hy + hdy];
    const Sh = [P.sx + sdx, P.sy + sdy];
    let dx = Sh[0] - H[0];
    let dy = Sh[1] - H[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const nx = dy;
    const ny = -dx;
    const A = P.arch + arch;
    const C = [(H[0] + Sh[0]) / 2 + nx * A, (H[1] + Sh[1]) / 2 + ny * A];
    const breathe = (1 - w) * Math.sin(t * 2.3) * 0.35;
    const spine = [];
    const rT = [];
    const rB = [];
    for (let i = 0; i < 12; i += 1) {
      const u = i / 11;
      const m = 1 - u;
      spine.push([m * m * H[0] + 2 * m * u * C[0] + u * u * Sh[0], m * m * H[1] + 2 * m * u * C[1] + u * u * Sh[1]]);
      const s = Math.sin(Math.PI * u);
      // A deep chest, a round belly: the body is most of him.
      rT.push(lerp(8.6, 9, u) - 0.6 * s + breathe * 0.5);
      rB.push(lerp(10, 10.6, u) + 1.6 * s + breathe);
    }
    const head = [Sh[0] + P.nx, Sh[1] + P.ny + ndy];
    const Jf = [Sh[0] + 2, Sh[1] + 5];
    const Jh = [H[0] + 1, H[1] + 4];

    // Where the paws want to be.
    const rest = {
      nf: [P.sx + P.fx, 0],
      xf: [P.sx + P.fx - 2.5, 0],
      nh: [P.hx + P.bx, 0],
      xh: [P.hx + P.bx - 2.5 * (1 - P.hock), 0],
    };
    if (name === 'air') {
      if (c.thrown) {
        Object.assign(rest, { nf: [P.sx + 7, 3], xf: [P.sx + 3, 3], nh: [P.hx - 3, 3], xh: [P.hx + 1, 3] });
      } else if (c.swat) {
        const s = Math.sin(t * 16) * 4;
        Object.assign(rest, { nf: [P.sx + 10 + s, P.sy - 16], xf: [P.sx + 7 - s, P.sy - 13], nh: [P.hx + 1, 0], xh: [P.hx - 1.5, 0] });
      } else {
        // Rising: forelegs reach for the target, hind legs trail from the push.
        // Falling: forelegs reach down to land first, hind legs come under.
        const k = clamp((c.vy + 200) / 700, 0, 1);
        const mix = (a, b) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
        Object.assign(rest, {
          nf: mix([P.sx + 16, -17], [P.sx + 9, 2]),
          xf: mix([P.sx + 13, -15], [P.sx + 6, 1]),
          nh: mix([P.hx - 15, -8], [P.hx + 5, -5]),
          xh: mix([P.hx - 13, -6], [P.hx + 3, -4]),
        });
      }
    } else if (name === 'drag') {
      const s = Math.sin(t * 2.5) * 1.5;
      Object.assign(rest, { nf: [8, 40], xf: [4, 39], nh: [2 + s, 76], xh: [-2 + s, 75] });
    }
    const L = clamp(32 + c.speed * 0.18, 34, 120) / S;
    const gaits = [
      [GAITS.walk, wW],
      [GAITS.trot, wT],
      [GAITS.gallop, wG],
    ];
    c.groom = approach(c.groom, c.mode === 'groom' ? 1 : 0, 5, dt);
    const swing = {}; // 0 planted .. 1 at the top of a step
    LEGS.forEach((k) => {
      const fore = k[1] === 'f';
      let [x, y] = rest[k];
      if (P.tuck > 0.01) {
        const j = fore ? Jf : Jh;
        x = lerp(x, j[0] + 3, P.tuck);
        y = lerp(y, j[1] + 5, P.tuck);
      }
      if (w > 0.001) {
        let gx = 0;
        let gy = 0;
        gaits.forEach(([gait, wt]) => {
          if (wt <= 0) return;
          const [r, yy] = footRel(gait, k, L);
          gx += r * wt;
          gy += yy * wt;
        });
        const base = (fore ? P.sx + 2 : P.hx + 1) - (k[0] === 'x' ? 2.5 : 0);
        x = lerp(x, base + gx, w);
        y = lerp(y, gy, w);
      }
      swing[k] = grounded ? clamp(-y / 6, 0, 1) * w : 0;
      if (wig && !fore) y -= Math.max(0, wig * (k === 'nh' ? 1 : -1)) * 1.6;
      if (k === 'nf' && c.bat > 0) {
        const b = Math.sin(Math.PI * c.bat);
        x += 12 * b;
        y -= 16 * b;
      }
      if (k === 'nf' && c.groom > 0.01) {
        // A paw up to the mouth, licked, wiped over the face.
        const s = Math.sin(t * 7);
        x = lerp(x, head[0] + 4 + s, c.groom);
        y = lerp(y, head[1] + 10 + 2.5 * s, c.groom);
      }
      const f = F[k];
      if (grounded && w > 0.02) {
        f[0] = x;
        f[1] = y;
      } else {
        const r = name === 'land' ? 30 : name === 'air' ? 14 : 12;
        f[0] = approach(f[0], x, r, dt);
        f[1] = approach(f[1], y, r, dt);
      }
      if (grounded) f[1] = Math.min(f[1], 0);
    });

    const legs = {};
    LEGS.forEach((k) => {
      const f = F[k];
      if (k[1] === 'f') {
        // (The paw is a ball of radius PAW resting on the ground.)
        // Lifted, the wrist folds and the paw hangs back under it.
        const [ex, ey, px, py] = ik(Jf[0], Jf[1], f[0], f[1] - PAW, FORE[0], FORE[1], 1);
        const sw = swing[k];
        legs[k] = { pts: [Jf, [ex, grounded ? Math.min(ey, -PAW - 1) : ey], [px, py], [px + lerp(1.8, -1.2, sw), py + 1.4 * sw]], r: [5.2, 3.6, 3.2, PAW] };
      } else {
        // The long hind foot: slanting down to the paw when it's planted;
        // lifted, it folds, the paw swinging back under the hock (a cat
        // picks its hind feet up, it doesn't drag them); far behind, at the
        // end of a push, the hock rises onto the toes.
        const sw = swing[k];
        const push = grounded ? clamp((Jh[0] - f[0] - 4) / 8, 0, 1) * (1 - sw) * w : 0;
        let mx = lerp(lerp(HOCK[0], 2.5, sw), -7.5, P.hock);
        let my = lerp(lerp(HOCK[1] - 1.5 * push, -8, sw), -2, P.hock);
        if (P.hs > 0.01) {
          const ddx = Jh[0] - f[0];
          const ddy = Jh[1] - f[1];
          const dd = Math.hypot(ddx, ddy) || 1;
          const foot = Math.hypot(HOCK[0], HOCK[1]);
          mx = lerp(mx, (ddx / dd) * foot, P.hs);
          my = lerp(my, (ddy / dd) * foot, P.hs);
        }
        let [kx, ky, qx, qy] = ik(Jh[0], Jh[1], f[0] + mx, f[1] - PAW + my, HIND[0], HIND[1], -1);
        // Sitting, the thigh folds forward and up into the haunch; and a
        // knee never goes through the floor.
        kx = lerp(kx, Jh[0] + 8, P.hock);
        ky = lerp(ky, Jh[1] - 1, P.hock);
        if (grounded) ky = Math.min(ky, -4);
        const paw = [qx - mx, qy - my];
        legs[k] = { pts: [Jh, [kx, ky], [qx, qy], paw, [paw[0] + 1.8, paw[1]]], r: [8, 4.4, 3.2, 3, PAW] };
      }
    });

    // The tail: each segment sprung toward the pose's curve plus a slow wave
    // (or the tip's twitch when he's intent), thrown about by his moves.
    // Two waves travel down it at different speeds, so it never repeats, and
    // the tip curls and uncurls: a lazy twirl at rest, a flick when intent.
    let amp = 0.2;
    let om = 1.6;
    let tip = false;
    let curl = 0.8;
    if (name === 'sleep' || name === 'loaf') {
      amp = 0.03;
      om = 0.9;
      curl = 0.15;
    } else if (['watch', 'aim', 'crouch', 'hunt', 'charge'].includes(c.mode)) {
      amp = 0.32;
      om = 7;
      tip = true;
      curl = 0.2;
    } else if (c.mode === 'pet') {
      amp = 0.07;
      om = 24;
      tip = true;
    } else if (name === 'drag') {
      amp = 0.32;
      om = 4.5;
    } else if (wG > 0.5 && w > 0.5) {
      amp = 0.14;
      om = 6;
      curl = 0.2;
    } else if (name === 'sit' || name === 'groom') {
      amp = 0.16;
      om = 1.3;
      curl = 0.9;
    }
    const push = grounded ? c.accel : 0;
    // The tip winds and unwinds on its own slow clock: a lazy swirl.
    const coil = 1 + curl * Math.sin(t * 1.1);
    const sub = dt / 2;
    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < TAIL_N; i += 1) {
        const u = (i + 1) / TAIL_N;
        const hook = i >= TAIL_N - 5 ? P.th * coil * 0.8 * (i - (TAIL_N - 6)) : 0;
        const wave =
          amp * Math.sin(om * t - i * 0.42) * (tip ? ss(TAIL_N - 7, TAIL_N - 1, i) : u) +
          amp * 0.6 * Math.sin(om * 0.53 * t + 1.7 - i * 0.25) * u;
        const tgt = P.ta + P.tc * i + hook + wave;
        const K = 120 - i * 5;
        const torque = (push * Math.sin(ta[i]) * 0.012 + c.sqv * Math.cos(ta[i]) * 0.06) * u;
        tv[i] += (K * wrap(tgt - ta[i]) - 7 * tv[i] + torque) * sub;
        ta[i] += tv[i] * sub;
      }
    }
    const tail = [[H[0] - dx * 7 + nx * 4.5, H[1] - dy * 7 + ny * 4.5]];
    const tailR = [3];
    for (let i = 0; i < TAIL_N; i += 1) {
      const p = tail[i];
      const r = lerp(3, 1.9, (i + 1) / TAIL_N);
      const q = [p[0] + Math.cos(ta[i]) * TAIL_SEG, p[1] + Math.sin(ta[i]) * TAIL_SEG];
      if (grounded) q[1] = Math.min(q[1], -r);
      tail.push(q);
      tailR.push(r);
    }

    // Where he looks: a toy, the jump he's sizing up, else you when near.
    const hw = [c.x + c.face * head[0] * S, c.y + head[1] * S];
    let tgt = null;
    let toy = true;
    if (toys.fly) tgt = [toys.fly.x, toys.fly.y];
    else if (toys.mouse) tgt = [toys.mouse.x, c.y - 6];
    else if (toys.yarn) tgt = [toys.yarn.x, toys.yarn.y - 8];
    else if (c.aimAt && (c.mode === 'aim' || c.mode === 'crouch')) tgt = [c.aimAt.x, c.aimAt.y];
    else {
      toy = false;
      if (c.laser || Math.hypot(pointer.x - hw[0], pointer.y - hw[1]) < 380) tgt = [pointer.x, pointer.y];
    }
    let lx = 0;
    let ly = 0;
    let tilt = 0;
    let turn = lerp(P.turn, 0.55, w);
    const resting = ['stand', 'sit', 'loaf'].includes(name) && w < 0.2;
    if (tgt && name !== 'sleep' && name !== 'drag') {
      const ddx = (tgt[0] - hw[0]) * c.face;
      const ddy = tgt[1] - hw[1];
      lx = clamp(ddx / 90, -1, 1);
      ly = clamp(ddy / 90, -1, 1);
      tilt = clamp(Math.atan2(ddy, Math.abs(ddx) + 60) * 0.4, -0.35, 0.25);
      if (!toy && resting) turn = 0.06; // he looks round at you
    }
    c.lookX = approach(c.lookX, lx, 10, dt);
    c.lookY = approach(c.lookY, ly, 10, dt);
    c.lookTilt = approach(c.lookTilt, tilt, 6, dt);
    c.turn = approach(c.turn, turn, 6, dt);

    // Eyes: blinks (sometimes a double), the slow blink a cat gives someone
    // it trusts, pupils wide when he's excited.
    c.nextBlink -= dt;
    if (c.nextBlink < 0) {
      c.blink = 1;
      c.nextBlink = Math.random() < 0.2 ? 0.28 : rand(2.5, 6);
    }
    c.blink = Math.max(0, c.blink - dt * 6);
    c.nextSlow -= dt;
    if (c.nextSlow < 0) {
      if (resting && tgt && !toy) c.slow = 1;
      c.nextSlow = rand(6, 12);
    }
    c.slow = Math.max(0, c.slow - dt / 1.6);
    const excited = ['watch', 'aim', 'crouch', 'hunt', 'charge', 'zoom', 'chase', 'yarn', 'air'].includes(c.mode);
    c.pupil = approach(c.pupil, excited ? 1.5 : 0.9, 5, dt);
    c.purr = approach(c.purr, c.mode === 'pet' ? 1 : 0, 6, dt);
    c.ears = approach(c.ears, P.ears + (c.mode === 'zoom' || c.mode === 'charge' || c.thrown ? 0.7 : 0), 8, dt);
    c.nextEar -= dt;
    if (c.nextEar < 0) {
      c.earTw = 1;
      c.nextEar = rand(3, 8);
    }
    c.earTw = Math.max(0, c.earTw - dt * 5);
    c.mouth = Math.max(0, c.mouth - dt * 2.5);
    c.yawn = Math.max(0, c.yawn - dt / 1.8);
    // Powered up: the aura builds while he charges and fades once he's done;
    // his eyes go from green to the aura's colours, cycling through them.
    if (c.super && !['charge', 'zoom', 'air', 'land', 'drag'].includes(c.mode)) c.super = false; // something else took over
    c.ssj = approach(c.ssj, c.super ? 1 : 0, c.super ? 3 : 1.4, dt);
    const glow = cycle(SSJ, t * 1.6);
    eyeGlow = css(glow);
    eyeFill = c.ssj > 0.01 ? css(mixRgb(rgbOf(EYE), glow, c.ssj)) : EYE;

    // Turning round: he swings through facing you (head first), never a flip.
    c.yaw = approach(c.yaw, c.face, 5, dt);
    c.tn = c.turn * clamp(Math.abs(c.yaw) * 1.3, 0, 1);
    let pitch = 0;
    if (name === 'air') {
      pitch = c.swat ? -0.55 : c.thrown ? clamp(c.vx / 1500, -0.4, 0.4) : clamp(Math.atan2(c.vy, Math.abs(c.vx) + 60), -0.9, 0.9) * 0.55;
    }
    c.pitch = approach(c.pitch, pitch, name === 'air' ? 8 : 12, dt);

    const groomNod = c.groom * 0.12 * Math.sin(t * 7);
    const sleeping = name === 'sleep';
    let open = P.lid * (1 - Math.sin(Math.PI * c.blink)) * (1 - 0.92 * Math.sin(Math.PI * c.slow) ** 0.6);
    if (c.purr > 0.5) open = 0;
    R = {
      grounded,
      spine,
      rT,
      rB,
      H,
      Sh,
      head,
      headTilt: P.tilt + c.lookTilt + groomNod,
      haunch: P.haunch,
      legs,
      tail,
      tailR,
      open: sleeping ? 0 : open,
      happy: c.purr > 0.5,
      mouth: Math.max(c.mouth * 0.5, Math.sin(Math.PI * (1 - c.yawn)) * (c.yawn > 0 ? 1 : 0)),
    };
    c.box = [Math.min(H[0] - 12, head[0] - 14), Math.max(Sh[0] + 12, head[0] + 14), head[1] - 20];

    // Sitting (once he's down) and grooming are the animation: crossfade in,
    // play it (grooming from its paw-licking), crossfade out when he gets up.
    const seated = (c.mode === 'sit' || c.mode === 'groom') && grounded && P.haunch > 0.85;
    if (seated && c.lot < 0.02) c.lotF = c.mode === 'groom' ? GROOM_AT : 0;
    c.lot = approach(c.lot, seated ? 1 : 0, seated ? 9 : 16, dt);
    if (c.lot > 0.01) c.lotF = (c.lotF + dt * sitAnim.fps) % sitAnim.frames;
    if (c.lot > 0.5) c.box = [-40 / S, 40 / S, -100 / S];
  }

  // ---------- Drawing ----------
  // Head, front view (x towards the side he faces); c.tn turns it from facing
  // you (0) towards profile (1). His are a young cat's: tall ears set wide,
  // a wedge of a face to a small chin, almond eyes.
  function earPts(side) {
    const fx = c.tn * 4;
    const e = c.ears + (side > 0 ? c.earTw * 0.45 : 0);
    const sh = fx * (side > 0 ? 0.45 : 0.2);
    return [
      [side * 2.6 + sh, -6.5],
      [side * (9.4 + 4 * e) + sh, -16.5 + 6 * e],
      [side * 10 + sh, -1.5],
    ];
  }

  function earPath(b0, tip, b1) {
    const k = 0.34; // a softly rounded tip
    g.beginPath();
    g.moveTo(b0[0], b0[1]);
    g.lineTo(tip[0] + (b0[0] - tip[0]) * k, tip[1] + (b0[1] - tip[1]) * k);
    g.quadraticCurveTo(tip[0], tip[1], tip[0] + (b1[0] - tip[0]) * k, tip[1] + (b1[1] - tip[1]) * k);
    g.lineTo(b1[0], b1[1]);
    g.closePath();
    g.fill();
  }

  // His head, front view (x towards the side he faces); c.tn turns it from
  // facing you (0) towards profile (1). Flat black like the animation he sits
  // in: small and round, full cheeks, small ears set wide.
  function headShape() {
    const tn = c.tn;
    const fx = tn * 4;
    g.beginPath();
    g.ellipse(fx * 0.3, -0.5, 9.4, 8.2, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(fx * 0.6, 2.6, 8.8 - tn * 1.2, 5.8, 0, 0, Math.PI * 2);
    g.fill();
    earPath(...earPts(-1));
    earPath(...earPts(1));
  }

  /** A narrow almond eye, its outer corner (side) swept up: green, a thin
   *  black slit. Powered up, it takes the aura's colour and glows. */
  function eye(ex, ey, sx, side, open) {
    if (open < 0.14) return; // shut: just black, like the rest of him
    const rx = 2.9 * sx;
    const ry = 1.5;
    const lift = 1.2;
    g.save();
    g.translate(ex, ey);
    g.scale(1, open);
    g.beginPath();
    g.moveTo(-rx * side, 0.6);
    g.bezierCurveTo(-rx * 0.45 * side, -ry * 1.2, rx * 0.45 * side, -ry * 1.25 - lift, rx * side, -lift);
    g.bezierCurveTo(rx * 0.5 * side, ry * 1.05 - lift * 0.6, -rx * 0.45 * side, ry * 1.15, -rx * side, 0.6);
    g.closePath();
    g.fillStyle = eyeFill;
    if (c.ssj > 0.01) {
      g.shadowColor = eyeGlow;
      g.shadowBlur = 6 * c.ssj * dpr;
    }
    g.fill();
    g.shadowBlur = 0;
    g.clip();
    g.fillStyle = INK;
    g.beginPath();
    g.ellipse(c.lookX * 1.1 * sx, c.lookY * 0.4 - lift * 0.4, rx * 0.26 * c.pupil, ry * 1.6, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  function face() {
    const tn = c.tn;
    const fx = tn * 4;
    eye(fx - 4.2 * (1 - tn * 0.4), 0.2, 1 - tn * 0.4, -1, R.open);
    eye(fx + 4.2 * (1 - tn * 0.12), 0.2, 1, 1, R.open);
  }

  function drawCat() {
    // Turning round, the body foreshortens through facing you and swaps
    // sides behind the head, which turns to you and on round: a 3/4 turn.
    const sgn = c.yaw >= 0 ? 1 : -1;
    const bs = sgn * (0.4 + 0.6 * Math.abs(c.yaw));
    const pc = Math.cos(c.pitch);
    const ps = Math.sin(c.pitch);
    const hx = pc * R.head[0] - ps * (R.head[1] + 18);
    const hy = ps * R.head[0] + pc * (R.head[1] + 18) - 18;
    const headAt = () => {
      g.translate(bs * hx, hy);
      g.scale(sgn, 1);
      g.rotate(R.headTilt + c.pitch);
    };
    g.fillStyle = INK;
    g.save();
    g.scale(bs, 1);
    if (c.pitch) {
      g.translate(0, -18);
      g.rotate(c.pitch);
      g.translate(0, 18);
    }
    LEGS.forEach((k) => {
      const l = R.legs[k];
      tube(g, l.pts, l.r, l.r, false); // smooth through the joints, round at the ends
    });
    tube(g, R.spine, R.rT, R.rB, false);
    if (R.haunch > 0.02) {
      g.beginPath();
      g.ellipse(R.H[0] + 4, Math.min(R.H[1] + 2, -9.5 * R.haunch), 12.5 * R.haunch, 9.5 * R.haunch, -0.3, 0, Math.PI * 2);
      g.fill();
    }
    tube(g, R.tail, R.tailR, R.tailR, true);
    tube(g, [[R.Sh[0] + 1, R.Sh[1] - 2], [R.head[0], R.head[1] + 4]], [7.2, 7.2], [7.6, 7.6], true);
    g.restore();
    g.save();
    headAt();
    headShape();
    face();
    g.restore();
  }

  function drawToys(t) {
    const y = toys.yarn;
    if (y) {
      ctx.strokeStyle = '#d0485c';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      y.trail.forEach(([x, yy], i) => (i ? ctx.lineTo(x, yy - 1) : ctx.moveTo(x, yy - 1)));
      ctx.stroke();
      const r = 9;
      ctx.save();
      ctx.translate(y.x, y.y - r);
      ctx.rotate(y.spin);
      const gr = ctx.createRadialGradient(-3, -3, 1, 0, 0, r);
      gr.addColorStop(0, '#f27b8e');
      gr.addColorStop(1, '#b3304a');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.9;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.95, r * 0.3 + Math.abs(i) * 1.5, i * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    const m = toys.mouse;
    if (m) {
      ctx.save();
      ctx.translate(m.x, floorY());
      ctx.scale(m.dir, 1);
      const bob = Math.abs(Math.sin(m.t * 30)) * 1.2;
      ctx.strokeStyle = '#8a8590';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.quadraticCurveTo(-18, -2 - bob, -24, -8);
      ctx.stroke();
      ctx.fillStyle = '#a7a2ad';
      ctx.beginPath();
      ctx.ellipse(0, -5 - bob, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(2, -10 - bob, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2a7b4';
      ctx.beginPath();
      ctx.arc(9, -5 - bob, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(5.5, -7 - bob, 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const f = toys.fly;
    if (f) drawButterfly(f, t);
  }

  /** A monarch, seen from above: fore and hind wings, orange in black
   *  borders with white spots, closing and opening as it beats. */
  function drawButterfly(f, t) {
    const beat = 0.18 + 0.82 * Math.abs(Math.cos(t * 13 + f.t));
    ctx.save();
    ctx.globalAlpha = Math.max(0, f.alpha);
    ctx.translate(f.x, f.y);
    ctx.rotate(clamp(f.vx / 400, -0.5, 0.5));
    ctx.scale(1.15, 1.15);
    [1, -1].forEach((side) => {
      ctx.save();
      ctx.scale(side * beat, 1);
      const fore = new Path2D('M0.6 -1.2C3 -7 9 -10.5 13 -9.4C14.6 -8.9 14.4 -6 13 -3.6C10.6 0.2 5 0.8 0.6 0.4Z');
      const hind = new Path2D('M0.6 0.2C4.2 0.6 9.2 1.8 9.8 5.2C10.2 8 7 9.8 4.4 9C2.2 8.2 0.8 5 0.4 2Z');
      const gr = ctx.createLinearGradient(0, -8, 12, 6);
      gr.addColorStop(0, '#f7a33a');
      gr.addColorStop(1, '#d4581a');
      ctx.fillStyle = gr;
      ctx.strokeStyle = '#1a120c';
      ctx.lineWidth = 1.3;
      ctx.lineJoin = 'round';
      [hind, fore].forEach((w) => {
        ctx.fill(w);
        ctx.stroke(w);
      });
      // Veins and the white spots along the borders.
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(1, -0.6);
      ctx.lineTo(11, -7.6);
      ctx.moveTo(1, -0.2);
      ctx.lineTo(12, -3.8);
      ctx.moveTo(1, 1);
      ctx.lineTo(8, 6);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      [
        [12.2, -7.4],
        [13, -5.2],
        [8.8, 6.8],
        [6.6, 8.2],
      ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    });
    ctx.fillStyle = '#16100c';
    ctx.beginPath();
    ctx.ellipse(0, 0.4, 0.9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#16100c';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(-0.3, -4.2);
    ctx.quadraticCurveTo(-1.6, -7.2, -2.4, -8.4);
    ctx.moveTo(0.3, -4.2);
    ctx.quadraticCurveTo(1.6, -7.2, 2.4, -8.4);
    ctx.stroke();
    ctx.restore();
  }

  // ---------- Super Saiyan ----------
  /** The aura: his silhouette coloured blue to violet to gold, top to foot,
   *  laid behind him three times, each a little bigger and softer, flickering
   *  like a flame; at full tilt, afterimages trail him. */
  function drawAura(bx, by, oy, dt, t) {
    const k = c.ssj;
    ag.setTransform(1, 0, 0, 1, 0, 0);
    ag.globalCompositeOperation = 'source-over';
    ag.clearRect(0, 0, aura.width, aura.height);
    ag.globalAlpha = 1 - c.lot;
    ag.drawImage(buf, 0, 0);
    if (c.lot > 0.01) {
      ag.globalAlpha = c.lot;
      ag.drawImage(lbuf, 0, 0);
    }
    ag.globalAlpha = 1;
    ag.globalCompositeOperation = 'source-in';
    const sway = Math.sin(t * 2.2) * 6;
    const gr = ag.createLinearGradient(0, (OY - 58 * S + sway) * dpr, 0, OY * dpr);
    SSJ.forEach((col, i) => gr.addColorStop(i / (SSJ.length - 1), col));
    ag.fillStyle = gr;
    ag.fillRect(0, 0, aura.width, aura.height);
    ag.globalCompositeOperation = 'source-over';

    if (c.super && c.mode === 'zoom') ghosts.unshift({ x: bx, y: by, age: 0 });
    for (let i = ghosts.length - 1; i >= 0; i -= 1) {
      ghosts[i].age += dt;
      if (ghosts[i].age > 0.22 || i > 7) ghosts.splice(i, 1);
    }
    ghosts.forEach((gh, i) => {
      if (i % 2) return; // every other frame's, spaced out
      ctx.globalAlpha = k * 0.3 * (1 - gh.age / 0.22);
      ctx.drawImage(aura, gh.x, gh.y, BW, BH);
    });

    const flick = 0.82 + 0.18 * Math.sin(t * 29) * Math.sin(t * 13 + 1);
    [
      [SSJ[0], 26, 1.1, 1.16, 0.55],
      [SSJ[1], 13, 1.055, 1.09, 0.75],
      [SSJ[2], 6, 1.025, 1.04, 0.95],
    ].forEach(([col, blur, sx, sy, a], i) => {
      const w = 0.025 * Math.sin(t * (11 + i * 4) + i);
      ctx.save();
      ctx.globalAlpha = k * a * flick;
      ctx.shadowColor = col;
      ctx.shadowBlur = blur * k * dpr;
      ctx.translate(c.x, oy - 16 * S); // from his middle, a little taller than wide
      ctx.scale(sx + w, sy - w);
      ctx.translate(-c.x, -oy + 16 * S);
      ctx.drawImage(aura, bx, by, BW, BH);
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    // Embers rising off him, and, while he charges, crackles of lightning.
    if (k > 0.2 && Math.random() < dt * 60 * k) {
      sparks.push({ x: c.x + rand(-17, 17) * S, y: oy - rand(0, 34) * S, vx: rand(-14, 14), vy: -rand(70, 170), life: rand(0.35, 0.7), age: 0, col: pick(SSJ) });
    }
    if (c.mode === 'charge' && Math.random() < dt * 9) {
      const pts = [[c.x + rand(-14, 14) * S, oy - rand(6, 30) * S]];
      const dir = rand(-Math.PI, 0);
      for (let i = 0; i < 4; i += 1) {
        const p = pts[i];
        const a = dir + rand(-0.9, 0.9);
        pts.push([p[0] + Math.cos(a) * 7, p[1] + Math.sin(a) * 7]);
      }
      bolts.push({ pts, age: 0 });
    }
  }

  function drawSparks(oy, dt) {
    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const p = sparks[i];
      p.age += dt;
      if (p.age > p.life) {
        sparks.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.strokeStyle = p.col;
      ctx.globalAlpha = (1 - p.age / p.life) * Math.max(c.ssj, 0.3);
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    }
    for (let i = bolts.length - 1; i >= 0; i -= 1) {
      const b = bolts[i];
      b.age += dt;
      if (b.age > 0.09) {
        bolts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.strokeStyle = '#eef2ff';
      ctx.shadowColor = SSJ[0];
      ctx.shadowBlur = 8 * dpr;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      b.pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- The loop ----------
  let raf = 0;
  let last = performance.now();
  let hitbox = null;
  let follower = null; // something that rides along above his head (a hint)
  let held = false; // kept sitting where he is (until you're on the desktop)
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    if (document.hidden) return;
    step(dt, now);
    updateRig(dt, t);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawToys(t);
    if (R.grounded) {
      const mid = ((R.H[0] + R.Sh[0]) / 2) * S * c.face;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(c.x + mid, c.y, ((R.Sh[0] - R.H[0]) / 2 + 16) * S, 3 * S, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const oy = c.mode === 'drag' ? c.y - 58 * S : c.y;
    // Charging, he shakes with it.
    const bx = c.x - OX + (c.mode === 'charge' ? (Math.random() - 0.5) * 2 * c.ssj : 0);
    const by = oy - OY;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, BW, BH);
    g.translate(OX, OY);
    g.scale(S, S);
    if (c.mode === 'drag') g.rotate(c.drag.swing * c.face + Math.sin(t * 3) * 0.04);
    drawCat();
    if (c.lot > 0.01) {
      lg.setTransform(dpr, 0, 0, dpr, 0, 0);
      lg.clearRect(0, 0, BW, BH);
      lg.translate(OX, OY);
      lg.scale(c.face * SIT_K, SIT_K);
      lg.translate(-SIT_AT[0], -SIT_AT[1]);
      sitAnim.draw(lg, c.lotF);
    }
    if (c.ssj > 0.01) drawAura(bx, by, oy, dt, t);
    ctx.globalAlpha = 1 - c.lot;
    ctx.drawImage(buf, bx, by, BW, BH);
    if (c.lot > 0.01) {
      ctx.globalAlpha = c.lot;
      ctx.drawImage(lbuf, bx, by, BW, BH);
    }
    ctx.globalAlpha = 1;
    drawSparks(oy, dt);

    if (c.mode === 'sleep') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '600 11px -apple-system, sans-serif';
      const k = (t % 2.4) / 2.4;
      ctx.globalAlpha = Math.sin(Math.PI * k);
      ctx.fillText('z', c.x + c.face * (R.head[0] + 10 + k * 8) * S, c.y + (R.head[1] - 16 - k * 14) * S);
      ctx.globalAlpha = 1;
    }
    if (c.mode === 'pet' && Math.random() < dt * 2.5) hearts.push({ x: c.x + c.face * R.head[0] * S, y: c.y + (R.head[1] - 22) * S, t: 0 });
    for (let i = hearts.length - 1; i >= 0; i -= 1) {
      const h = hearts[i];
      h.t += dt;
      if (h.t > 1.2) {
        hearts.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = 1 - h.t / 1.2;
      ctx.fillStyle = '#ff5c78';
      ctx.font = '600 14px -apple-system, sans-serif';
      ctx.fillText('♥', h.x + Math.sin(h.t * 6) * 4, h.y - h.t * 30);
      ctx.globalAlpha = 1;
    }
    if (c.laser && pointer.x > 0) {
      ctx.fillStyle = 'rgba(255,40,40,0.95)';
      ctx.shadowColor = 'rgba(255,0,0,0.9)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    if (hitbox) {
      let h;
      if (c.mode === 'drag') h = { x: c.x - 32, y: c.y - 78 * S, w: 64, h: 100 * S };
      else {
        const [a, b, top] = c.box;
        const x0 = c.x + Math.min(a * c.face, b * c.face) * S;
        h = { x: x0, y: c.y + top * S, w: (b - a) * S, h: -top * S };
      }
      hitbox.style.transform = `translate3d(${h.x.toFixed(1)}px, ${h.y.toFixed(1)}px, 0)`;
      hitbox.style.width = `${h.w.toFixed(1)}px`;
      hitbox.style.height = `${h.h.toFixed(1)}px`;
    }
    if (follower) follower.style.transform = `translate3d(${c.x.toFixed(1)}px, ${(oy + c.box[2] * S).toFixed(1)}px, 0)`;
  };
  raf = requestAnimationFrame(frame);

  const onMove = (e) => {
    pointer = { x: e.clientX, y: e.clientY };
    if (c.drag) {
      c.drag.x = e.clientX;
      c.drag.y = e.clientY;
    }
  };
  const onUp = () => {
    if (!c.drag) return;
    const moved = c.drag.moved;
    c.drag = null;
    if (moved) {
      c.vx = clamp(c.vx, -900, 900);
      c.vy = clamp(c.vy, -900, 600);
      c.thrown = true;
      set('air');
    } else {
      set('pet', 2.8);
      say(pick(['purrr.', 'mrrp.', '♥']));
    }
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('resize', size);

  if (import.meta.env?.DEV) window.__toothless = { c, rig: () => R, set, launch, toys, surfaces: () => surfaces, startZoomies, superZoomies, startYarn, startMouse, startButterfly };

  return {
    setHitbox(el) {
      hitbox = el;
    },
    setFollower(el) {
      follower = el;
    },
    /** Keep him sitting where he is (on the Dock, as you arrive); let go,
     *  he stays a while longer before he wanders. */
    hold(on) {
      if (held && !on && c.mode === 'sit') c.until = performance.now() / 1000 + rand(8, 12);
      held = on;
    },
    grab(e) {
      c.drag = { x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, swing: 0, moved: false, sx: e.clientX, sy: e.clientY };
      const check = (ev) => {
        if (!c.drag) return window.removeEventListener('pointermove', check);
        if (Math.hypot(ev.clientX - c.drag.sx, ev.clientY - c.drag.sy) > 5) {
          c.drag.moved = true;
          c.on = null;
          c.resume = null;
          c.mode = 'drag';
          window.removeEventListener('pointermove', check);
        }
      };
      window.addEventListener('pointermove', check);
    },
    stroke() {
      set('pet', 3);
      say('purrr.');
    },
    nap() {
      set('sleep', 25);
    },
    yarn() {
      if (!roomy(surfaceOf(c.on))) {
        say('no room.');
        return;
      }
      startYarn();
    },
    zoomies() {
      superZoomies();
    },
    laser(on) {
      c.laser = on;
      if (on) set('chase');
      else set('sit', 3);
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('resize', size);
    },
  };
}
