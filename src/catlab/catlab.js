// The preview page for Toothless's new body (catlab.html, dev only): every
// pose and gait big, a walk-cycle sheet, and his real size on the desktop.
import { createBody } from '../components/Desktop/catBody.js';

const S = 1.7; // his scale on the desktop
const BIG = 5.4;
const dpr = Math.min(window.devicePixelRatio || 1, 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const stride = (v) => clamp(32 + v * 0.18, 34, 120);

const state = () => ({
  pose: 'stand', mode: 'walk', speed: 0, phase: 0, accel: 0, vx: 0, vy: 0, sq: 0, sqv: 0,
  thrown: false, swat: false, bat: 0, quick: true, until: 0, groom: 0,
  lookX: 0.3, lookY: 0, lookTilt: 0, pupil: 0.9, ears: 0, mouth: 0, open: 1, happy: false,
});

let sheetDirty = true;
const ui = { pose: 'stand', speed: 58, light: false, onion: false, paused: false, yaw: 1, face: 1, blinkAt: -1e9, look: 0, ears: 0, meow: -1e9, purr: false };

// ---------- Controls ----------
const POSE_LIST = [
  ['stand', 'Stand'], ['sit', 'Sit'], ['groom', 'Groom'], ['loaf', 'Loaf'], ['sleep', 'Sleep'], ['stretch', 'Stretch'],
  ['bow', 'Play bow'], ['aim', 'Size up a jump'], ['crouch', 'Crouch'], ['air', 'Jump'], ['land', 'Land'], ['hang', 'Hang on a ledge'], ['drag', 'Picked up'],
];
const MOVES = [['Stop', 0], ['Walk', 58], ['Slow trot', 120], ['Trot', 180], ['Run', 290], ['Zoomies', 520]];
const posesEl = document.getElementById('poses');
const movesEl = document.getElementById('moves');
const faceEl = document.getElementById('face');
const speedEl = document.getElementById('speed');
const speedOut = document.getElementById('speedOut');
const btn = (parent, label, fn) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', () => fn(b));
  parent.appendChild(b);
  return b;
};
const poseBtns = POSE_LIST.map(([k, label]) => {
  const b = btn(posesEl, label, () => setPose(k));
  b.dataset.k = k;
  return b;
});
MOVES.forEach(([label, v]) => btn(movesEl, label, () => setSpeed(v, true)));
btn(faceEl, 'Blink', () => (ui.blinkAt = performance.now()));
btn(faceEl, 'Look up', () => (ui.look = ui.look === 1 ? 0 : 1));
btn(faceEl, 'Look down', () => (ui.look = ui.look === -1 ? 0 : -1));
btn(faceEl, 'Ears back', () => (ui.ears = ui.ears ? 0 : 1));
btn(faceEl, 'Meow', () => (ui.meow = performance.now()));
btn(faceEl, 'Purr', () => (ui.purr = !ui.purr));

function gaitName(v) {
  if (v < 3) return 'standing';
  if (v < 100) return 'walk';
  if (v < 250) return 'trot';
  return 'gallop';
}
function setSpeed(v, toStand) {
  ui.speed = v;
  speedEl.value = v;
  speedOut.textContent = `${v} px/s, ${gaitName(v)}`;
  if (toStand && v > 0) setPose('stand');
  sheetDirty = true;
}
function setPose(k) {
  ui.pose = k;
  if (k !== 'stand') {
    ui.speed = 0;
    speedEl.value = 0;
    speedOut.textContent = '0 px/s, standing';
  }
  poseBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
}
setPose('stand');
setSpeed(58);
speedEl.addEventListener('input', () => setSpeed(Number(speedEl.value), true));
document.getElementById('light').addEventListener('change', (e) => (ui.light = e.target.checked));
document.getElementById('onion').addEventListener('change', (e) => {
  ui.onion = e.target.checked;
  sheetDirty = true;
});
document.getElementById('pause').addEventListener('click', (e) => {
  ui.paused = !ui.paused;
  e.target.textContent = ui.paused ? 'Play' : 'Pause';
});
document.getElementById('turn').addEventListener('click', () => (ui.face = -ui.face));

