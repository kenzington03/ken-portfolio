/**
 * Toothless's body, drawn side on, the way a cartoon cat walks across a
 * screen (after the desktop pets of the early 2000s, Felix among them, and
 * the walk cycles of Pixi-Gags and Malbers): one flat silhouette, black, his
 * head in profile on a short thick neck, the far legs a shade darker so the
 * walk reads, and (if wanted) a crisp band of light along his top edges. No
 * outline, no glow.
 *
 * His own space: x forward, y down, the ground at y = 0, 1 unit = 1 px at
 * scale 1. `update` poses him from the state it's given (the engine's, or the
 * preview page's); `draw` paints him into a context already moved to his feet.
 */

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const ss = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const bumpAt = (u, at, wd) => Math.exp(-(((u - at) / wd) ** 2));

export const INK = {
  body: '#0e0e11',
  far: '#040405',
  light: '#2a2a32',
  earIn: '#5b3b3e',
  eye: '#9ee05a',
  nose: '#3b2c2f',
  mouth: '#b4636f',
};

// Poses: the hip and shoulder joints (hx hy, sx sy), the arch of the back,
// the head's centre from the shoulder (nx ny) and its tilt, where the paws
// rest (fx from the shoulder, bx from the hip), hock (1 = sitting on the hind
// foot), hs (1 = foot in line with the shin, as in the air), haunch (the
// round thigh of a sitting cat), tuck (paws folded under), the tail (ta its
// angle at the root, tc its bend per segment, th the curl at its tip), how
// open the eyes are and how far back the ears are.
const BASE = { hx: -14, hy: -27.5, sx: 12, sy: -25, arch: 1.2, nx: 10.5, ny: -8, tilt: 0.06, fx: 1.5, bx: 0, hock: 0, hs: 0, haunch: 0, tuck: 0, ta: -2.6, tc: -0.025, th: 0.35, lid: 1, ears: 0 };
export const POSES = {
  stand: BASE,
  aim: { ...BASE, hy: -20, sy: -18, nx: 11, ny: -7, tilt: -0.12, ta: 3.0, tc: 0.02, th: 0.1 },
  crouch: { ...BASE, hx: -12, hy: -14, sx: 11, sy: -13.5, arch: 1.5, nx: 11, ny: -5.5, tilt: -0.08, fx: -1, bx: 6, ta: 3.05, tc: 0, th: 0.08 },
  land: { ...BASE, hx: -13, hy: -17, sx: 12, sy: -15, arch: 1.5, nx: 10, ny: -7, fx: 2, bx: 2, ta: -2.6, tc: 0.02, th: 0.15 },
  // Sitting tall: the round haunch behind, the chest straight down to the
  // forepaws, the head up, the tail laid along the floor, its tip turned up.
  sit: { ...BASE, hx: -7, hy: -9.5, sx: 4, sy: -23, arch: 3, nx: 7.5, ny: -10.5, tilt: 0, fx: 4, bx: 9, hock: 1, haunch: 1, ta: 3.05, tc: 0.004, th: 0.4 },
  loaf: { ...BASE, hx: -12, hy: -9.5, sx: 10, sy: -10.5, arch: 4, nx: 9, ny: -8.5, tilt: 0.04, tuck: 1, ta: 3.0, tc: -0.12, th: 0, lid: 0.55 },
  sleep: { ...BASE, hx: -10, hy: -10, sx: 8, sy: -9.5, arch: 8, nx: 9.5, ny: -1.5, tilt: 0.45, tuck: 1, ta: 2.4, tc: -0.28, th: 0, lid: 0 },
  stretch: { ...BASE, hx: -12, hy: -25, sx: 11, sy: -11, arch: -3, nx: 12, ny: -5, tilt: -0.2, fx: 21, bx: -1, ta: -1.9, tc: 0.03, th: 0.2, lid: 0.25 },
  air: { ...BASE, hx: -16, hy: -24, sx: 15, sy: -24, arch: 0, nx: 10.5, ny: -8, tilt: -0.05, hs: 1, ta: 3.3, tc: 0.02, th: 0.05 },
  drag: { ...BASE, hx: 0, hy: 46, sx: 1, sy: 17, arch: -2, nx: 2, ny: -13, tilt: 0.1, hs: 0.8, ta: 1.65, tc: 0.05, th: 0.15, lid: 0.6, ears: 0.6 },
};
POSES.groom = { ...POSES.sit, nx: 7.5, ny: -9, tilt: 0.32, lid: 0.35 };
// The play bow: chest down on his forepaws, rump up, tail up.
POSES.bow = { ...BASE, hx: -13, hy: -25, sx: 12, sy: -10, arch: -2.5, nx: 12, ny: -3.5, tilt: -0.15, fx: 11, ta: -2.0, tc: 0.02, th: 0.45 };
// Caught on a ledge: forepaws over its edge, head up over it, the rest of
// him hanging below.
POSES.hang = { ...BASE, hx: -3, hy: 23, sx: 3, sy: 4, arch: -1, nx: 5, ny: -9, tilt: -0.25, fx: 5, bx: 2, hs: 1, ta: 1.75, tc: 0.03, th: 0.1, ears: 0.2 };
// How quickly he moves into each (sleep curls up slowly, landings are fast).
export const RATES = { crouch: 14, land: 20, air: 12, drag: 12, aim: 8, stretch: 5, sleep: 3.5, loaf: 4, sit: 7, groom: 7, stand: 8, bow: 7, hang: 22 };

