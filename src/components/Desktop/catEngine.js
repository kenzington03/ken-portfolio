// Kerning, the desktop cat: drawn and moved live, every frame.
//
// He is a cartoon cat built for charm: a big round head, a soft bean of a
// body, stubby legs with white socks, big glossy eyes. Every pose (stand,
// crouch, sit, loaf, mid-air) is a set of numbers the drawing eases between,
// so nothing ever cuts; walking and running are real gaits (each paw plants,
// holds, lifts, swings), and his tail follows his body with lag.
//
// His world is the desktop's real surfaces, read from the page every frame:
// the floor, the Dock's top, window title bars and desktop icons (anything
// marked [data-cat-surface] or [data-window-titlebar]). He stands on them,
// rides them when they move, falls when they go, and plans his own jumps
// between them (walk to the take-off, crouch and wiggle, leap, squash).
//
// Left to himself he wanders, climbs, naps, grooms, gets the zoomies (off
// one side of the screen and back in from the other), bats a ball of yarn
// about, chases a mouse along the floor, and on a high perch is distracted
// by a butterfly.

const G = 2400; // gravity, px/s²
const S = 1.3; // his scale (the drawing is in units of ~1px at S = 1)
const WALK = 64; // px/s
const RUN = 250;
const ZOOM = 520;
const MAX_UP = 250; // the highest he will jump, px
const MAX_ACROSS = 460;
const EDGE = 14; // how close to a surface's end he will stand

