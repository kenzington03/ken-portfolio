// Toothless, the desktop cat: a small black cat, drawn and moved live.
//
// How he is built:
// - One silhouette. Body, legs, tail and head are the same black, so they
//   merge into one shape the way a black cat reads in life. A soft top light
//   gives him volume and a faint rim keeps him readable on a dark wallpaper.
//   His big gold eyes carry the expression.
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
// the floor, the Dock's top, window title bars and desktop icons (anything
// marked [data-cat-surface] or [data-window-titlebar]). He stands on them,
// rides them when they move, falls when they go, and plans his own jumps.
//
// Left to himself he wanders, climbs, sits, loafs, grooms, naps (and
// stretches and yawns after), gets the zoomies, bats a ball of yarn, chases
// a mouse and, up high, watches a butterfly and swats at it.

import SIT from './toothlessSit.json';
import { lottiePlayer } from './lottieMini.js';

const G = 2400; // gravity, px/s²
const S = 1.2; // his scale: the rig is in units of 1px at S = 1
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
const SIT_K = 82 / 735;
const SIT_AT = [775, 750];
const GROOM_AT = 97;
const FORE = [10.5, 11]; // upper arm, forearm
const HIND = [9, 9.5, 7]; // thigh, shin, foot (paw to hock)
const PAW = 2;
const TAIL_N = 14;
const TAIL_SEG = 3.5;
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

// Poses, in his own space: x forward, y down, the ground at y = 0.
// hip/shoulder centres (hx hy, sx sy), how much the back arches, the head
// from the shoulder (nx ny) with its tilt and turn (0 faces you, 1 profile),
// the rest positions of the paws (fx front, bx hind, from the shoulder and
// hip), hock (1 = sitting on the hind foot), hs (1 = foot in line with the
// shin, as in the air), haunch (the round thigh of a sitting cat), tuck (paws
// folded under), the tail (ta its angle at the root, tc its curl per segment,
// th the hook at its tip), eye openness and how far back the ears are.
const BASE = { hx: -12, hy: -20, sx: 12, sy: -22, arch: 2.5, nx: 8, ny: -13, tilt: 0, turn: 0.3, fx: 1, bx: 0, hock: 0, hs: 0, haunch: 0, tuck: 0, ta: -1.95, tc: 0.02, th: 0.3, lid: 1, ears: 0 };
const POSES = {
  stand: BASE,
  aim: { ...BASE, hy: -18, sy: -20, nx: 9, ny: -13, tilt: -0.2, turn: 0.55, ta: 2.95, tc: 0.03, th: 0.12 },
  crouch: { ...BASE, hx: -10, hy: -12.5, sx: 11, sy: -13, arch: 0.5, nx: 9, ny: -10, tilt: -0.12, turn: 0.6, fx: -1, bx: 5, ta: 3.05, tc: 0, th: 0.1 },
  land: { ...BASE, hx: -11, hy: -15, sx: 11, sy: -13, arch: 1.5, nx: 8, ny: -11, turn: 0.45, fx: 2, bx: 2, ta: -2.5, tc: 0.05, th: 0.2 },
  // Sitting tall, like a little black cat on a doorstep: the tail up behind.
  sit: { ...BASE, hx: -5, hy: -8, sx: 5, sy: -23.5, arch: 3.5, nx: 3, ny: -14, turn: 0.1, fx: 3, bx: 8, hock: 1, haunch: 1, ta: -2.3, tc: 0.05, th: 0.38 },
  loaf: { ...BASE, hx: -11, hy: -9, sx: 9.5, sy: -9.5, arch: 4.5, nx: 7, ny: -10, turn: 0.15, tuck: 1, ta: 2.6, tc: -0.22, th: 0, lid: 0.55 },
  sleep: { ...BASE, hx: -8, hy: -8, sx: 7, sy: -8, arch: 9, nx: 7, ny: -2, tilt: 0.35, turn: 0, tuck: 1, ta: 2.3, tc: -0.3, th: 0, lid: 0 },
  stretch: { ...BASE, hx: -10, hy: -25, sx: 10, sy: -10, arch: -3, nx: 11, ny: -6, tilt: -0.25, turn: 0.35, fx: 19, bx: -1, ta: -1.85, tc: 0.04, th: 0.25, lid: 0.25 },
  air: { ...BASE, hx: -14, hy: -22, sx: 14, sy: -23, arch: 0, nx: 9, ny: -12, turn: 0.6, hs: 1, ta: 3.35, tc: 0.03, th: 0.05 },
  drag: { ...BASE, hx: 0, hy: 40, sx: 1, sy: 15, arch: -2, nx: 2, ny: -13, turn: 0, hs: 0.8, ta: 1.65, tc: 0.06, th: 0.15, lid: 0.6, ears: 0.6 },
};
POSES.groom = { ...POSES.sit, nx: 5, ny: -12, tilt: 0.3, lid: 0.25 };
// How quickly he moves into each (sleep curls up slowly, landings are fast).
const RATES = { crouch: 14, land: 20, air: 12, drag: 12, aim: 8, stretch: 5, sleep: 3.5, loaf: 4, sit: 7, groom: 7, stand: 8 };

