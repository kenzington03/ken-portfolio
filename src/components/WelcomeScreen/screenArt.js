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

/** `text: false` paints only the backdrop, for the DOM screen that animates its own title. */
export function paintWelcome(canvas, { wallpaper }, pixelRatio = 2, { text = true } = {}) {
  const w = STAGE_W * pixelRatio;
  const h = STAGE_H * pixelRatio;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, STAGE_W, STAGE_H);
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