// ---------- Canvases ----------
const big = document.getElementById('big');
const small = document.getElementById('small');
const gb = big.getContext('2d');
const gs = small.getContext('2d');
function fit() {
  const w = big.parentElement.clientWidth;
  big.width = w * dpr;
  big.height = 470 * dpr;
  big.style.height = '470px';
  small.width = w * dpr;
  small.height = 240 * dpr;
  small.style.height = '240px';
  sheetDirty = true;
}
window.addEventListener('resize', fit);
fit();
const wall = new Image();
wall.src = '/assets/backgrounds/tahoe-dark.webp';

// One body for the big view, one each for the two at real size.
const cats = {
  big: { body: createBody({ S }), c: state() },
  desk: { body: createBody({ S }), c: state(), x: 120, face: 1, yaw: 1 },
  win: { body: createBody({ S }), c: state(), x: 420, face: -1, yaw: -1 },
};

/** The face's state for now (blinks, looks, ears, a meow). */
function faceState(c, now) {
  const b = (now - ui.blinkAt) / 1000;
  const blink = b >= 0 && b < 0.2 ? Math.sin((Math.PI * b) / 0.2) : 0;
  const auto = Math.sin(now / 1000 * 0.9) > 0.995 ? 1 : 0;
  const m = (now - ui.meow) / 1000;
  c.mouth = m >= 0 && m < 0.6 ? Math.sin((Math.PI * m) / 0.6) : 0;
  c.lookY = approach(c.lookY, -ui.look * 0.9, 8, 1 / 60);
  c.lookTilt = approach(c.lookTilt, -ui.look * 0.28, 6, 1 / 60);
  c.ears = approach(c.ears, ui.ears, 8, 1 / 60);
  c.happy = ui.purr;
  c.open = (1 - Math.max(blink, auto)) * 1;
}

function stepCat(k, dt, t, now, v) {
  const cat = cats[k];
  const c = cat.c;
  c.pose = ui.pose;
  c.mode = ui.pose === 'stand' ? (v > 0 ? 'walk' : 'idle') : ui.pose;
  const prev = c.speed;
  c.speed = approach(c.speed, ui.pose === 'stand' ? v : 0, 8, dt);
  c.accel = approach(c.accel, (c.speed - prev) / Math.max(dt, 1e-3), 10, dt);
  c.phase = (c.phase + (c.speed * dt) / stride(c.speed)) % 1;
  if (ui.pose === 'air') c.vy = -650 + 1300 * ((t % 1.4) / 1.4);
  faceState(c, now);
  const lid = { sleep: 0, loaf: 0.55, stretch: 0.25, groom: 0.35, drag: 0.6 }[ui.pose];
  if (lid !== undefined) c.open = Math.min(c.open, lid);
  return cat.body.update(dt, t, c);
}

/** A walk-cycle sheet: eight moments of one stride at this speed. */
let sheet = null;
function buildSheet() {
  sheetDirty = false;
  const v = Math.max(ui.speed, 40);
  const body = createBody({ S });
  const c = state();
  c.pose = 'stand';
  c.mode = 'walk';
  c.speed = v;
  const dt = 1 / 120;
  let t = 0;
  const step = () => {
    t += dt;
    c.phase = (c.phase + (v * dt) / stride(v)) % 1;
    body.update(dt, t, c);
  };
  for (let i = 0; i < 360; i += 1) step();
  // To phase 0, then each eighth.
  while (c.phase > 0.02) step();
  const N = 8;
  const fw = (big.width / N) | 0;
  const fh = big.height;
  sheet = document.createElement('canvas');
  sheet.width = fw * N;
  sheet.height = fh;
  const g = sheet.getContext('2d');
  for (let k = 0; k < N; k += 1) {
    const goal = k / N;
    let guard = 0;
    while (Math.abs(((c.phase - goal + 1.5) % 1) - 0.5) > 0.006 && guard < 2000) {
      step();
      guard += 1;
    }
    const sc = Math.min(fw / 70, fh / 75) * 0.95;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = k % 2 ? '#26262a' : '#222226';
    g.fillRect(k * fw, 0, fw, fh);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.font = `${12 * dpr}px -apple-system, sans-serif`;
    g.fillText(`${k * 2 + 1}`, k * fw + 10 * dpr, 20 * dpr);
    const gy = fh * 0.8;
    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.fillRect(k * fw, gy, fw, 1 * dpr);
    g.setTransform(sc, 0, 0, sc, k * fw + fw * 0.52, gy);
    body.draw(g, { yaw: 1, light: ui.light, c, dpr });
  }
}