// The gaits: when each paw lands (fraction of the stride), how long it stays
// down, how high the front and hind paws lift. The walk is the lateral
// sequence every cat uses: near hind, near fore, far hind, far fore.
export const GAITS = {
  walk: { duty: 0.64, off: { nh: 0, nf: 0.25, xh: 0.5, xf: 0.75 }, lift: [6.5, 5.5] },
  trot: { duty: 0.42, off: { nh: 0, xf: 0, xh: 0.5, nf: 0.5 }, lift: [8.5, 7.5] },
  gallop: { duty: 0.24, off: { nh: 0, xh: 0.07, nf: 0.5, xf: 0.57 }, lift: [10, 9] },
};

const FORE = [9.6, 9.6]; // upper arm, forearm: under the shoulder, near straight
const HIND = [9, 9.8]; // thigh, shin
const HOCK = [-3, -9.6]; // the hock from the paw, standing (the long foot)
const TAIL_N = 16;
const TAIL_SEG = 2.6;
const LEGS = ['xh', 'xf', 'nh', 'nf']; // far hind, far fore, near hind, near fore

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

/** One tapered limb segment, round at both ends (filled on its own, so
 *  overlapping ones make one clean shape). */
function cap(g, a, ra, b, rb) {
  g.beginPath();
  g.arc(a[0], a[1], ra, 0, TAU);
  g.fill();
  g.beginPath();
  g.arc(b[0], b[1], rb, 0, TAU);
  g.fill();
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy);
  if (d <= Math.abs(ra - rb) + 1e-3) return;
  const th = Math.atan2(dy, dx);
  const ph = Math.acos(clamp((ra - rb) / d, -1, 1));
  const p = (c, r, s) => [c[0] + r * Math.cos(th + s * ph), c[1] + r * Math.sin(th + s * ph)];
  const q = [p(a, ra, 1), p(b, rb, 1), p(b, rb, -1), p(a, ra, -1)];
  g.beginPath();
  g.moveTo(q[0][0], q[0][1]);
  for (let i = 1; i < 4; i += 1) g.lineTo(q[i][0], q[i][1]);
  g.closePath();
  g.fill();
}
const chain = (g, pts, r) => {
  for (let i = 0; i < pts.length - 1; i += 1) cap(g, pts[i], r[i], pts[i + 1], r[i + 1]);
};

/** A smooth closed outline through points (Catmull-Rom). */
function smooth(g, pts) {
  const n = pts.length;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i += 1) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  g.closePath();
}

// His head in profile, about its centre, facing +x: the round skull, a
// short muzzle, a small chin. Ears: tall, set at the back of the skull.
const SKULL = [
  [-6.6, -0.6], [-5.6, -4.4], [-2.6, -6.6], [1.2, -6.8], [4.4, -5.4], [6.6, -3.4],
  [8.5, -2.0], [9.6, -0.6], [9.5, 0.9], [8.2, 1.9], [7.4, 3.0], [5.6, 4.1],
  [2.0, 4.9], [-2.4, 4.8], [-5.4, 3.2],
];
const EAR_NEAR = [[-5.4, -3.6], [-4.6, -12.6], [-0.6, -6.4]];
const EAR_FAR = [[-2.2, -5.6], [0.2, -11.8], [2.6, -5.8]];

