// A small player for simple Lottie shape animations: shape layers made of
// groups with a path, a fill and a transform, their paths and transforms
// keyframed with bezier easing (no masks, mattes, parenting or expressions).
// Enough for Toothless's sitting and grooming ("Black cat" by PoPoF on
// LottieFiles, Lottie Simple License), drawn frame-exact onto a 2D canvas.

/** A cubic-bezier easing (like CSS), solved for x by bisection. */
function bezier(x1, y1, x2, y2) {
  const at = (a, b, t) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t * t + t * t * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 24; i += 1) {
      const v = at(x1, x2, t);
      if (Math.abs(v - x) < 1e-4) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return at(y1, y2, t);
  };
}

const first = (v) => (Array.isArray(v) ? v[0] : v);
const easeCache = new WeakMap();
function easeOf(kf) {
  let e = easeCache.get(kf);
  if (!e) {
    e = kf.o && kf.i ? bezier(first(kf.o.x), first(kf.o.y), first(kf.i.x), first(kf.i.y)) : (u) => u;
    easeCache.set(kf, e);
  }
  return e;
}

function mix(a, b, u) {
  if (typeof a === 'number') return a + (b - a) * u;
  if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], u));
  // A path: { i, o, v, c }.
  return { c: a.c, i: mix(a.i, b.i, u), o: mix(a.o, b.o, u), v: mix(a.v, b.v, u) };
}

/** A property's value at frame f. */
function valueAt(prop, f) {
  if (!prop) return undefined;
  if (!prop.a) return prop.k;
  const ks = prop.k;
  if (f <= ks[0].t) return ks[0].s;
  for (let i = 0; i < ks.length - 1; i += 1) {
    const a = ks[i];
    const b = ks[i + 1];
    if (f < b.t) {
      const end = b.s ?? a.e;
      if (a.h || !end) return a.s;
      return mix(a.s, end, easeOf(a)((f - a.t) / (b.t - a.t)));
    }
  }
  const last = ks[ks.length - 1];
  return last.s ?? ks[ks.length - 2].e;
}

function transform(ctx, tr, f) {
  const p = valueAt(tr.p, f) || [0, 0];
  const a = valueAt(tr.a, f) || [0, 0];
  const s = valueAt(tr.s, f) || [100, 100];
  const r = valueAt(tr.r, f) || 0;
  ctx.translate(p[0], p[1]);
  if (r) ctx.rotate((first(r) * Math.PI) / 180);
  ctx.scale(s[0] / 100, s[1] / 100);
  ctx.translate(-a[0], -a[1]);
}

function trace(ctx, path) {
  const { v, i, o, c } = path;
  if (!v?.length) return;
  ctx.moveTo(v[0][0], v[0][1]);
  const n = v.length;
  for (let j = 1; j < n + (c ? 1 : 0); j += 1) {
    const p = v[j - 1];
    const q = v[j % n];
    ctx.bezierCurveTo(p[0] + o[j - 1][0], p[1] + o[j - 1][1], q[0] + i[j % n][0], q[1] + i[j % n][1], q[0], q[1]);
  }
  if (c) ctx.closePath();
}

/**
 * A player for one animation. `colour(rgb)` may restyle a fill (it gets the
 * fill's [r, g, b] in 0..1 and returns a CSS colour, or a function giving one
 * at each draw, for a colour that changes). draw(ctx, frame) paints that frame
 * in the animation's own coordinates.
 */
export function lottiePlayer(data, { colour } = {}) {
  const layers = [...data.layers].reverse(); // the first layer is on top
  const fills = new Map();
  const fillOf = (c) => {
    const key = c.join(',');
    if (!fills.has(key)) {
      const [r, g, b] = c;
      fills.set(key, colour?.([r, g, b]) || `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`);
    }
    return fills.get(key);
  };
  return {
    frames: data.op - data.ip,
    fps: data.fr,
    draw(ctx, frame) {
      const f = data.ip + frame;
      layers.forEach((L) => {
        if (L.ty !== 4 || f < L.ip || f >= L.op) return;
        const op = (valueAt(L.ks.o, f) ?? 100) / 100;
        if (op <= 0) return;
        ctx.save();
        transform(ctx, L.ks, f);
        L.shapes.forEach((g) => {
          if (g.ty !== 'gr') return;
          const tr = g.it.find((it) => it.ty === 'tr');
          const fl = g.it.find((it) => it.ty === 'fl');
          ctx.save();
          if (tr) transform(ctx, tr, f);
          ctx.beginPath();
          g.it.forEach((it) => {
            if (it.ty === 'sh') {
              const v = valueAt(it.ks, f);
              trace(ctx, Array.isArray(v) ? v[0] : v);
            }
          });
          if (fl) {
            ctx.globalAlpha *= op * ((valueAt(fl.o, f) ?? 100) / 100);
            const fill = fillOf(valueAt(fl.c, f));
            ctx.fillStyle = typeof fill === 'function' ? fill() : fill;
            ctx.fill();
          }
          ctx.restore();
        });
        ctx.restore();
      });
    },
  };
}