// The gaits: when each paw lands (fraction of the stride), how long it stays
// down, how high the front and hind paws lift.
const GAITS = {
  walk: { duty: 0.64, off: { nh: 0, nf: 0.25, xh: 0.5, xf: 0.75 }, lift: [6.5, 5] },
  trot: { duty: 0.42, off: { nh: 0, xf: 0, xh: 0.5, nf: 0.5 }, lift: [8, 7] },
  gallop: { duty: 0.24, off: { nh: 0, xh: 0.07, nf: 0.5, xf: 0.57 }, lift: [10, 9] },
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
  g.beginPath();
  g.moveTo(top[0][0], top[0][1]);
  for (let i = 1; i < n; i += 1) g.lineTo(top[i][0], top[i][1]);
  for (let i = n - 1; i >= 0; i -= 1) g.lineTo(bot[i][0], bot[i][1]);
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

/**
 * Every surface he can stand on, as screen-space segments, each on a layer:
 * the desktop's things (and the floor) behind every window, a window's
 * things on that window's layer, the Dock in front of all. A surface hidden
 * behind a window in front of it can't be jumped to (`hidden`).
 */
function readSurfaces(wins) {
  const out = [{ key: 'floor', el: null, x0: -200, x1: window.innerWidth + 200, y: window.innerHeight - 1, layer: -1 }];
  document.querySelectorAll('[data-cat-surface], [data-window-titlebar]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 30 || r.height < 8 || r.bottom < 0 || r.top > window.innerHeight) return;
    let x0 = r.left;
    let x1 = r.right;
    const y = r.top;
    const inWindow = el.closest('[role="dialog"]');
    const host = inWindow && wins.find((w) => w.el === inWindow);
    if (inWindow && !host) return; // its window is closing
    if (host) {
      // Only what shows inside its window (not scrolled out of it).
      if (y < host.r.top - 1 || y > host.r.bottom - 8) return;
      x0 = Math.max(x0, host.r.left);
      x1 = Math.min(x1, host.r.right);
      if (x1 - x0 < 30) return;
    }
    const kind = el.dataset.catSurface;
    const layer = host ? host.z : kind === 'front' ? Infinity : -1;
    const mx = (x0 + x1) / 2;
    const hidden = wins.some((w) => w.z > layer && mx > w.r.left && mx < w.r.right && y > w.r.top && y < w.r.bottom);
    out.push({ key: el, el, x0, x1, y, layer, hidden, bed: kind === 'bed' });
  });
  return out;
}