export function createBody({ S = 1.7 } = {}) {
  const P = { ...BASE };
  const F = { nf: [P.sx + P.fx, 0], xf: [P.sx + P.fx - 2.5, 0], nh: [P.hx, 0], xh: [P.hx - 2.5, 0] };
  const ta = Array.from({ length: TAIL_N }, (_, i) => P.ta + P.tc * i);
  const tv = new Array(TAIL_N).fill(0);
  let R = null;
  let layer = null;

  function footRel(c, gait, k, L) {
    const d = gait.duty;
    const q = (((c.phase + gait.off[k]) % 1) + 1) % 1;
    if (q < d) return [L * (d / 2 - q), 0];
    const u = (q - d) / (1 - d);
    const e = u * u * (3 - 2 * u);
    return [L * (-d / 2 + d * e), -(k[1] === 'f' ? gait.lift[0] : gait.lift[1]) * Math.sin(Math.PI * u)];
  }

  /** Where the washing paw goes: at the mouth while he licks it, then up
   *  over the face to the ear and back. */
  function groomPaw(c, head, tilt, t) {
    const q = t % 2.8;
    const lick = q < 1.6;
    const u = lick ? 0 : Math.sin((Math.PI * (q - 1.6)) / 1.2);
    const s = lick ? Math.sin(t * 9) : 0;
    c.wipe = u;
    c.lick = lick ? Math.max(0, s) : 0;
    const lx = 7.5 + s * 0.6 - 9 * u;
    const ly = 5.5 + 1.4 * s - 10 * u;
    const co = Math.cos(tilt);
    const si = Math.sin(tilt);
    return [head[0] + co * lx - si * ly, head[1] + si * lx + co * ly];
  }

  /**
   * Pose him. `c` carries the state: pose (the pose's name), mode, speed,
   * phase (through the stride), accel, vx, vy, sq/sqv (the squash spring),
   * thrown, swat, bat, quick, until, groom, and for the face lookX, lookY,
   * lookTilt, pupil, ears, earTw, mouth, open, happy.
   */
  function update(dt, t, c) {
    const name = c.pose;
    const want = POSES[name] || BASE;
    const rate = RATES[name] ?? 8;
    Object.keys(want).forEach((k) => {
      if (k === 'ta') P.ta += wrap(want.ta - P.ta) * (1 - Math.exp(-rate * dt));
      else P[k] = approach(P[k], want[k], rate, dt);
    });
    const grounded = name !== 'air' && name !== 'drag' && name !== 'hang';
    const v = grounded ? c.speed : 0;
    const w = ss(3, 25, v);
    const wW = 1 - ss(85, 115, v);
    const wG = ss(230, 275, v);
    const wT = Math.max(0, 1 - wW - wG);
    const ph = c.phase;

    // Over the gait the shoulders and the hips rise and fall in turn (each
    // as its leg passes under it), the head steady; the trot bounces once a
    // step; the gallop gathers, stretches and rocks.
    let hdx = 0;
    let hdy = 0;
    let sdx = 0;
    let sdy = 0;
    let arch = 0;
    let ndy = 0;
    if (w > 0.001) {
      const trot = 1.2 * Math.cos(2 * TAU * (ph - 0.21));
      const gal = -2 * Math.cos(2 * TAU * (ph - 0.38)) + 1.4;
      const flex = Math.cos(TAU * (ph - 0.3));
      const rock = 1.5 * Math.sin(TAU * (ph - 0.05));
      hdy = w * (wW * -0.9 * Math.cos(2 * TAU * (ph - 0.32)) + wT * trot + wG * (gal + rock));
      sdy = w * (wW * -0.9 * Math.cos(2 * TAU * (ph - 0.57)) + wT * trot + wG * (gal - rock));
      hdx = -w * wG * (3.5 * flex + 2);
      sdx = w * wG * (3.5 * flex + 2);
      arch = -w * wG * 4.5 * flex;
      // The head stays level while the body moves under it, a little after.
      ndy = w * (wW * 0.35 * Math.cos(2 * TAU * (ph - 0.65)) + wT * trot * 0.4 + wG * (gal - rock) * 0.5);
    }
    c.sqv += (-300 * c.sq - 18 * c.sqv) * dt;
    c.sq += c.sqv * dt;
    hdy += c.sq;
    sdy += c.sq * 1.15;
    ndy += c.sq * 0.6;
    const wig = c.mode === 'crouch' && !c.quick && c.until - t > 0.12 ? Math.sin(t * 21) : 0;

    const H = [P.hx + hdx + wig * 1.3, P.hy + hdy];
    const Sh = [P.sx + sdx, P.sy + sdy];
    let dx = Sh[0] - H[0];
    let dy = Sh[1] - H[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const nx = dy; // the spine's "up"
    const ny = -dx;
    const A = P.arch + arch;
    const C = [(H[0] + Sh[0]) / 2 + nx * A, (H[1] + Sh[1]) / 2 + ny * A];
    const breathe = (1 - w) * Math.sin(t * 2.3) * 0.3;

    // The shoulder blades: each rides up as its foreleg takes his weight and
    // pushes back (the roll of a cat's walk).
    const stance = (k) => {
      const q = (((ph + GAITS.walk.off[k]) % 1) + 1) % 1;
      return q < GAITS.walk.duty ? Math.sin((Math.PI * q) / GAITS.walk.duty) : 0;
    };
    const blade = w * wW * 1.3 * stance('nf');

    const at = (u) => {
      const m = 1 - u;
      return [m * m * H[0] + 2 * m * u * C[0] + u * u * Sh[0], m * m * H[1] + 2 * m * u * C[1] + u * u * Sh[1]];
    };
    const norm = (u) => {
      // The spine's normal at u (from its tangent).
      const m = 1 - u;
      const tx = 2 * m * (C[0] - H[0]) + 2 * u * (Sh[0] - C[0]);
      const ty = 2 * m * (C[1] - H[1]) + 2 * u * (Sh[1] - C[1]);
      const l = Math.hypot(tx, ty) || 1;
      return [ty / l, -tx / l];
    };
    // Top: the croup over the hips, the back dipping behind the shoulders,
    // the shoulder blades. Under: the haunch, the belly tucked up, the chest
    // deep.
    const rT = (u) => 6.4 + 0.8 * bumpAt(u, 0.05, 0.2) - 0.9 * bumpAt(u, 0.6, 0.22) + (3.4 + blade) * bumpAt(u, 1, 0.17) + P.haunch * 1.4 * bumpAt(u, 0.35, 0.35) + breathe * 0.4;
    const rB = (u) => 5.9 + 0.6 * bumpAt(u, 0, 0.2) - 1 * bumpAt(u, 0.38, 0.22) + 2.8 * bumpAt(u, 0.86, 0.2) + P.haunch * 2.2 * bumpAt(u, 0.4, 0.35) + P.tuck * 2.2 + breathe;
    const top = [];
    const bot = [];
    for (let i = 0; i <= 8; i += 1) {
      const u = i / 8;
      const p = at(u);
      const [mx, my] = norm(u);
      top.push([p[0] + mx * rT(u), p[1] + my * rT(u)]);
      bot.push([p[0] - mx * rB(u), p[1] - my * rB(u)]);
    }
    const off = (o, along, up) => [o[0] + dx * along + nx * up, o[1] + dy * along + ny * up];

    // The head, and the neck to it: short and thick, out of the chest.
    const head = [Sh[0] + P.nx, Sh[1] + P.ny + ndy];
    const tilt = P.tilt + (c.lookTilt || 0) + (c.groom || 0) * ((c.wipe || 0) > 0.05 ? 0.25 * c.wipe : 0.08 * Math.sin(t * 9));
    const hp = (x, y) => [head[0] + Math.cos(tilt) * x - Math.sin(tilt) * y, head[1] + Math.sin(tilt) * x + Math.cos(tilt) * y];
    const withers = top[8];
    const nape = hp(-5.2, -3.4);
    const throat = hp(-1.5, 4.6);
    // (The chest in his own frame, not the spine's: it stays in front of
    // him when he sits up.)
    const breast = [Sh[0] + 6.2, Sh[1] + 1.5];
    const neckTop = [lerp(withers[0], nape[0], 0.5) - nx * 0.4, lerp(withers[1], nape[1], 0.5) - ny * 0.4 - 0.6];
    const neckBot = [lerp(breast[0], throat[0], 0.5) + 0.8, lerp(breast[1], throat[1], 0.5)];
    const torso = [
      off(H, -5, 5.6), // the root of the tail
      ...top.slice(0, 8),
      withers,
      neckTop,
      nape,
      hp(0, 0),
      throat,
      neckBot,
      breast,
      [Sh[0] + 3.6, Sh[1] + 8],
      ...bot.slice(2, 8).reverse(),
      off(H, -4.5, -5.6), // under the rump
      off(H, -7.4, 0.6), // the back of the rump
    ];

    // Where the paws want to be.
    const Jf = off(Sh, 1, -4.5);
    const Jh = off(H, 1, -2.5);
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
        // Rising: forelegs reach for the target, hind legs trail from the
        // push. Falling: forelegs reach down to land first.
        const k = clamp((c.vy + 200) / 700, 0, 1);
        const mix = (a, b) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
        Object.assign(rest, {
          nf: mix([P.sx + 15, -15], [P.sx + 8, 2]),
          xf: mix([P.sx + 12, -13], [P.sx + 5, 1]),
          nh: mix([P.hx - 14, -7], [P.hx + 5, -4]),
          xh: mix([P.hx - 12, -5], [P.hx + 3, -3]),
        });
      }
    } else if (name === 'hang') {
      const k = Math.sin(t * 14) * 3;
      Object.assign(rest, { nf: [P.sx + 5, 0], xf: [P.sx + 2.5, 0], nh: [P.hx + 4 + k, P.hy + 17], xh: [P.hx + 1 - k, P.hy + 16] });
    } else if (name === 'drag') {
      const s = Math.sin(t * 2.5) * 1.5;
      Object.assign(rest, { nf: [7, 36], xf: [3, 35], nh: [2 + s, 70], xh: [-2 + s, 69] });
    }
    const L = clamp(32 + c.speed * 0.18, 34, 120) / S;
    const gaits = [
      [GAITS.walk, wW],
      [GAITS.trot, wT],
      [GAITS.gallop, wG],
    ];
    c.groom = approach(c.groom || 0, c.mode === 'groom' ? 1 : 0, 5, dt);
    const swing = {};
    LEGS.forEach((k) => {
      const fore = k[1] === 'f';
      let [x, y] = rest[k];
      if (P.tuck > 0.01) {
        const j = fore ? Jf : Jh;
        x = lerp(x, j[0] + 3, P.tuck);
        y = lerp(y, Math.min(0, j[1] + 5), P.tuck);
      }
      if (w > 0.001) {
        let gx = 0;
        let gy = 0;
        gaits.forEach(([gait, wt]) => {
          if (wt <= 0) return;
          const [r, yy] = footRel(c, gait, k, L);
          gx += r * wt;
          gy += yy * wt;
        });
        const base = (fore ? P.sx - 0.5 : P.hx + 1) - (k[0] === 'x' ? 2.5 : 0);
        x = lerp(x, base + gx, w);
        y = lerp(y, gy, w);
      }
      swing[k] = grounded ? clamp(-y / 5, 0, 1) * w : 0;
      if (wig && !fore) y -= Math.max(0, wig * (k === 'nh' ? 1 : -1)) * 1.6;
      if (k === 'nf' && c.bat > 0) {
        const b = Math.sin(Math.PI * c.bat);
        x += 12 * b;
        y -= 15 * b;
      }
      if (k === 'nf' && c.groom > 0.01) {
        const [gx, gy] = groomPaw(c, head, tilt, t);
        x = lerp(x, gx, c.groom);
        y = lerp(y, gy, c.groom);
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
      const sw = swing[k];
      if (k[1] === 'f') {
        // Lifted, the wrist bends and the paw folds back under it (the
        // flick of a cat's forefoot); planted, it's flat under the wrist.
        const wr = [f[0] - lerp(1, -0.4, sw), f[1] - lerp(3.6, 3.2, sw)];
        const [ex, ey, wx, wy] = ik(Jf[0], Jf[1], wr[0], wr[1], FORE[0], FORE[1], 1);
        const paw = [lerp(f[0] + 1, wx - 1.4, sw), lerp(f[1] - 1.9, wy + 2.4, sw)];
        legs[k] = { pts: [Jf, [ex, grounded ? Math.min(ey, -4) : ey], [wx, wy], paw], r: [4.4, 2.8, 1.9, 1.8], paw, rot: -0.9 * sw };
      } else {
        // The long hind foot slants down to the paw when it's planted;
        // lifted, it folds and the paw swings under the hock; at the end of
        // a push the hock rises.
        const push = grounded ? clamp((Jh[0] - f[0] - 4) / 8, 0, 1) * (1 - sw) * w : 0;
        let mx = lerp(lerp(HOCK[0], 2.2, sw), -7.5, P.hock);
        let my = lerp(lerp(HOCK[1] - 1.5 * push, -7.5, sw), -2, P.hock);
        if (P.hs > 0.01) {
          const ddx = Jh[0] - f[0];
          const ddy = Jh[1] - f[1];
          const dd = Math.hypot(ddx, ddy) || 1;
          const foot = Math.hypot(HOCK[0], HOCK[1]);
          mx = lerp(mx, (ddx / dd) * foot, P.hs);
          my = lerp(my, (ddy / dd) * foot, P.hs);
        }
        let [kx, ky, qx, qy] = ik(Jh[0], Jh[1], f[0] + mx, f[1] - 2 + my, HIND[0], HIND[1], -1);
        // Sitting, the thigh folds forward and up into the haunch.
        kx = lerp(kx, Jh[0] + 8, P.hock);
        ky = lerp(ky, Jh[1] + 1, P.hock);
        if (grounded) ky = Math.min(ky, -4);
        const paw = [qx - mx + 0.6, qy - my];
        legs[k] = { pts: [Jh, [kx, ky], [qx, qy], paw], r: [6.2, 3.5, 2.1, 1.8], paw, rot: -0.6 * sw };
      }
    });

    // The tail: each segment sprung toward the pose's curve and a slow wave
    // that travels down it, the tip lagging and curling; thrown about by his
    // moves.
    let amp = 0.16;
    let om = 1.7;
    let tipOnly = false;
    let curl = 0.7;
    if (name === 'sleep' || name === 'loaf') {
      amp = 0.03;
      om = 0.9;
      curl = 0.15;
    } else if (['watch', 'aim', 'crouch', 'hunt', 'charge'].includes(c.mode)) {
      amp = 0.3;
      om = 7;
      tipOnly = true;
      curl = 0.2;
    } else if (c.mode === 'pet') {
      amp = 0.07;
      om = 24;
      tipOnly = true;
    } else if (name === 'drag') {
      amp = 0.3;
      om = 4.5;
    } else if (wG > 0.5 && w > 0.5) {
      amp = 0.12;
      om = 6;
      curl = 0.2;
    } else if (name === 'sit' || name === 'groom') {
      amp = 0.15;
      om = 1.3;
      curl = 0.9;
    } else if (w > 0.3) {
      // Walking, the sway keeps time with his steps.
      om = TAU * (c.speed / (L * S)) * 0.5 + 0.6;
      amp = 0.13;
    }
    const pushT = grounded ? c.accel || 0 : 0;
    const coil = 1 + curl * Math.sin(t * 1.1);
    const sub = dt / 2;
    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < TAIL_N; i += 1) {
        const u = (i + 1) / TAIL_N;
        const hook = i >= TAIL_N - 5 ? P.th * coil * 0.8 * (i - (TAIL_N - 6)) : 0;
        const wave = amp * Math.sin(om * t - i * 0.4) * (tipOnly ? ss(TAIL_N - 7, TAIL_N - 1, i) : u) + amp * 0.5 * Math.sin(om * 0.53 * t + 1.7 - i * 0.25) * u;
        const tgt = P.ta + P.tc * i + hook + wave;
        const K = 120 - i * 5;
        const torque = (pushT * Math.sin(ta[i]) * 0.012 + c.sqv * Math.cos(ta[i]) * 0.06) * u;
        tv[i] += (K * wrap(tgt - ta[i]) - 7 * tv[i] + torque) * sub;
        ta[i] += tv[i] * sub;
      }
    }
    const tail = [off(H, -4, 4.2)];
    const tailR = [2.8];
    for (let i = 0; i < TAIL_N; i += 1) {
      const p = tail[i];
      const r = lerp(2.6, 1.55, ((i + 1) / TAIL_N) ** 0.9);
      const q = [p[0] + Math.cos(ta[i]) * TAIL_SEG, p[1] + Math.sin(ta[i]) * TAIL_SEG];
      if (grounded) q[1] = Math.min(q[1], -r);
      tail.push(q);
      tailR.push(r);
    }

    R = { grounded, torso, H, Sh, head, tilt, legs, tail, tailR, haunch: P.haunch, lid: P.lid };
    const xs = [...torso.map((p) => p[0]), head[0] + 10, head[0] - 7];
    return { box: [Math.min(...xs) - 2, Math.max(...xs) + 2, head[1] - 14] };
  }

  // ---------- Drawing ----------

  function silhouette(g) {
    const r = R;
    chain(g, r.tail, r.tailR);
    smooth(g, r.torso);
    g.fill();
    if (r.haunch > 0.02) {
      g.beginPath();
      g.ellipse(r.H[0] + 2.5, Math.min(r.H[1] + 1, -10.5 * r.haunch), 12.5 * r.haunch, 10.5 * r.haunch, -0.4, 0, TAU);
      g.fill();
    }
    ['nh', 'nf'].forEach((k) => limb(g, r.legs[k]));
    headShape(g);
  }

  function limb(g, l) {
    chain(g, l.pts, l.r);
    g.beginPath();
    g.ellipse(l.paw[0], l.paw[1], 2.8, 1.85, l.rot, 0, TAU);
    g.fill();
  }

  function headShape(g) {
    g.save();
    g.translate(R.head[0], R.head[1]);
    g.rotate(R.tilt);
    smooth(g, SKULL);
    g.fill();
    ear(g, EAR_NEAR, 0);
    g.restore();
  }

  /** An ear: a sharp triangle, its tip swung back as he flattens it. */
  function ear(g, pts, flat) {
    const [b0, tip0, b1] = pts;
    const tip = [tip0[0] - flat * 5, tip0[1] + flat * 4];
    const k = 0.16;
    g.beginPath();
    g.moveTo(b0[0], b0[1]);
    g.lineTo(tip[0] + (b0[0] - tip[0]) * k, tip[1] + (b0[1] - tip[1]) * k);
    g.quadraticCurveTo(tip[0], tip[1], tip[0] + (b1[0] - tip[0]) * k, tip[1] + (b1[1] - tip[1]) * k);
    g.lineTo(b1[0], b1[1]);
    g.closePath();
    g.fill();
  }

  /** Paint him. g is already at his feet, in his units; opts: yaw (-1..1,
   *  his facing as he turns), pitch, light (the band along his top edges),
   *  eyeFill, eyeGlow, ssj (the power-up glow on his eyes), c (the state). */
  function draw(g, opts) {
    if (!R) return;
    const c = opts.c;
    const sgn = opts.yaw >= 0 ? 1 : -1;
    const bs = sgn * (0.35 + 0.65 * Math.abs(opts.yaw));
    const flat = clamp(c.ears || 0, 0, 1);
    g.save();
    g.scale(bs, 1);
    if (opts.pitch) {
      g.translate(0, -16);
      g.rotate(opts.pitch);
      g.translate(0, 16);
    }
    // Behind him: the far legs and the far ear, a shade darker.
    g.fillStyle = INK.far;
    ['xh', 'xf'].forEach((k) => limb(g, R.legs[k]));
    g.save();
    g.translate(R.head[0], R.head[1]);
    g.rotate(R.tilt);
    ear(g, EAR_FAR, flat * 0.9);
    g.restore();

    // The rest of him, one shape. The light, if wanted: the same shape a
    // little lower painted over a lighter one leaves a crisp band along
    // every top edge.
    if (opts.light) {
      const cv = g.canvas;
      if (!layer || layer.width !== cv.width || layer.height !== cv.height) {
        layer = document.createElement('canvas');
        layer.width = cv.width;
        layer.height = cv.height;
      }
      const L = layer.getContext('2d');
      L.setTransform(1, 0, 0, 1, 0, 0);
      L.clearRect(0, 0, layer.width, layer.height);
      L.setTransform(g.getTransform());
      L.fillStyle = INK.light;
      silhouette(L);
      L.globalCompositeOperation = 'source-atop';
      L.translate(0.25 * sgn, 0.8);
      L.fillStyle = INK.body;
      silhouette(L);
      L.globalCompositeOperation = 'source-over';
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(layer, 0, 0);
      g.restore();
    } else {
      g.fillStyle = INK.body;
      silhouette(g);
    }
    face(g, c, opts, flat);
    g.restore();
  }

  function face(g, c, opts, flat) {
    g.save();
    g.translate(R.head[0], R.head[1]);
    g.rotate(R.tilt);
    // The near ear's warm inside, a sliver along its front edge.
    const [b0, tip0, b1] = EAR_NEAR;
    if (flat < 0.6) {
      const tip = [tip0[0] - flat * 5, tip0[1] + flat * 4];
      g.fillStyle = INK.earIn;
      g.beginPath();
      g.moveTo(lerp(b1[0], b0[0], 0.25), lerp(b1[1], b0[1], 0.25) - 0.4);
      g.lineTo(lerp(tip[0], b1[0], 0.22), lerp(tip[1], b1[1], 0.22));
      g.lineTo(lerp(b1[0], tip[0], 0.12) - 0.2, lerp(b1[1], tip[1], 0.12));
      g.closePath();
      g.fill();
    }
    // The eye: an almond seen from the side, its front rounder (the curve
    // of the eye), green, a slit of a pupil looking where he looks.
    const open = c.open ?? R.lid;
    if (open > 0.14 && !c.happy) {
      g.save();
      g.translate(3.9, -1.9);
      g.rotate(-0.12);
      g.scale(1, open);
      g.beginPath();
      g.moveTo(-2.1, 0.5);
      g.bezierCurveTo(-1.2, -1.6, 1.2, -1.9, 2.0, -0.5);
      g.bezierCurveTo(2.4, 0.4, 1.6, 1.4, 0.6, 1.45);
      g.bezierCurveTo(-0.6, 1.5, -1.5, 1.1, -2.1, 0.5);
      g.closePath();
      g.fillStyle = opts.eyeFill || INK.eye;
      if (opts.ssj > 0.01) {
        g.shadowColor = opts.eyeGlow;
        g.shadowBlur = 5 * opts.ssj * (opts.dpr || 1);
      }
      g.fill();
      g.shadowBlur = 0;
      g.clip();
      g.fillStyle = '#000';
      g.beginPath();
      g.ellipse(0.75 + (c.lookX || 0) * 0.55, (c.lookY || 0) * 0.35 - 0.1, 0.5 * (c.pupil || 0.9), 1.35, 0, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.beginPath();
      g.arc(1.1 + (c.lookX || 0) * 0.5, -0.75, 0.32, 0, TAU);
      g.fill();
      g.restore();
    } else if (c.happy) {
      // Content: the eye a closed curve.
      g.strokeStyle = 'rgba(158,224,90,0.55)';
      g.lineWidth = 0.45;
      g.beginPath();
      g.moveTo(2, -1.6);
      g.quadraticCurveTo(3.9, -3, 5.8, -2);
      g.stroke();
    }
    // The nose's tip, the mouth open for a meow or a yawn, the tongue when
    // he licks his paw.
    g.fillStyle = INK.nose;
    g.beginPath();
    g.ellipse(9.1, -0.4, 0.75, 0.6, 0.3, 0, TAU);
    g.fill();
    const m = c.mouth || 0;
    if (m > 0.05) {
      g.fillStyle = INK.mouth;
      g.beginPath();
      g.moveTo(8.8, 1.5);
      g.lineTo(5, 2.4);
      g.lineTo(8.2, 1.6 + 3 * m);
      g.closePath();
      g.fill();
    }
    if ((c.lick || 0) > 0.05 && (c.groom || 0) > 0.5) {
      g.fillStyle = INK.mouth;
      g.beginPath();
      g.ellipse(9.2, 2.2 + c.lick * 0.6, 0.9 * c.lick + 0.2, 0.55, 0.5, 0, TAU);
      g.fill();
    }
    // Whiskers: fine and pale, forward from the muzzle.
    const tw = Math.sin(performance.now() / 700) * 0.04;
    g.strokeStyle = 'rgba(235,235,245,0.32)';
    g.lineWidth = 0.28;
    for (let i = 0; i < 3; i += 1) {
      const a = 0.18 - i * 0.16 + tw;
      const l = 8.5 - i * 1.2;
      g.beginPath();
      g.moveTo(7.6, 1.2 + i * 0.4);
      g.quadraticCurveTo(7.6 + l * 0.55, 0.9 + i * 0.5 - a * 2, 7.6 + l * Math.cos(a), 1.3 + i * 1.1 - Math.sin(a) * l * 0.5);
      g.stroke();
    }
    g.restore();
  }

  return { update, draw, P, get R() { return R; } };
}
