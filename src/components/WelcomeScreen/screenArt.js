/* One drawing, two surfaces. The 3D MacBook's screen texture and the DOM
   welcome screen both paint this exact canvas art, so when the camera dive
   ends and the DOM takes over, the pixels are identical, no visible seam.

   Everything is laid out on a fixed "stage" with the 16" MacBook Pro panel's
   aspect (3456×2234 native → 1728×1117 points). Both surfaces scale the
   stage to COVER their viewport the same way (see coverScale). */

export const STAGE_W = 1728;
export const STAGE_H = 1117;

export const WELCOME_TITLE = "Welcome to Ken's OS";
export const WELCOME_WALLPAPER_SRC = '/assets/backgrounds/tahoe-dark.jpg';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif';

/** Same math as the 3D camera dive: scale the stage to cover the viewport. */
export function coverScale(vw, vh) {
  return Math.max(vw / STAGE_W, vh / STAGE_H);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

let assetsPromise = null;
/** Wallpaper, loaded once and shared by both surfaces. */
export function loadScreenAssets() {
  if (!assetsPromise) {
    assetsPromise = loadImage(WELCOME_WALLPAPER_SRC).then((wallpaper) => ({ wallpaper }));
  }
  return assetsPromise;
}

function drawCover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

/** Paint the welcome screen onto a canvas at `pixelRatio` × stage size. */
export const WELCOME_SUBTITLE = 'Kenneth Nathanael  ·  Designer';
export const TITLE_Y = STAGE_H / 2 - 18;
export const SUBTITLE_Y = STAGE_H / 2 + 58;

// The Mac's "hello", written on the white screen once the camera is in (the stroke from
// LottieFiles' free "Hello Apple" animation: its path, in a 320 x 120 box
// centred on 0, 0). On the stage it is HELLO_W wide, in the middle.
export const HELLO_PATH = 'M-145.7 43.7C-145.7 43.7 -86.1 10.3 -81.9 -26.2C-79.4 -46.9 -98.6 -44.1 -101.4 -23.0C-103.8 -5.8 -109.6 40.6 -109.6 40.6C-109.6 40.6 -104.0 -0.0 -85.9 1.8C-65.9 4.1 -92.0 40.0 -69.0 40.3C-48.6 40.5 -27.6 22.7 -26.9 10.9C-26.0 -2.6 -44.4 -4.9 -50.0 12.0C-55.2 27.5 -43.6 44.9 -23.5 40.6C7.3 33.9 22.5 -10.8 23.9 -26.1C25.5 -42.2 13.7 -43.7 6.6 -29.4C-0.1 -16.0 -11.2 37.1 13.0 41.6C41.8 46.9 64.3 -5.9 67.1 -23.8C69.8 -41.1 58.7 -46.0 50.2 -30.7C41.2 -14.2 27.8 44.1 59.9 41.3C86.7 39.0 76.9 2.3 102.9 -0.1C114.6 -1.1 119.4 9.9 118.5 21.0C117.6 32.6 106.7 42.5 95.8 40.9C85.9 39.5 80.8 26.0 83.4 17.1C86.6 6.1 96.7 0.1 102.9 -0.1C111.8 -0.3 116.2 5.3 124.1 5.2C131.2 5.1 138.3 -2.9 138.3 -2.9';
export const HELLO_W = 980;
const HELLO_SCALE = HELLO_W / 320;
const HELLO_STROKE = 11;
// Apple's "hello" colours, in the order the pen meets them: teal into green,
// yellow, orange, red, pink, violet, blue, and out in a pale sky blue.
const HELLO_STOPS = [
  [0, '#3c7d90'],
  [0.1, '#79b4a3'],
  [0.19, '#b9d36d'],
  [0.26, '#dccf47'],
  [0.33, '#f1bd44'],
  [0.41, '#f1a046'],
  [0.5, '#e9784f'],
  [0.6, '#e0584b'],
  [0.67, '#e98c9c'],
  [0.73, '#c672a9'],
  [0.79, '#7b5db9'],
  [0.86, '#3e69c1'],
  [0.93, '#4f8bd2'],
  [1, '#86b5de'],
];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function colourAt(u) {
  let i = 1;
  while (i < HELLO_STOPS.length - 1 && HELLO_STOPS[i][0] < u) i += 1;
  const [u0, c0] = HELLO_STOPS[i - 1];
  const [u1, c1] = HELLO_STOPS[i];
  const k = Math.min(1, Math.max(0, (u - u0) / (u1 - u0)));
  const a = hex(c0);
  const b = hex(c1);
  return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`;
}

let helloPts = null;
/** The stroke as points along its length (measured once, by the browser). */
function helloPoints() {
  if (!helloPts && typeof document !== 'undefined') {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', HELLO_PATH);
    const L = el.getTotalLength();
    const n = 900;
    helloPts = Array.from({ length: n + 1 }, (_, i) => {
      const q = el.getPointAtLength((L * i) / n);
      return [q.x, q.y];
    });
  }
  return helloPts || [];
}

/** Paint "hello", written `k` (0..1) of the way, centred on the stage, its
 *  colour running along the stroke. */
export function paintHello(ctx, k) {
  const pts = helloPoints();
  const n = Math.floor((pts.length - 1) * Math.min(1, k));
  if (n < 1) return;
  ctx.save();
  ctx.translate(STAGE_W / 2, STAGE_H / 2);
  ctx.scale(HELLO_SCALE, HELLO_SCALE);
  ctx.lineWidth = HELLO_STROKE;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Short runs, each its own colour; later runs lie over earlier ones where
  // the letters cross, as a pen would.
  const RUN = 4;
  for (let i = 0; i < n; i += RUN) {
    const j = Math.min(n, i + RUN);
    ctx.strokeStyle = colourAt(i / (pts.length - 1));
    ctx.beginPath();
    ctx.moveTo(pts[i][0], pts[i][1]);
    for (let m = i + 1; m <= j; m += 1) ctx.lineTo(pts[m][0], pts[m][1]);
    ctx.stroke();
  }
  ctx.restore();
}

/** `text: false` paints only the backdrop; `white` paints the plain white
 *  the screen wakes to (the 3D screen, before "hello"). */
export function paintWelcome(canvas, { wallpaper }, pixelRatio = 2, { text = true, white = false } = {}) {
  const w = STAGE_W * pixelRatio;
  const h = STAGE_H * pixelRatio;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, STAGE_W, STAGE_H);
  if (white) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    return canvas;
  }
  drawCover(ctx, wallpaper, 0, 0, STAGE_W, STAGE_H);

  // Soft centre vignette so the title reads on any part of the wallpaper.
  const glow = ctx.createRadialGradient(STAGE_W / 2, STAGE_H / 2, 0, STAGE_W / 2, STAGE_H / 2, STAGE_W * 0.42);
  glow.addColorStop(0, 'rgba(0,0,0,0.28)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);

  if (!text) return canvas;
  const cx = STAGE_W / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.font = `700 92px ${FONT}`;
  ctx.fillText(WELCOME_TITLE, cx, TITLE_Y);

  ctx.shadowBlur = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.66)';
  ctx.font = `500 24px ${FONT}`;
  ctx.fillText(WELCOME_SUBTITLE, cx, SUBTITLE_Y);
  return canvas;
}
