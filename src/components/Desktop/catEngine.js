// Kerning, the desktop cat: a procedural animal, not a sprite.
//
// The body is a rig: a spine from hips to shoulders, a neck and head, four
// two-bone legs placed by inverse kinematics, and a tail that follows the
// body with lag. Walking and running are real gaits (each foot plants, holds
// while the body passes over it, lifts and swings forward). Poses (stand,
// crouch, sit, loaf) are a handful of numbers the rig eases between, so every
// change of state is a movement, never a cut.
//
// The world is the desktop's real surfaces, read from the page every frame:
// the floor, the Dock's top, window title bars and desktop icons (anything
// marked [data-cat-surface] or [data-window-titlebar]). He stands on them,
// rides them when they move, falls when they go, and plans his own jumps
// between them: walk to the take-off, crouch and wiggle, leap on a true
// ballistic arc, land with a squash.

const G = 2400; // gravity, px/s²
const S = 1.2; // the cat's scale (the rig is drawn in units of ~1px at S = 1)
const WALK = 62; // px/s
const RUN = 230;
const MAX_UP = 250; // the highest he will jump, px
const MAX_ACROSS = 460;
const EDGE = 16; // how close to a surface's end he will stand

const INK = '#16161a';
const FAR = '#0b0b0d';
const WHITE = '#f5f2ec';
const EYE = '#cfe36a';
const PINK = '#eba3ab';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const rand = (a, b) => a + Math.random() * (b - a);

/** Every surface he can stand on, as screen-space segments. */
function readSurfaces() {
  const out = [{ key: 'floor', el: null, x0: 0, x1: window.innerWidth, y: window.innerHeight - 1 }];
  document.querySelectorAll('[data-cat-surface], [data-window-titlebar]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 30 || r.height < 8 || r.bottom < 0 || r.top > window.innerHeight) return;
    const style = el.closest('[role="dialog"]')?.style;
    if (style && style.visibility === 'hidden') return;
    out.push({ key: el, el, x0: r.left, x1: r.right, y: r.top });
  });
  return out;
}

/** Two-bone IK: from joint (jx, jy) to foot (fx, fy), bones a and b; `bend`
 *  +1 puts the knee forward, -1 back. Returns the knee. */
function ik(jx, jy, fx, fy, a, b, bend) {
  let dx = fx - jx;
  let dy = fy - jy;
  let d = Math.hypot(dx, dy);
  const max = a + b - 0.01;
  if (d > max) {
    dx *= max / d;
    dy *= max / d;
    d = max;
  }
  const cos = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1);
  const base = Math.atan2(dy, dx);
  const ang = base - bend * Math.acos(cos);
  return [jx + Math.cos(ang) * a, jy + Math.sin(ang) * a];
}