const FUR = ['#3a3a45', '#15151b']; // a soft gradient, lit from the top left
const FAR = '#0d0d11';
const WHITE = '#f7f3ec';
const PINK = '#f2a7b4';
const IRIS = ['#d9f08a', '#79b443'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/** Every surface he can stand on, as screen-space segments. */
function readSurfaces() {
  const out = [{ key: 'floor', el: null, x0: -200, x1: window.innerWidth + 200, y: window.innerHeight - 1 }];
  document.querySelectorAll('[data-cat-surface], [data-window-titlebar]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 30 || r.height < 8 || r.bottom < 0 || r.top > window.innerHeight) return;
    out.push({ key: el, el, x0: r.left, x1: r.right, y: r.top });
  });
  return out;
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
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const c = {
    x: -40,
    y: window.innerHeight - 1,
    vx: 0,
    vy: 0,
    face: 1,
    on: { key: 'floor', dx: 0 },
    mode: 'walk',
    until: 0,
    plan: { tx: 180 },
    phase: 0,
    speed: 0,
    look: 0,
    blink: 0,
    nextBlink: 2,
    purr: 0,
    drag: null,
    laser: false,
    impact: 0,
    bat: 0, // a paw swipe, 1 .. 0
    count: 0,
  };
  // The poses: body centre and radii, head centre, how folded the legs are.
  const POSES = {
    stand: { bx: 0, by: -16, brx: 19, bry: 11.5, rot: 0, hx: 19, hy: -30, sit: 0, loaf: 0, crouch: 0 },
    crouch: { bx: -1, by: -11, brx: 21, bry: 9.5, rot: -0.12, hx: 21, hy: -20, sit: 0, loaf: 0, crouch: 1 },
    sit: { bx: -3, by: -17, brx: 12, bry: 16, rot: 0, hx: 3, hy: -40, sit: 1, loaf: 0, crouch: 0 },
    loaf: { bx: 0, by: -10, brx: 20, bry: 10, rot: 0, hx: 17, hy: -18, sit: 0, loaf: 1, crouch: 0 },
  };
  const pose = { ...POSES.stand };
  let poseName = 'stand';
  const TAIL_N = 9;
  const tail = Array.from({ length: TAIL_N }, (_, i) => 1.0 + i * 0.12);
  let surfaces = readSurfaces();
  let pointer = { x: -999, y: -999 };
  const hearts = [];
  // His things: a ball of yarn, a mouse, a butterfly.
  const toys = { yarn: null, mouse: null, fly: null };

  const surfaceOf = (on) => (on ? surfaces.find((s) => s.key === on.key) : null);
  const span = (s) => [Math.max(s.x0 + EDGE, -60), Math.min(s.x1 - EDGE, window.innerWidth + 60)];
  const say = (t) => onSay?.(t);
  const set = (mode, secs = 0) => {
    c.mode = mode;
    c.until = performance.now() / 1000 + secs;
  };
  const onFloor = () => c.on?.key === 'floor';

  // ---------- Thinking ----------
  function reachable() {
    const here = surfaceOf(c.on);
    if (!here) return [];
    const [h0, h1] = span(here);
    const out = [];
    surfaces.forEach((s) => {
      if (s.key === here.key || s.x1 - s.x0 < 40) return;
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
    if (here && r < 0.28) return startYarn();
    if (options.length && r < 0.6) {
      options.sort((a, b) => b.up - a.up + rand(-120, 120));
      c.plan = { tx: options[0].tx, jump: options[0] };
      return set('walk');
    }
    if (here && r < 0.7) {
      const [a, b] = span(here);
      c.plan = { tx: clamp(c.x + rand(-260, 260), a, b) };
      return set('walk');
    }
    if (r < 0.84) return set('sit', rand(4, 8));
    if (r < 0.92) return set('groom', rand(3, 5));
    return set('sleep', rand(12, 22));
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
    if (!here) return set('sit', 3);
    const [a, b] = span(here);
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
    toys.fly = { x: c.x + c.face * 140, y: c.y - 120, t: 0, life: rand(7, 11) };
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
    surfaces = readSurfaces();
    const here = surfaceOf(c.on);
    const t = now / 1000;

    if (c.on && c.mode !== 'drag') {
      if (!here) {
        c.on = null;
        c.vx = 0;
        c.vy = 0;
        set('air');
      } else {
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
          .filter((s) => c.x > s.x0 + 4 && c.x < s.x1 - 4 && py <= s.y + 1 && c.y >= s.y)
          .sort((a, b) => a.y - b.y)[0];
        if (hit) {
          c.y = hit.y;
          c.on = { key: hit.key, dx: c.x - hit.x0 };
          c.impact = clamp(c.vy / 1400, 0.3, 1);
          c.vx = 0;
          c.vy = 0;
          set('land', 0.3);
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
                set('crouch', 0.3);
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
          set('crouch', 0.18);
        }
        break;
      }
      case 'crouch':
        if (t > c.until) {
          const j = c.plan?.jump;
          if (j) launch({ x: j.lx, y: j.s.y });
          c.plan = null;
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
            // A swat: a little hop straight up at it.
            c.vx = 0;
            c.vy = -Math.sqrt(2 * G * 70);
            c.on = null;
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
        if (t > c.until) {
          if (c.laser) set('chase');
          else decide();
        }
    }
    c.speed = approach(c.speed, speed, 10, dt);
    const stride = c.speed > 300 ? 60 : c.speed > 120 ? 44 : 22;
    c.phase = (c.phase + (c.speed * dt) / stride) % 1;
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
      f.t += dt;
      const tx = c.x + c.face * 60 + Math.sin(f.t * 1.3) * 70;
      const ty = c.y - 90 + Math.sin(f.t * 2.1) * 30;
      if (f.flee) {
        f.x += 160 * dt;
        f.y -= 120 * dt;
      } else {
        f.x = approach(f.x, tx, 1.2, dt);
        f.y = approach(f.y, ty, 1.2, dt);
      }
      if (f.t > f.life || f.y < -40) toys.fly = null;
    }
  }

  // ---------- Drawing ----------
  function updatePose(dt) {
    const want =
      c.mode === 'crouch' || c.mode === 'land'
        ? 'crouch'
        : ['sit', 'groom', 'pet', 'watch'].includes(c.mode)
          ? 'sit'
          : c.mode === 'sleep'
            ? 'loaf'
            : 'stand';
    poseName = want;
    const p = POSES[want];
    const rate = c.mode === 'land' ? 18 : want === 'crouch' ? 14 : 6;
    Object.keys(pose).forEach((k) => {
      pose[k] = approach(pose[k], p[k], rate, dt);
    });
    c.nextBlink -= dt;
    if (c.nextBlink < 0) {
      c.blink = 1;
      c.nextBlink = rand(2.5, 6);
    }
    c.blink = Math.max(0, c.blink - dt * 7);
    c.purr = approach(c.purr, c.mode === 'pet' ? 1 : 0, 6, dt);
  }

  const fur = (x, y, r) => {
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, r * 0.1, x, y, r * 1.2);
    g.addColorStop(0, FUR[0]);
    g.addColorStop(1, FUR[1]);
    return g;
  };

  /** A stubby leg: a rounded column from its top to its foot, a white sock. */
  function leg(tx, ty, fx, fy, w, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(fx, fy - w * 0.35);
    ctx.stroke();
    ctx.fillStyle = color === FAR ? '#cfc9bf' : WHITE;
    ctx.beginPath();
    ctx.ellipse(fx + 0.8, fy - 2.2, w * 0.58, 2.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Where each paw is, in his own space, for the gait and the pose. */
  function paws() {
    const run = c.speed > 120;
    const moving = c.speed > 4;
    const stance = run ? 0.45 : 0.62;
    const stride = c.speed > 300 ? 20 : run ? 15 : 9;
    const lift = run ? 7 : 4.5;
    const offs = run ? { nh: 0, fh: 0.12, nf: 0.5, ff: 0.62 } : { nh: 0, nf: 0.25, fh: 0.5, ff: 0.75 };
    const tops = { nh: [-11, -10], fh: [-14, -11], nf: [11, -10], ff: [8, -11] };
    const out = {};
    Object.keys(tops).forEach((k) => {
      const [tx] = tops[k];
      let fx = tx;
      let fy = 0;
      if (moving) {
        const q = (c.phase + offs[k]) % 1;
        if (q < stance) fx += stride * (0.5 - q / stance);
        else {
          const u = (q - stance) / (1 - stance);
          fx += stride * (-0.5 + u);
          fy -= lift * Math.sin(Math.PI * u);
        }
      }
      if (c.mode === 'air') {
        const up = c.vy < 0;
        const hind = k.endsWith('h');
        fx = hind ? tx - (up ? 10 : 4) : tx + (up ? 9 : 5);
        fy = up ? -5 : -1;
      }
      // A swipe: the near front paw comes up and out.
      if (k === 'nf' && c.bat > 0) {
        const b = Math.sin(Math.PI * c.bat);
        fx += 10 * b;
        fy -= 12 * b;
      }
      fy = lerp(fy, Math.min(fy, -1), pose.crouch);
      out[k] = [fx, fy, tops[k][0], tops[k][1] * (1 - pose.crouch * 0.45)];
    });
    return out;
  }

  function drawTail(rx, ry, t, dt) {
    // (Angles: 0 straight back, up is positive.)
    const base = poseName === 'loaf' ? -0.2 : poseName === 'sit' ? -0.5 : c.mode === 'crouch' ? 0.1 : c.mode === 'air' ? 0.45 : c.speed > 300 ? 0.2 : 1.05;
    const curl = poseName === 'loaf' ? -0.34 : poseName === 'sit' ? -0.26 : c.mode === 'crouch' ? 0.02 : 0.13;
    const swish = c.mode === 'crouch' ? 0.4 * Math.sin(t * 16) : c.mode === 'watch' ? 0.25 * Math.sin(t * 5) : 0.12 * Math.sin(t * 1.7);
    for (let i = 0; i < TAIL_N; i += 1) {
      tail[i] = approach(tail[i], base + i * curl + swish * (i / TAIL_N), 9 - i * 0.7, dt);
    }
    let x = rx;
    let y = ry;
    ctx.lineCap = 'round';
    for (let i = 0; i < TAIL_N; i += 1) {
      const a = Math.PI + tail[i];
      const nx = x + Math.cos(a) * 4.4;
      const ny = y + Math.sin(a) * 4.4;
      ctx.strokeStyle = i >= TAIL_N - 2 ? WHITE : FUR[1];
      ctx.lineWidth = lerp(7, 4.6, i / TAIL_N);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      x = nx;
      y = ny;
    }
  }

  function drawHead(hx, hy, t, { annoyed = false } = {}) {
    // He looks at what interests him: a toy, else the pointer when near.
    let tx = pointer.x;
    let ty = pointer.y;
    if (toys.fly) [tx, ty] = [toys.fly.x, toys.fly.y];
    else if (toys.mouse) [tx, ty] = [toys.mouse.x, c.y];
    else if (toys.yarn) [tx, ty] = [toys.yarn.x, toys.yarn.y];
    const dx = (tx - c.x) * c.face;
    const dy = ty - (c.y + hy * S);
    const near = Math.hypot(dx, dy) < 460 && c.mode !== 'sleep';
    const want = near ? clamp(Math.atan2(dy, Math.max(40, Math.abs(dx))) * 0.45, -0.4, 0.35) : 0;
    c.look = approach(c.look, want, 5, 1 / 60);
    const groom = c.mode === 'groom' ? 0.5 + 0.12 * Math.sin(t * 9) : 0;
    const sleepy = poseName === 'loaf' ? 0.25 : 0;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(c.look + groom + sleepy);
    // Ears: rounded, the far one behind.
    const ear = (bx0, tipx, tipy, bx1, by, col, inner) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(bx0, by);
      ctx.quadraticCurveTo(tipx - 2, tipy - 2, tipx, tipy);
      ctx.quadraticCurveTo(tipx + 2, tipy + 1, bx1, by + 2);
      ctx.closePath();
      ctx.fill();
      if (inner) {
        ctx.fillStyle = PINK;
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.moveTo(bx0 + 2.5, by);
        ctx.quadraticCurveTo(tipx - 1, tipy + 3, tipx, tipy + 4);
        ctx.quadraticCurveTo(tipx + 1, tipy + 4, bx1 - 2.5, by + 2);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };
    const back = c.speed > 300 || annoyed ? 4 : 0; // ears back at speed
    ear(-11, -10 - back, -17 + back * 0.6, -1, -8, FAR, false);
    ctx.fillStyle = fur(0, 0, 15);
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 13.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ear(1, 7 - back, -21 + back * 0.6, 12, -8, FUR[1], true);
    // Muzzle and blush.
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(6.5, 6, 8.5, 5.8, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(242,140,160,0.35)';
    ctx.beginPath();
    ctx.ellipse(-1.5, 6.5, 3, 1.8, 0, 0, Math.PI * 2);
    ctx.ellipse(14, 6.5, 2.6, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes: big and glossy; shut asleep, happy arcs when stroked, flat and
    // unimpressed when held.
    const shut = poseName === 'loaf' ? 1 : Math.max(c.blink, c.purr);
    [
      [1.5, -2.2, 3.8, 4.6],
      [10.5, -1.8, 3.5, 4.3],
    ].forEach(([ex, ey, rx, ry]) => {
      if (shut > 0.6) {
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (c.purr > 0.6) ctx.arc(ex, ey + 1.5, rx * 0.8, Math.PI * 1.15, Math.PI * 1.85);
        else ctx.arc(ex, ey - 1, rx * 0.8, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
        return;
      }
      const h = ry * (1 - shut) * (annoyed ? 0.55 : 1);
      const g = ctx.createLinearGradient(0, ey - h, 0, ey + h);
      g.addColorStop(0, IRIS[0]);
      g.addColorStop(1, IRIS[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(ex, ey, rx, h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#101010';
      ctx.beginPath();
      ctx.ellipse(ex + 0.6, ey + 0.3, rx * (c.mode === 'crouch' || c.mode === 'watch' ? 0.75 : 0.42), h * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex + 1.6, ey - h * 0.4, 1.1, 0, Math.PI * 2);
      ctx.arc(ex - 0.8, ey + h * 0.35, 0.55, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = PINK;
    ctx.beginPath();
    ctx.moveTo(8, 3.6);
    ctx.lineTo(11.4, 3.6);
    ctx.lineTo(9.7, 5.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3a2a2a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(9.7, 5.4);
    ctx.quadraticCurveTo(8.8, 7.4, 7.4, 6.8);
    ctx.moveTo(9.7, 5.4);
    ctx.quadraticCurveTo(10.8, 7.4, 12.2, 6.8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(247,243,236,0.8)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(14, 5);
    ctx.lineTo(25, 3);
    ctx.moveTo(14, 6.5);
    ctx.lineTo(25, 7);
    ctx.moveTo(-1, 6);
    ctx.lineTo(-10, 5);
    ctx.stroke();
    ctx.restore();
  }

  function drawCat(t, dt) {
    const run = c.speed > 120;
    const moving = c.speed > 4;
    // The body bounces with each stride (more running), breathes at rest.
    const bob = moving ? Math.abs(Math.sin(c.phase * Math.PI * 2)) * (run ? 4 : 1.4) : Math.sin(t * 2) * 0.4;
    const stretch = run ? Math.sin(c.phase * Math.PI * 2) * 0.08 : 0;
    const sq = c.mode === 'land' ? Math.max(0, (c.until - t) / 0.3) * c.impact : 0;
    const wiggle = c.mode === 'crouch' ? Math.sin(t * 24) * 1.4 : 0;
    const purr = c.purr * Math.sin(t * 70) * 0.25;
    const p = paws();
    const bx = pose.bx;
    const by = pose.by - bob + sq * 5;
    const brx = pose.brx * (1 + stretch + sq * 0.15);
    const bry = pose.bry * (1 - stretch * 0.6 - sq * 0.25);

    ctx.lineCap = 'round';
    const legsOn = 1 - Math.max(pose.loaf, pose.sit);
    if (legsOn > 0.3) {
      leg(p.fh[2], p.fh[3] + by + 16, p.fh[0], p.fh[1], 8.5, FAR);
      leg(p.ff[2], p.ff[3] + by + 16, p.ff[0], p.ff[1], 8, FAR);
    }
    drawTail(bx - brx * 0.85, by - bry * 0.1 + (poseName === 'sit' ? 14 : 0), t, dt);
    // The body: a soft bean, lit from above.
    ctx.save();
    ctx.translate(bx + wiggle * 0.3, by);
    ctx.rotate(pose.rot);
    ctx.fillStyle = fur(0, 0, Math.max(brx, bry));
    ctx.beginPath();
    ctx.ellipse(0, 0, brx, bry, 0, 0, Math.PI * 2);
    ctx.fill();
    // Sitting: the haunch, round on the ground.
    if (pose.sit > 0.05) {
      ctx.globalAlpha = Math.min(1, pose.sit * 1.4);
      ctx.fillStyle = fur(-2, 9, 13);
      ctx.beginPath();
      ctx.ellipse(-2, 8 * pose.sit, 13 * pose.sit + 2, 9 * pose.sit + 1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.ellipse(8, 16, 5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // The white bib.
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(brx * 0.62, bry * 0.15, brx * 0.32, bry * 0.62, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (legsOn > 0.3) {
      leg(p.nh[2], p.nh[3] + by + 16, p.nh[0], p.nh[1], 9, FUR[1]);
      leg(p.nf[2], p.nf[3] + by + 16, p.nf[0], p.nf[1], 8.5, FUR[1]);
    } else if (pose.sit > 0.5) {
      leg(3, by + 6, 3.5, 0, 7.5, FAR);
      leg(8, by + 6, 8.5, 0, 8, FUR[1]);
    } else {
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.ellipse(16, -2.5, 5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawHead(pose.hx + wiggle * 0.2, pose.hy - bob * 0.6 + sq * 6 + purr, t);
    if (c.mode === 'sleep') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '600 9px -apple-system, sans-serif';
      const k = (t % 2.4) / 2.4;
      ctx.globalAlpha = Math.sin(Math.PI * k);
      ctx.fillText('z', 20 + k * 8, -34 - k * 14);
      ctx.globalAlpha = 1;
    }
  }

  function drawDangling(t) {
    const d = c.drag;
    ctx.rotate(d.swing + Math.sin(t * 3) * 0.04);
    ctx.lineCap = 'round';
    leg(-5, 30, -6, 48, 7.5, FAR);
    leg(6, 14, 7, 32, 7.5, FAR);
    ctx.strokeStyle = FUR[1];
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(-2, 40);
    ctx.quadraticCurveTo(-10, 56, -4, 68);
    ctx.stroke();
    ctx.fillStyle = fur(0, 24, 18);
    ctx.beginPath();
    ctx.ellipse(0, 26, 11.5, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(3, 18, 5.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    leg(1, 30, 2, 50, 8, FUR[1]);
    leg(5, 16, 6, 34, 8, FUR[1]);
    c.look = -0.15;
    drawHead(0, 0, t, { annoyed: true });
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
      const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, r);
      g.addColorStop(0, '#f27b8e');
      g.addColorStop(1, '#b3304a');
      ctx.fillStyle = g;
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
      ctx.fillStyle = PINK;
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
    if (f) {
      const flap = Math.abs(Math.sin(t * 18));
      ctx.save();
      ctx.translate(f.x, f.y);
      ['#ffb347', '#ff7a59'].forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.ellipse(-3.5 * flap, i ? 3 : -2, 6 * flap + 1, i ? 4 : 6, i ? 0.4 : -0.4, 0, Math.PI * 2);
        ctx.ellipse(3.5 * flap, i ? 3 : -2, 6 * flap + 1, i ? 4 : 6, i ? -0.4 : 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#222';
      ctx.fillRect(-0.8, -5, 1.6, 10);
      ctx.restore();
    }
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
    updatePose(dt);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawToys(t);
    if (c.mode !== 'drag' && c.mode !== 'air') {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, (poseName === 'sit' ? 18 : 26) * S, 3.2 * S, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(c.x, c.y);
    if (c.mode === 'drag') {
      ctx.translate(0, -46 * S);
      ctx.scale(S * c.face, S);
      drawDangling(t);
    } else {
      ctx.scale(S * c.face, S);
      if (c.mode === 'air') ctx.rotate(clamp(c.vy / 2600, -0.4, 0.5) * (c.vx === 0 ? 0 : 1));
      drawCat(t, dt);
    }
    ctx.restore();
    if (c.mode === 'pet' && Math.random() < dt * 2.5) hearts.push({ x: c.x + c.face * 16, y: c.y - 62, t: 0 });
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
      const h = c.mode === 'drag' ? { x: c.x - 26, y: c.y - 62 * S, w: 52, h: 84 * S } : { x: c.x - 30 * S, y: c.y - 60 * S, w: 60 * S, h: 60 * S };
      hitbox.style.transform = `translate3d(${h.x.toFixed(1)}px, ${h.y.toFixed(1)}px, 0)`;
      hitbox.style.width = `${h.w}px`;
      hitbox.style.height = `${h.h}px`;
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
      set('air');
    } else {
      set('pet', 2.8);
      say(pick(['purrr.', 'mrrp.', '♥']));
    }
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('resize', size);

  if (import.meta.env?.DEV) window.__kerning = { c, set, launch, toys, surfaces: () => surfaces, startZoomies, startYarn, startMouse, startButterfly };

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