let last = performance.now();
let t = 0;
let ground = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (ui.paused) dt = 0;
  t += dt;
  const v = ui.pose === 'stand' ? ui.speed : 0;

  // The big one: walking on the spot, the ground going by under him.
  const bigBox = stepCat('big', dt, t, now, v);
  ui.yaw = approach(ui.yaw, ui.face, 5, dt);
  gb.setTransform(1, 0, 0, 1, 0, 0);
  if (ui.onion && ui.pose === 'stand') {
    if (sheetDirty || !sheet) buildSheet();
    gb.fillStyle = '#1c1c1e';
    gb.fillRect(0, 0, big.width, big.height);
    gb.drawImage(sheet, 0, 0);
  } else {
    gb.fillStyle = '#2b4fa8';
    const gr = gb.createLinearGradient(0, 0, 0, big.height);
    gr.addColorStop(0, '#3e67c9');
    gr.addColorStop(1, '#1d3a8a');
    gb.fillStyle = gr;
    gb.fillRect(0, 0, big.width, big.height);
    const gy = big.height * 0.86;
    gb.fillStyle = 'rgba(0,0,0,0.18)';
    gb.fillRect(0, gy, big.width, big.height - gy);
    ground = (ground + cats.big.c.speed * (BIG / S) * dpr * dt) % (60 * dpr);
    gb.fillStyle = 'rgba(255,255,255,0.12)';
    for (let x = -ground * ui.face; x < big.width + 60 * dpr; x += 60 * dpr) gb.fillRect(x, gy + 6 * dpr, 18 * dpr, 2 * dpr);
    const cx = big.width * 0.5;
    // A soft shadow under him.
    gb.fillStyle = 'rgba(0,0,0,0.22)';
    gb.beginPath();
    gb.ellipse(cx, gy, 30 * BIG * dpr * 0.75, 3 * BIG * dpr * 0.6, 0, 0, Math.PI * 2);
    gb.fill();
    gb.setTransform(BIG * dpr, 0, 0, BIG * dpr, cx, ui.pose === 'drag' ? big.height * 0.18 : ui.pose === 'hang' ? big.height * 0.4 : gy);
    if (ui.pose === 'hang') {
      gb.fillStyle = 'rgba(255,255,255,0.2)';
      gb.fillRect(-10, 0, 80, 1.2);
    }
    cats.big.body.draw(gb, { yaw: ui.yaw, light: ui.light, c: cats.big.c, dpr });
  }
  void bigBox;

  // Real size: across the wallpaper, and across a dark window.
  const W = small.width / dpr;
  gs.setTransform(1, 0, 0, 1, 0, 0);
  if (wall.complete && wall.naturalWidth) gs.drawImage(wall, 0, wall.naturalHeight * 0.55, wall.naturalWidth, wall.naturalHeight * 0.2, 0, 0, small.width, small.height / 2);
  else {
    gs.fillStyle = '#2a4ea8';
    gs.fillRect(0, 0, small.width, small.height / 2);
  }
  gs.fillStyle = '#1c1c1e';
  gs.fillRect(0, small.height / 2, small.width, small.height / 2);
  gs.fillStyle = '#2c2c2f';
  gs.fillRect(0, small.height / 2, small.width, 1 * dpr);
  [['desk', 110], ['win', 230]].forEach(([k, gy]) => {
    const cat = cats[k];
    stepCat(k, dt, t, now, v);
    if (v > 0) {
      cat.x += cat.face * cat.c.speed * dt;
      if (cat.x > W - 60) cat.face = -1;
      if (cat.x < 60) cat.face = 1;
    }
    cat.yaw = approach(cat.yaw, cat.face, 5, dt);
    gs.setTransform(dpr, 0, 0, dpr, 0, 0);
    gs.fillStyle = 'rgba(0,0,0,0.25)';
    gs.beginPath();
    gs.ellipse(cat.x, gy, 30, 3, 0, 0, Math.PI * 2);
    gs.fill();
    gs.setTransform(S * dpr, 0, 0, S * dpr, cat.x * dpr, gy * dpr);
    cat.body.draw(gs, { yaw: cat.yaw, light: ui.light, c: cat.c, dpr });
  });
}
requestAnimationFrame(frame);

// For filming.
window.__lab = { ui, setPose, setSpeed, cats };