export function createCat({ canvas, onSay }) {
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  const size = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  };
  size();

  // Where he is (his feet), how he moves, what he stands on.
  const c = {
    x: 140,
    y: window.innerHeight - 1,
    vx: 0,
    vy: 0,
    face: 1,
    on: null, // { key, el, dx } when standing on a surface
    mode: 'idle',
    until: 0,
    plan: null, // { tx, then }
    phase: 0, // the gait's cycle
    speed: 0,
    look: { x: 0, y: 0 },
    blink: 0,
    nextBlink: 2,
    purr: 0,
    drag: null,
    laser: false,
  };
  // The pose the rig eases toward, and where it is now.
  const POSES = {
    stand: { hip: 25, sh: 27, hipX: -17, shX: 17, head: 0, crouch: 0, sit: 0, loaf: 0 },
    crouch: { hip: 14, sh: 15, hipX: -15, shX: 18, head: 0.15, crouch: 1, sit: 0, loaf: 0 },
    sit: { hip: 7, sh: 31, hipX: -9, shX: 9, head: -0.05, crouch: 0, sit: 1, loaf: 0 },
    loaf: { hip: 9, sh: 10, hipX: -15, shX: 15, head: 0.35, crouch: 0, sit: 0, loaf: 1 },
  };
  const pose = { ...POSES.stand };
  let poseName = 'stand';
  // The tail: segment angles (radians, 0 = backwards), eased toward a shape.
  const TAIL_N = 9;
  const tail = Array.from({ length: TAIL_N }, (_, i) => 1.1 + i * 0.12);
  let surfaces = readSurfaces();
  let pointer = { x: -999, y: -999, t: 0, vx: 0 };
  const hearts = [];

  const surfaceOf = (on) => (on ? surfaces.find((s) => s.key === on.key) : null);
  const span = (s) => [s.x0 + EDGE, s.x1 - EDGE];

  const say = (t) => onSay?.(t);
  const set = (mode, secs = 0) => {
    c.mode = mode;
    c.until = performance.now() / 1000 + secs;
  };

  // ---------- Thinking ----------
  /** The surfaces he could jump to from where he stands, with the take-off
   *  and landing points. */
  function reachable() {
    const here = surfaceOf(c.on);
    if (!here) return [];
    const [h0, h1] = span(here);
    const out = [];
    surfaces.forEach((s) => {
      if (s.key === here.key || s.x1 - s.x0 < 40) return;
      const [s0, s1] = span(s);
      if (s1 < s0) return;
      // Land somewhere on it; take off from the nearest point of where he is.
      const lx = clamp(rand(s0, s1), s0, s1);
      const tx = clamp(lx - Math.sign(lx - c.x || 1) * 90, h0, h1);
      const up = here.y - s.y;
      const across = Math.abs(lx - tx);
      if (up > MAX_UP || across > MAX_ACROSS || across < 12) return;
      // Not into the underside of something: the landing must be clear above.
      out.push({ s, lx, tx, up });
    });
    return out;
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function decide(now) {
    // Reduced motion: he stays put, sitting.
    if (still) return set('sit', 1e6);
    const here = surfaceOf(c.on);
    const r = Math.random();
    const options = reachable();
    if (options.length && r < 0.42) {
      // Somewhere else: higher places are more interesting.
      options.sort((a, b) => b.up - a.up + rand(-120, 120));
      const o = options[0];
      c.plan = { tx: o.tx, jump: o };
      set('walk');
      return;
    }
    if (here && r < 0.62) {
      const [a, b] = span(here);
      c.plan = { tx: clamp(c.x + rand(-260, 260), a, b) };
      set('walk');
      return;
    }
    if (r < 0.78) set('sit', rand(4, 8));
    else if (r < 0.88) set('groom', rand(3, 5));
    else set('sleep', rand(12, 22));
    void now;
  }

  function launch(target) {
    const apex = Math.min(c.y, target.s.y) - 34 - Math.abs(target.lx - c.x) * 0.12;
    const vy0 = -Math.sqrt(2 * G * Math.max(8, c.y - apex));
    const tUp = -vy0 / G;
    const tDown = Math.sqrt((2 * Math.max(4, target.s.y - apex)) / G);
    c.vx = (target.lx - c.x) / (tUp + tDown);
    c.vy = vy0;
    c.face = Math.sign(c.vx) || c.face;
    c.on = null;
    set('air');
  }

  // ---------- Moving ----------
  function step(dt, now) {
    surfaces = readSurfaces();
    const here = surfaceOf(c.on);

    // Standing on something: ride it; if it has gone, fall.
    if (c.on && c.mode !== 'drag') {
      if (!here) {
        c.on = null;
        c.vx = 0;
        c.vy = 0;
        set('air');
      } else {
        c.y = here.y;
        if (here.el) c.x = here.x0 + c.on.dx;
        c.x = clamp(c.x, here.x0 + 4, here.x1 - 4);
      }
    }

    if (c.mode === 'drag') {
      // Held by the scruff: the body swings under the hand.
      const d = c.drag;
      c.vx = (d.x - d.px) / Math.max(dt, 1e-3);
      c.vy = (d.y - d.py) / Math.max(dt, 1e-3);
      d.px = d.x;
      d.py = d.y;
      d.swing = approach(d.swing, clamp(-c.vx / 900, -0.9, 0.9), 6, dt);
      c.x = d.x;
      c.y = d.y + 44 * S;
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
        // Lands on the first surface his feet cross on the way down.
        const hit = surfaces
          .filter((s) => c.x > s.x0 + 4 && c.x < s.x1 - 4 && py <= s.y + 1 && c.y >= s.y)
          .sort((a, b) => a.y - b.y)[0];
        if (hit) {
          c.y = hit.y;
          c.on = { key: hit.key, dx: c.x - hit.x0 };
          c.impact = clamp(c.vy / 1400, 0.25, 1);
          c.vx = 0;
          c.vy = 0;
          set('land', 0.28);
        }
      }
      return;
    }

    const t = now / 1000;
    let speed = 0;
    if (c.mode === 'walk' || c.mode === 'run' || c.mode === 'chase') {
      const target = c.mode === 'chase' ? pointer.x : c.plan?.tx ?? c.x;
      const lim = here ? span(here) : [20, window.innerWidth - 20];
      const tx = clamp(target, lim[0], lim[1]);
      const d = tx - c.x;
      const max = c.mode === 'walk' ? WALK : RUN;
      speed = Math.min(max, Math.abs(d) * 4);
      if (Math.abs(d) > 1) c.face = Math.sign(d);
      c.x += Math.sign(d) * Math.min(Math.abs(d), speed * dt);
      if (here?.el) c.on.dx = c.x - here.x0;
      if (Math.abs(d) < 1.5) {
        if (c.mode === 'chase') {
          if (c.laser && Math.abs(pointer.y - c.y) > 30) {
            // The dot is above or below: jump for it.
            const s = surfaces
              .filter((q) => pointer.x > q.x0 + 10 && pointer.x < q.x1 - 10 && q.y >= pointer.y - 10)
              .sort((a, b) => a.y - b.y)[0];
            if (s && s.key !== c.on?.key && c.y - s.y < MAX_UP) {
              c.plan = { jump: { s, lx: pointer.x } };
              set('crouch', 0.32);
            }
          }
        } else if (c.plan?.jump) {
          c.face = Math.sign(c.plan.jump.lx - c.x) || c.face;
          set('crouch', 0.42);
        } else {
          c.plan = null;
          set('idle', rand(0.8, 2.2));
        }
      }
    } else if (c.mode === 'crouch' && t > c.until) {
      if (c.plan?.jump) launch(c.plan.jump);
      c.plan = null;
    } else if (c.mode === 'land' && t > c.until) {
      set(c.laser ? 'chase' : 'idle', rand(0.5, 1.5));
    } else if (c.mode === 'pet' && t > c.until) {
      set('sit', rand(2, 4));
    } else if (['idle', 'sit', 'groom', 'sleep'].includes(c.mode) && t > c.until) {
      if (c.laser) set('chase');
      else decide(now);
    }
    // Gait: the cycle runs with the ground covered.
    c.speed = approach(c.speed, speed, 10, dt);
    const stride = c.speed > 120 ? 46 : 24;
    c.phase = (c.phase + (c.speed * dt) / stride) % 1;
  }

  // ---------- Drawing ----------
  function updatePose(dt, t) {
    const want =
      c.mode === 'crouch' || c.mode === 'land'
        ? 'crouch'
        : c.mode === 'sit' || c.mode === 'groom' || c.mode === 'pet'
          ? 'sit'
          : c.mode === 'sleep'
            ? 'loaf'
            : 'stand';
    poseName = want;
    const p = POSES[want];
    const rate = c.mode === 'land' ? 18 : want === 'crouch' ? 14 : 5;
    Object.keys(pose).forEach((k) => {
      pose[k] = approach(pose[k], p[k], rate, dt);
    });
    // Blinks, and closed eyes asleep or purring.
    c.nextBlink -= dt;
    if (c.nextBlink < 0) {
      c.blink = 1;
      c.nextBlink = rand(2.5, 6);
    }
    c.blink = Math.max(0, c.blink - dt * 7);
    c.purr = approach(c.purr, c.mode === 'pet' ? 1 : 0, 6, dt);
    void t;
  }

  /** Feet targets for the near and far legs, in the cat's own space. */
  function feet(t) {
    const run = c.speed > 120;
    const moving = c.speed > 4 && c.mode !== 'air';
    const stance = run ? 0.42 : 0.62;
    const stride = run ? 30 : 16;
    const lift = run ? 9 : 6;
    // Walk: near hind, near fore, far hind, far fore, a quarter apart.
    // Run (a gallop): hinds together, then fores.
    const offs = run ? { nh: 0, fh: 0.1, nf: 0.5, ff: 0.6 } : { nh: 0, nf: 0.25, fh: 0.5, ff: 0.75 };
    const out = {};
    ['nh', 'fh', 'nf', 'ff'].forEach((leg) => {
      const hind = leg.endsWith('h');
      const jx = hind ? pose.hipX : pose.shX;
      let fx = jx + (hind ? -2 : 2);
      let fy = 0;
      if (moving) {
        const q = (c.phase + offs[leg]) % 1;
        if (q < stance) fx += stride * (0.5 - q / stance);
        else {
          const u = (q - stance) / (1 - stance);
          fx += stride * (-0.5 + u);
          fy -= lift * Math.sin(Math.PI * u);
        }
      }
      if (c.mode === 'air') {
        // Up: stretched out, hinds back and fores reaching; down: reaching
        // for the landing.
        const up = c.vy < 0;
        fx = hind ? jx - (up ? 16 : 6) : jx + (up ? 14 : 8);
        fy = up ? (hind ? -6 : -14) : -2;
      }
      out[leg] = [fx, fy];
    });
    void t;
    return out;
  }

  function drawLeg(j, f, hind, color) {
    const [kx, ky] = ik(j[0], j[1], f[0], f[1], 12.5, 13, hind ? 1 : -1);
    ctx.strokeStyle = color;
    ctx.lineWidth = hind ? 7.5 : 6.5;
    ctx.beginPath();
    ctx.moveTo(j[0], j[1]);
    ctx.lineTo(kx, ky);
    ctx.lineTo(f[0], f[1] - 1.5);
    ctx.stroke();
    // The paw: white on the near legs (tuxedo socks), a dark one far side.
    ctx.fillStyle = color === FAR ? '#2a2a2e' : WHITE;
    ctx.beginPath();
    ctx.ellipse(f[0] + 1.5, f[1] - 1.6, 4.2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTail(rootX, rootY, t, dt) {
    // The shape it wants: up and curling when walking or happy, low and
    // swishing when stalking, curled round the body sitting, wrapped asleep.
    // (Angles: 0 straight back, up is positive, down negative.)
    const base =
      c.mode === 'sleep' || poseName === 'loaf'
        ? -0.25
        : poseName === 'sit'
          ? -0.35
          : c.mode === 'crouch'
            ? 0.12
            : c.mode === 'air'
              ? 0.45
              : 1.1;
    // Up and hooking forward at the tip standing; round the body on the
    // ground sitting or asleep.
    const curl =
      poseName === 'loaf' ? -0.3 : poseName === 'sit' ? -0.24 : c.mode === 'crouch' ? 0.02 : 0.12;
    const swish = c.mode === 'crouch' ? 0.35 * Math.sin(t * 16) : 0.12 * Math.sin(t * 1.7);
    for (let i = 0; i < TAIL_N; i += 1) {
      const target = base + i * curl + swish * (i / TAIL_N);
      // Each segment follows a little later than the one before.
      tail[i] = approach(tail[i], target, 9 - i * 0.7, dt);
    }
    ctx.strokeStyle = INK;
    ctx.lineCap = 'round';
    let x = rootX;
    let y = rootY;
    for (let i = 0; i < TAIL_N; i += 1) {
      const a = Math.PI + tail[i]; // 0 points backwards; positive turns it up
      const nx = x + Math.cos(a) * 4.6;
      const ny = y + Math.sin(a) * 4.6;
      ctx.lineWidth = lerp(6, 3.2, i / TAIL_N);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      x = nx;
      y = ny;
    }
  }

  function drawHead(hx, hy, t) {
    // Looks at the pointer when it is near (within reason).
    const dx = (pointer.x - c.x) * c.face;
    const dy = pointer.y - (c.y + hy * S);
    const near = Math.hypot(dx, dy) < 420 && c.mode !== 'sleep';
    const tilt = near ? clamp(Math.atan2(dy, Math.max(30, dx)) * 0.5, -0.45, 0.4) : pose.head;
    c.look.y = approach(c.look.y, tilt, 6, 1 / 60);
    const groom = c.mode === 'groom' ? 0.55 + 0.12 * Math.sin(t * 9) : 0;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(c.look.y + groom);
    // Ears.
    ctx.fillStyle = FAR;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(-3, -17);
    ctx.lineTo(2, -8);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(1, -8);
    ctx.lineTo(6, -18.5);
    ctx.lineTo(9.5, -6);
    ctx.fill();
    ctx.fillStyle = PINK;
    ctx.beginPath();
    ctx.moveTo(3.4, -9);
    ctx.lineTo(6, -15);
    ctx.lineTo(7.8, -8);
    ctx.fill();
    // Head.
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(2, -1, 10.5, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Muzzle and chin, white.
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(9.5, 3.2, 5.6, 4.4, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PINK;
    ctx.beginPath();
    ctx.ellipse(13.6, 1.4, 1.5, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye: almond, a slit pupil; shut asleep, happy arcs when stroked.
    const shut = c.mode === 'sleep' ? 1 : Math.max(c.blink, c.purr);
    if (shut > 0.6) {
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (c.purr > 0.6) ctx.arc(6.5, -1.2, 2.4, Math.PI * 1.1, Math.PI * 1.9);
      else ctx.arc(6.5, -2.8, 2.4, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else {
      ctx.fillStyle = EYE;
      ctx.beginPath();
      ctx.ellipse(6.6, -1.6, 2.6, 2.9 * (1 - shut), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.ellipse(7.2, -1.6, 0.9, 2.5 * (1 - shut), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(7.8, -2.6, 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    // Whiskers.
    ctx.strokeStyle = 'rgba(245,242,236,0.75)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(11, 4);
    ctx.lineTo(22, 2.5);
    ctx.moveTo(11, 5);
    ctx.lineTo(21.5, 6.5);
    ctx.stroke();
    ctx.restore();
  }

  function drawCat(t, dt) {
    const crouchWiggle = c.mode === 'crouch' ? Math.sin(t * 22) * 1.2 : 0;
    const moving = c.speed > 4;
    const run = c.speed > 120;
    const bob = moving ? Math.sin(c.phase * Math.PI * 4) * (run ? 2.2 : 1) : Math.sin(t * 2) * 0.35; // breathing
    const flex = run ? Math.sin(c.phase * Math.PI * 2) * 5 : 0; // the gallop's spine
    const purr = c.purr * Math.sin(t * 60) * 0.3;
    const sq = c.mode === 'land' ? Math.max(0, (c.until - t) / 0.28) * c.impact : 0;

    const hip = [pose.hipX - flex / 2 + crouchWiggle * 0.3, -pose.hip + bob * 0.6 + sq * 6];
    const sh = [pose.shX + flex / 2, -pose.sh + bob + sq * 7 + purr];
    const f = feet(t);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Far legs, behind everything.
    if (pose.loaf < 0.6) {
      if (pose.sit < 0.5) drawLeg([hip[0] + 2, hip[1] + 2], f.fh, true, FAR);
      drawLeg([sh[0] - 1, sh[1] + 2], pose.sit > 0.5 ? [sh[0] + 1, 0] : f.ff, false, FAR);
    }
    drawTail(hip[0] - 6, hip[1] - 2, t, dt);

    // The body: a thick spine from hips to shoulders, the back arched.
    const arch = 6 + pose.crouch * 2 - pose.sit * 4;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 21 - pose.loaf * 1 + pose.sit * 3;
    ctx.beginPath();
    ctx.moveTo(hip[0], hip[1]);
    ctx.quadraticCurveTo((hip[0] + sh[0]) / 2, Math.min(hip[1], sh[1]) - arch, sh[0], sh[1]);
    ctx.stroke();
    // Sitting, the haunch: a round hind quarter on the ground.
    if (pose.sit > 0.05) {
      ctx.fillStyle = INK;
      ctx.globalAlpha = Math.min(1, pose.sit * 1.5);
      ctx.beginPath();
      ctx.ellipse(hip[0] + 1, -9, 13, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.ellipse(hip[0] + 9, -2, 5, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // The white chest.
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(sh[0] + 5, sh[1] + 4 - pose.sit * 4, 5.5, 7 + pose.sit * 4, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Near legs.
    if (pose.loaf < 0.6) {
      if (pose.sit < 0.5) drawLeg(hip, f.nh, true, INK);
      drawLeg([sh[0] + 2, sh[1] + 3], pose.sit > 0.5 ? [sh[0] + 4, 0] : f.nf, false, INK);
    } else {
      // Loafed: front paws tucked, just showing.
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.ellipse(sh[0] + 8, -2, 4.5, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Neck and head, forward of the shoulders.
    const hx = sh[0] + 10 - pose.sit * 3 + pose.loaf * 2;
    const hy = sh[1] - 11 + pose.sit * 2 + pose.loaf * 8 + bob * 0.5;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(sh[0], sh[1]);
    ctx.lineTo(hx - 2, hy + 2);
    ctx.stroke();
    drawHead(hx, hy, t);
  }

  function drawDangling(t) {
    // Held by the scruff: hanging long, legs limp, tail down, swinging.
    const d = c.drag;
    ctx.rotate(d.swing + Math.sin(t * 3) * 0.04);
    ctx.lineCap = 'round';
    ctx.strokeStyle = FAR;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-4, 34);
    ctx.lineTo(-6, 56);
    ctx.moveTo(4, 14);
    ctx.lineTo(3, 32);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.quadraticCurveTo(-8, 62, -3, 74);
    ctx.stroke();
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, 42);
    ctx.stroke();
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(4, 14, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(6, 16);
    ctx.lineTo(8, 34);
    ctx.moveTo(4, 38);
    ctx.lineTo(6, 58);
    ctx.stroke();
    ctx.fillStyle = WHITE;
    [[8, 35], [6, 59]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, 3.2, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // The head, tipped up, ears back: not thrilled.
    c.look.y = -0.3;
    ctx.save();
    ctx.translate(2, 0);
    ctx.rotate(-0.25);
    drawHead(0, 0, t);
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
    updatePose(dt, t);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    // A soft contact shadow where he stands.
    if (c.on || c.mode !== 'air') {
      if (c.mode !== 'drag') {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, 30 * S, 3.5 * S, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.save();
    ctx.translate(c.x, c.y);
    if (c.mode === 'drag') {
      ctx.translate(0, -44 * S);
      ctx.scale(S * c.face, S);
      drawDangling(t);
    } else {
      ctx.scale(S * c.face, S);
      // In the air the body pitches with its flight.
      if (c.mode === 'air') ctx.rotate(clamp(c.vy / 2600, -0.4, 0.5) * (c.vx === 0 ? 0 : 1));
      drawCat(t, dt);
    }
    ctx.restore();
    // Hearts when stroked.
    if (c.mode === 'pet' && Math.random() < dt * 2.5) hearts.push({ x: c.x + c.face * 22, y: c.y - 46, t: 0 });
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
    // The laser dot.
    if (c.laser && pointer.x > 0) {
      ctx.fillStyle = 'rgba(255,40,40,0.95)';
      ctx.shadowColor = 'rgba(255,0,0,0.9)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    // Keep the hitbox on him.
    if (hitbox) {
      const h = c.mode === 'drag' ? { x: c.x - 26, y: c.y - 60 * S, w: 52, h: 80 * S } : { x: c.x - 36 * S, y: c.y - 56 * S, w: 72 * S, h: 58 * S };
      hitbox.style.transform = `translate3d(${h.x.toFixed(1)}px, ${h.y.toFixed(1)}px, 0)`;
      hitbox.style.width = `${h.w}px`;
      hitbox.style.height = `${h.h}px`;
    }
  };
  raf = requestAnimationFrame(frame);

  const onMove = (e) => {
    pointer = { x: e.clientX, y: e.clientY, t: performance.now() };
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
      // Thrown: keeps the hand's speed (within reason), falls.
      c.vx = clamp(c.vx, -900, 900);
      c.vy = clamp(c.vy, -900, 600);
      set('air');
    } else {
      set('pet', 2.8);
      say(c.mode === 'sleep' ? '…mrrp?' : 'purrr.');
    }
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('resize', size);

  // In development, a handle to drive him from the console (window.__kerning).
  if (import.meta.env?.DEV) window.__kerning = { c, set, launch, surfaces: () => surfaces, reachable };

  // Start: he walks in from the left along the floor.
  c.x = -30;
  c.on = { key: 'floor', dx: 0 };
  c.plan = { tx: 160 };
  set('walk');

  return {
    setHitbox(el) {
      hitbox = el;
    },
    /** Pointer down on him: pick him up (or, if it is just a click, a stroke). */
    grab(e) {
      const sleeping = c.mode === 'sleep';
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
      if (sleeping) c.mode = 'sleep';
    },
    stroke() {
      set('pet', 3);
      say('purrr.');
    },
    nap() {
      set('sleep', 25);
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