export function createCat({ canvas, onSay }) {
  const ctx = canvas.getContext('2d');
  // He is drawn into his own small canvas first, then laid on the screen in
  // one piece, so the rim light outlines the whole silhouette.
  const buf = document.createElement('canvas');
  const g = buf.getContext('2d');
  const BW = 300;
  const BH = 300;
  const OX = 150;
  const OY = 190;
  let dpr = 1;
  const size = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    buf.width = BW * dpr;
    buf.height = BH * dpr;
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
    layer: -1, // the stacking layer he is on (see readSurfaces)
    goal: null, // the surface he last jumped for
    lot: 0, // how far he's into the sitting animation (0 skeleton, 1 animation)
    lotF: 0, // its frame
    collapse: false,
    pending: null,
  };
  const P = { ...POSES.stand };
  const F = { nf: [12, 0], xf: [9.5, 0], nh: [-11, 0], xh: [-13.5, 0] };
  const ta = Array.from({ length: TAIL_N }, (_, i) => -1.95 + i * 0.02);
  const tv = new Array(TAIL_N).fill(0);
  let R = null; // this frame's rig
  const sitAnim = lottiePlayer(SIT, { colour: ([r, g2, b]) => (r > 0.9 && g2 > 0.6 && b < 0.1 ? EYE : null) });
  let windows = readWindows();
  let surfaces = readSurfaces(windows);
  let pointer = { x: -999, y: -999 };
  const hearts = [];
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
  // Room to bat a ball of yarn about: the floor, the Dock, a wide window.
  const roomy = (s) => !!s && (s.key === 'floor' || s.x1 - s.x0 >= WIDE);

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
      const tx = clamp(lx - Math.sign(lx - c.x || 1) * 90, h0, h1);
      const up = here.y - s.y;
      const across = Math.abs(lx - tx);
      if (up > MAX_UP || across > MAX_ACROSS || across < 12) return;
      out.push({ s, lx, tx, up });
    });
    return out;
  }

  function decide() {
    if (still) return set('sit', 1e6);
    const here = surfaceOf(c.on);
    const high = here && here.y < window.innerHeight * 0.62;
    const r = Math.random();
    const options = reachable();
    if (high && r < 0.22) return startButterfly();
    if (onFloor() && r < 0.1) return startZoomies();
    if (onFloor() && r < 0.18) return startMouse();
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
    // Off one side of the screen at full tilt, back in from the other.
    c.count = 0;
    c.plan = { tx: c.x < window.innerWidth / 2 ? window.innerWidth + 120 : -120 };
    say(pick(['!!!', 'zoomies.', 'brb.']));
    set('zoom');
  }

  function startYarn() {
    const here = surfaceOf(c.on);
    if (!roomy(here)) return set('sit', 3);
    const [a, b] = span(here);
    // Towards the side with more room.
    if ((c.face > 0 ? b - c.x : c.x - a) < 160) c.face = -c.face;
    const x = clamp(c.x + c.face * rand(70, 140), a + 10, b - 10);
    toys.yarn = { x, vx: 0, on: c.on.key, spin: 0, trail: [] };
    c.count = Math.round(rand(3, 5));
    set('yarn');
  }

  function startMouse() {
    const left = Math.random() < 0.5;
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

  function launch(target) {
    const apex = Math.min(c.y, target.y) - 34 - Math.abs(target.x - c.x) * 0.12;
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
    c.x += Math.sign(d) * Math.min(Math.abs(d), speed * dt);
    if (here?.el) c.on.dx = c.x - here.x0;
    return { d: goal - c.x, speed: Math.abs(d) > 1 ? speed : 0 };
  }

  function step(dt, now) {
    windows = readWindows();
    surfaces = readSurfaces(windows);
    const here = surfaceOf(c.on);
    const t = now / 1000;

    if (c.on && c.mode !== 'drag') {
      if (!here) {
        // What he stood on is gone (a window closed): down to the floor.
        c.on = null;
        c.vx = 0;
        c.vy = 0;
        c.collapse = true;
        set('air');
      } else {
        c.layer = here.layer;
        c.y = here.y;
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
      c.y = d.y + 46 * S;
      c.speed = 0;
      c.layer = Infinity; // in your hand, in front of everything
      return;
    }

    if (c.mode === 'air') {
      c.vy += G * dt;
      const py = c.y;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.x < 20 || c.x > window.innerWidth - 20) {
        c.vx *= -0.4;
        c.x = clamp(c.x, 20, window.innerWidth - 20);
      }
      if (c.vy > 0) {
        const hit = surfaces
          .filter((s) => (c.collapse ? s.key === 'floor' : !s.hidden) && c.x > s.x0 + 4 && c.x < s.x1 - 4 && py <= s.y + 1 && c.y >= s.y)
          .sort((a, b) => a.y - b.y)[0];
        if (hit) {
          c.y = hit.y;
          c.on = { key: hit.key, dx: c.x - hit.x0 };
          c.impact = clamp(c.vy / 1400, 0.3, 1);
          c.sqv += 70 + 70 * c.impact; // the landing runs through him
          c.vx = 0;
          c.vy = 0;
          c.swat = false;
          c.thrown = false;
          c.collapse = false;
          c.layer = hit.layer;
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
            c.aimAt = { x: j.lx, y: j.s.y };
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
        const m = walkTo(c.plan.tx, ZOOM, dt, null);
        speed = m.speed;
        if (Math.abs(m.d) < 2) {
          if (c.count === 0) {
            c.count = 1;
            c.x = c.plan.tx < 0 ? window.innerWidth + 100 : -100;
            c.on = { key: 'floor', dx: 0 };
            c.plan = { tx: rand(200, window.innerWidth - 300) };
          } else {
            set('sit', rand(2, 3));
            say(pick(['…what?', 'anyway.', '*pant*']));
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
          const m = walkTo(y.x - c.face * 22, RUN * 0.6, dt, here);
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
        if (Math.abs(mo.x - c.x) < 120 && !c.pounced) {
          c.pounced = true;
          c.plan = { jump: { s: { y: window.innerHeight - 1 }, lx: mo.x + mo.dir * 40 } };
          c.quick = true;
          set('crouch', 0.18);
        }
        break;
      }
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
            if (j.s.layer != null) c.layer = Math.max(c.layer, j.s.layer);
            launch({ x: j.lx, y: j.s.y });
            c.goal = j.s;
          }
          else set('idle', 0.5);
          c.plan = null;
          c.aimAt = null;
        }
        break;
      case 'land':
        if (t > c.until) {
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
        if (y.x < s.x0 + 8 || y.x > s.x1 - 8) {
          y.vx *= -0.6;
          y.x = clamp(y.x, s.x0 + 8, s.x1 - 8);
        }
        y.spin += (y.vx * dt) / 9;
        y.y = s.y;
        y.trail.unshift([y.x, y.y]);
        y.trail.length = Math.min(y.trail.length, 22);
      }
    }
    const mo = toys.mouse;
    if (mo) {
      mo.t += dt;
      mo.x += mo.dir * (mo.t < 0.6 ? 60 : 300) * dt;
      if (mo.x < -60 || mo.x > window.innerWidth + 60) {
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
      rT.push(lerp(6.6, 7.2, u) - 0.4 * s + breathe * 0.5);
      rB.push(lerp(7.2, 8.4, u) + 0.9 * s + breathe);
    }
    const head = [Sh[0] + P.nx, Sh[1] + P.ny + ndy];
    const Jf = [Sh[0] + 1.5, Sh[1] + 3];
    const Jh = [H[0] + 1, H[1] + 2.5];

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
      Object.assign(rest, { nf: [6, 32], xf: [3, 31], nh: [2 + s, 61], xh: [-2 + s, 60] });
    }
    const L = clamp(32 + c.speed * 0.18, 34, 120) / S;
    const gaits = [
      [GAITS.walk, wW],
      [GAITS.trot, wT],
      [GAITS.gallop, wG],
    ];
    c.groom = approach(c.groom, c.mode === 'groom' ? 1 : 0, 5, dt);
    LEGS.forEach((k) => {
      const fore = k[1] === 'f';
      let [x, y] = rest[k];
      if (P.tuck > 0.01) {
        const j = fore ? Jf : Jh;
        x = lerp(x, j[0] + 2, P.tuck);
        y = lerp(y, j[1] + 3, P.tuck);
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
      if (wig && !fore) y -= Math.max(0, wig * (k === 'nh' ? 1 : -1)) * 1.6;
      if (k === 'nf' && c.bat > 0) {
        const b = Math.sin(Math.PI * c.bat);
        x += 10 * b;
        y -= 13 * b;
      }
      if (k === 'nf' && c.groom > 0.01) {
        // A paw up to the mouth, licked, wiped over the face.
        const s = Math.sin(t * 7);
        x = lerp(x, head[0] + 3 + s, c.groom);
        y = lerp(y, head[1] + 8 + 2.5 * s, c.groom);
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
        const [ex, ey, px, py] = ik(Jf[0], Jf[1], f[0], f[1] - PAW, FORE[0], FORE[1], 1);
        legs[k] = { pts: [Jf, [ex, grounded ? Math.min(ey, -3) : ey], [px, py], [px + 1.4, py]], r: [3.8, 2.5, 2.1, PAW] };
      } else {
        let mx = lerp(-2.6, -7.5, P.hock);
        let my = lerp(-6.6, -2, P.hock);
        if (P.hs > 0.01) {
          const ddx = Jh[0] - f[0];
          const ddy = Jh[1] - f[1];
          const dd = Math.hypot(ddx, ddy) || 1;
          mx = lerp(mx, (ddx / dd) * HIND[2], P.hs);
          my = lerp(my, (ddy / dd) * HIND[2], P.hs);
        }
        let [kx, ky, qx, qy] = ik(Jh[0], Jh[1], f[0] + mx, f[1] - PAW + my, HIND[0], HIND[1], -1);
        // Sitting, the thigh folds forward and up into the haunch; and a
        // knee never goes through the floor.
        kx = lerp(kx, Jh[0] + 6.5, P.hock);
        ky = lerp(ky, Jh[1] - 1, P.hock);
        if (grounded) ky = Math.min(ky, -3);
        const paw = [qx - mx, qy - my];
        legs[k] = { pts: [Jh, [kx, ky], [qx, qy], paw, [paw[0] + 1.4, paw[1]]], r: [5.2, 3, 2.2, 2, PAW] };
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
    } else if (['watch', 'aim', 'crouch', 'hunt'].includes(c.mode)) {
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
    const tail = [[H[0] - dx * 5 + nx * 3.4, H[1] - dy * 5 + ny * 3.4]];
    const tailR = [2.2];
    for (let i = 0; i < TAIL_N; i += 1) {
      const p = tail[i];
      const r = lerp(2.2, 1.4, (i + 1) / TAIL_N);
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
    const excited = ['watch', 'aim', 'crouch', 'hunt', 'zoom', 'chase', 'yarn', 'air'].includes(c.mode);
    c.pupil = approach(c.pupil, excited ? 1.5 : 0.9, 5, dt);
    c.purr = approach(c.purr, c.mode === 'pet' ? 1 : 0, 6, dt);
    c.ears = approach(c.ears, P.ears + (c.mode === 'zoom' || c.thrown ? 0.7 : 0), 8, dt);
    c.nextEar -= dt;
    if (c.nextEar < 0) {
      c.earTw = 1;
      c.nextEar = rand(3, 8);
    }
    c.earTw = Math.max(0, c.earTw - dt * 5);
    c.mouth = Math.max(0, c.mouth - dt * 2.5);
    c.yawn = Math.max(0, c.yawn - dt / 1.8);

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
    c.box = [Math.min(H[0] - 10, head[0] - 14), Math.max(Sh[0] + 10, head[0] + 14), head[1] - 24];

    // Sitting (once he's down) and grooming are the animation: crossfade in,
    // play it (grooming from its paw-licking), crossfade out when he gets up.
    const seated = (c.mode === 'sit' || c.mode === 'groom') && grounded && P.haunch > 0.85;
    if (seated && c.lot < 0.02) c.lotF = c.mode === 'groom' ? GROOM_AT : 0;
    c.lot = approach(c.lot, seated ? 1 : 0, seated ? 9 : 16, dt);
    if (c.lot > 0.01) c.lotF = (c.lotF + dt * sitAnim.fps) % sitAnim.frames;
    if (c.lot > 0.5) c.box = [-26 / S, 26 / S, -84 / S];
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
      [side * 2 + sh, -8.2],
      [side * (11.4 + 5 * e) + sh, -22.5 + 8 * e],
      [side * 12.2 + sh, -1.5],
    ];
  }

  function earPath(b0, tip, b1) {
    const k = 0.26;
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
  // in: a small rounded head, tall ears, almond eyes.
  function headShape() {
    const tn = c.tn;
    const fx = tn * 4;
    g.beginPath();
    g.ellipse(fx * 0.3, -0.5, 10.6, 9.4, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(fx * 0.6, 3.4, 8 - tn * 1.2, 5.6, 0, 0, Math.PI * 2);
    g.fill();
    earPath(...earPts(-1));
    earPath(...earPts(1));
  }

  /** An almond eye, its outer corner (side) lifted: green, a black slit. */
  function eye(ex, ey, sx, side, open) {
    if (open < 0.14) return; // shut: just black, like the rest of him
    const rx = 3.6 * sx;
    const ry = 2.5;
    const lift = 0.9;
    g.save();
    g.translate(ex, ey);
    g.scale(1, open);
    g.beginPath();
    g.moveTo(-rx * side, 0.5);
    g.bezierCurveTo(-rx * 0.4 * side, -ry * 1.3, rx * 0.5 * side, -ry * 1.3 - lift, rx * side, -lift);
    g.bezierCurveTo(rx * 0.45 * side, ry * 1.2 - lift * 0.5, -rx * 0.5 * side, ry * 1.2, -rx * side, 0.5);
    g.closePath();
    g.fillStyle = EYE;
    g.fill();
    g.clip();
    g.fillStyle = INK;
    g.beginPath();
    g.ellipse(c.lookX * 1.3 * sx, c.lookY * 0.6, rx * 0.42 * c.pupil, ry * 1.3, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  function face() {
    const tn = c.tn;
    const fx = tn * 4;
    eye(fx - 4.6 * (1 - tn * 0.4), 0.6, 1 - tn * 0.4, -1, R.open);
    eye(fx + 4.6 * (1 - tn * 0.12), 0.6, 1, 1, R.open);
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
      tube(g, l.pts, l.r, l.r, true);
    });
    tube(g, R.spine, R.rT, R.rB, false);
    if (R.haunch > 0.02) {
      g.beginPath();
      g.ellipse(R.H[0] + 3.5, Math.min(R.H[1] + 1.5, -7.5 * R.haunch), 9.5 * R.haunch, 7.5 * R.haunch, -0.3, 0, Math.PI * 2);
      g.fill();
    }
    tube(g, R.tail, R.tailR, R.tailR, true);
    tube(g, [[R.Sh[0] + 1, R.Sh[1] - 2], [R.head[0], R.head[1] + 4]], [5.6, 5.6], [6, 6], true);
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
      ctx.translate(m.x, window.innerHeight - 1);
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

  // ---------- The loop ----------
  let raf = 0;
  let last = performance.now();
  let hitbox = null;
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
      ctx.ellipse(c.x + mid, c.y, ((R.Sh[0] - R.H[0]) / 2 + 13) * S, 3 * S, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const oy = c.mode === 'drag' ? c.y - 46 * S : c.y;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, BW, BH);
    g.translate(OX, OY);
    g.scale(S, S);
    if (c.mode === 'drag') g.rotate(c.drag.swing * c.face + Math.sin(t * 3) * 0.04);
    drawCat();
    ctx.globalAlpha = 1 - c.lot;
    ctx.drawImage(buf, c.x - OX, oy - OY, BW, BH);
    ctx.globalAlpha = 1;
    if (c.lot > 0.01) {
      ctx.save();
      ctx.globalAlpha = c.lot;
      ctx.translate(c.x, c.y);
      ctx.scale(c.face * SIT_K, SIT_K);
      ctx.translate(-SIT_AT[0], -SIT_AT[1]);
      sitAnim.draw(ctx, c.lotF);
      ctx.restore();
    }

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
    // Inside something with a door (the castle's condo), he's seen only
    // through the door: from the moment he drops in, until he leaves.
    const into = c.on ? surfaceOf(c.on) : c.mode === 'air' && c.vy > 0 ? c.goal : null;
    const room = into?.bed && into.el?.closest('[data-cat-inside]');
    if (room) {
      const r = room.getBoundingClientRect();
      const hole = room.querySelector('[data-cat-hole]')?.getBoundingClientRect();
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.rect(r.left - 2, r.top - 2, r.width + 4, r.height + 4);
      if (hole) ctx.arc(hole.left + hole.width / 2, hole.top + hole.height / 2, hole.width / 2 - 1, 0, Math.PI * 2);
      ctx.fill('evenodd');
      ctx.restore();
    }
    // Windows in front of the layer he's on hide him (and his things): on the
    // desktop he's behind every window; in a window, behind the ones above it.
    const front = windows.filter((w) => w.z > c.layer);
    if (front.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      front.forEach(({ r }) => {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(r.left, r.top, r.width, r.height, 11);
        else ctx.rect(r.left, r.top, r.width, r.height);
        ctx.fill();
      });
      ctx.restore();
    }
    const covered = front.some(({ r }) => c.x > r.left && c.x < r.right && c.y - 20 > r.top && c.y - 20 < r.bottom);
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
      if (c.mode === 'drag') h = { x: c.x - 26, y: c.y - 62 * S, w: 52, h: 84 * S };
      else {
        const [a, b, top] = c.box;
        const x0 = c.x + Math.min(a * c.face, b * c.face) * S;
        h = { x: x0, y: c.y + top * S, w: (b - a) * S, h: -top * S };
      }
      hitbox.style.transform = `translate3d(${h.x.toFixed(1)}px, ${h.y.toFixed(1)}px, 0)`;
      hitbox.style.width = `${h.w.toFixed(1)}px`;
      hitbox.style.height = `${h.h.toFixed(1)}px`;
      // Behind a window, he can't be clicked through it.
      hitbox.style.pointerEvents = covered ? 'none' : '';
    }
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

  if (import.meta.env?.DEV) window.__toothless = { c, rig: () => R, set, launch, toys, surfaces: () => surfaces, startZoomies, startYarn, startMouse, startButterfly };

  return {
    setHitbox(el) {
      hitbox = el;
    },
    grab(e) {
      c.drag = { x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, swing: 0, moved: false, sx: e.clientX, sy: e.clientY };
      const check = (ev) => {
        if (!c.drag) return window.removeEventListener('pointermove', check);
        if (Math.hypot(ev.clientX - c.drag.sx, ev.clientY - c.drag.sy) > 5) {
          c.drag.moved = true;
          c.on = null;
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
      if (!onFloor()) {
        say('not here.');
        return;
      }
      startZoomies();
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
