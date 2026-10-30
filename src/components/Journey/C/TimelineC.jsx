// Ten years as one camera move. The basketball comes to the middle of the
// screen and the ruler draws out of it both ways: the ball is the slider's
// knob. The camera stays on it, dead centre, and the years pan underneath
// (the journey steps it: one scroll, one role, every leg the same length of
// time). The role the ball is on rises into place above it, a line at a time.
// When the ball sets off, that label travels with it, then sinks under the
// line, each of its lines shrinking into place, and rests where the role
// ended as a small note in the same format, as the next one rises. All of
// it is scroll-driven, from the same progress as the camera, so it moves as
// one and lands where it should at any zoom. After the last role the camera pulls
// back to the whole journey, every role noted along the line, and holds there.
// Then (`retract`) the words step back and the line rewinds into the ball, a
// tape measure winding in, as the ball comes to the middle: ten years wound
// into one dot, which opens into the Apple logo. The internships came first
// and are drawn in blue, the work in ink. The year rolls big in the top left.
//
// Everything is drawn in screen space from one camera (scale s, offset tx),
// so lines stay hairlines and type stays its size at any zoom.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, motionValue, useMotionValueEvent, useTransform } from 'framer-motion';
import { ROLES } from '../../../data/about.js';
import styles from './Timeline.module.css';

const START = 2015;
const NOW_YEAR = 2026.75;
// The order the ball visits: oldest first.
const SEQ = [...ROLES].sort((a, b) => a.from - b.from);
// A role's mark on the ruler. ABAI ran twice but reads as one milestone, so
// only its first stint is drawn; its years still name both.
const spanOf = (r) => (r.spans ? r.spans[0] : [r.from, r.to ?? NOW_YEAR]);
// The line under the company: the role, or for an internship with no title
// of its own, the organisation's full name.
const titleOf = (r) => (r.role === 'Internship' ? r.full ?? r.company : r.role);
const keyOf = (r) => `${r.company}-${r.from}`;

// Company logos: drop a transparent SVG or PNG named after the company
// (lower case, dashes: tandem-digital.svg) into src/assets/logos and it
// replaces the written name, inked to match. Until then the name shows.
const LOGO_FILES = import.meta.glob('../../../assets/logos/*.{svg,png,webp}', { eager: true, query: '?url', import: 'default' });
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const logoFor = (r) => {
  const hit = Object.entries(LOGO_FILES).find(([path]) => path.split('/').pop().replace(/\.[a-z]+$/, '') === slug(r.company));
  return hit ? hit[1] : null;
};

const YEARS = Array.from({ length: Math.floor(NOW_YEAR) - START + 1 }, (_, i) => START + i);
const yearOf = (v) => Math.floor(v + 0.05);
const years = (r) => {
  if (r.spans) return r.spans.map(([a]) => yearOf(a)).join(', ');
  const a = yearOf(r.from);
  if (r.to === null) return `${a} to now`;
  const b = yearOf(r.to - 0.1);
  return a === b ? `${a}` : `${a} to ${b}`;
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, a, b) => clamp01((v - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const ROLL = 0.22;
// Arrivals decelerate hard (an expo out), journeys accelerate and settle.
const expoOut = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** The year the ball rests on for a role: just past its start, and never
 *  while the year is rolling over, so the wheel reads the year it began. */
const restYear = (r) => {
  const yr = r.from + 0.03;
  const f = yr - Math.floor(yr);
  return f < ROLL + 0.02 ? Math.floor(yr) + ROLL + 0.02 : yr;
};

// The beats, as timeline progress:
//   0 .. IN     the whole timeline, then the camera closes in on the ball
//   IN .. LAST  one even step per role, the camera on the ball
//   LAST .. OUT on to Now while the camera pulls back to the whole journey
// Past OUT it holds on the whole journey (the journey never drives it there).
// Inside a beat everything is linear: the glides that drive it do the easing.
const IN = 0.12;
const STEP = 0.09;
const STOPS = SEQ.map((_, i) => IN + i * STEP);
const LAST = STOPS[STOPS.length - 1];
const OUT = LAST + 0.12;
const PATH = SEQ.map(restYear);
const yearAt = (p) => {
  if (p <= IN) return PATH[0];
  if (p >= OUT) return NOW_YEAR;
  if (p >= LAST) return PATH[PATH.length - 1] + (NOW_YEAR - PATH[PATH.length - 1]) * within(p, LAST, OUT);
  const i = Math.min(Math.floor((p - IN) / STEP), PATH.length - 2);
  return PATH[i] + (PATH[i + 1] - PATH[i]) * within(p, STOPS[i], STOPS[i + 1]);
};
// How far the camera is in: 0 shows the whole line, 1 is on the ball (from
// the start: the ruler draws out of the ball as it arrives).
const zoomAt = (p) => {
  if (p <= LAST) return 1;
  return 1 - within(p, LAST, OUT);
};
// A role is written out while the ball is on it, and left behind as soon as
// the ball sets off again.
const NEAR = 0.016;
const stateOf = (i, p) => {
  if (p > STOPS[i] + NEAR) return 'past';
  if (p >= STOPS[i] - NEAR) return 'on';
  return 'ahead';
};
const statesAt = (p) => SEQ.map((_, i) => stateOf(i, p));
// Each role's two moves, as progress windows: it rises in over the last
// stretch of the ball's approach, and leaves over the whole of its next leg
// (the last one leaves as the camera pulls back to the whole journey).
const ARRIVE = SEQ.map((_, i) => [STOPS[i] - (i === 0 ? 0.05 : STEP * 0.4), STOPS[i]]);
const LEAVE = SEQ.map((_, i) => [STOPS[i], i < SEQ.length - 1 ? STOPS[i + 1] : OUT]);

// Momentum: the ball never quite stops. While the camera holds on a role,
// the ball keeps rolling on, slowly, toward the next one (easing off as it
// goes), and the camera drifts with it a little, so the line keeps sliding.
// The next leg sets off from wherever it got to and lands exactly on the next
// role. The drift is years added to the ball's place; it fades out over the
// leg to the next stop, where it starts again from nothing.
// Off: a ball that creeps on between stops makes every leg a different pace.
// Each leg now starts from the stop itself and takes the same time.
const DRIFT_SHARE = 0; // how far toward the next role it can roll, at most
const DRIFT_TAU = 2.4; // seconds: how quickly it eases off
const DRIFT_FOLLOW = 0.5; // how much of it the camera follows
const drift = { k: -1, c: 0 };
const nextYear = (k) => (k < PATH.length - 1 ? PATH[k + 1] : NOW_YEAR);
const legOf = (k) => (k < STOPS.length - 1 ? STOPS[k + 1] : OUT) - STOPS[k];
const driftAt = (p) => {
  if (drift.k < 0 || drift.c === 0) return 0;
  const d = p - STOPS[drift.k];
  return drift.c * clamp01(1 - Math.abs(d) / (d >= 0 ? legOf(drift.k) : STEP));
};
/** Moves on with the drift (the camera and the grid behind it follow). */
export const timelineDrift = motionValue(0);
function stepDrift(p, dt) {
  // Arrived at a role: the drift starts again from there.
  const k = STOPS.findIndex((x) => Math.abs(p - x) < 0.0015);
  if (k >= 0 && k !== drift.k) {
    drift.k = k;
    drift.c = 0;
  }
  if (drift.k < 0) return;
  const max = (nextYear(drift.k) - PATH[drift.k]) * DRIFT_SHARE;
  drift.c += (max - drift.c) * (1 - Math.exp(-dt / DRIFT_TAU));
  const v = driftAt(p);
  if (Math.abs(v - timelineDrift.get()) > 1e-5) timelineDrift.set(v);
}

/** Where the ball rests, one stop per role, as timeline progress. */
export const timelineStops = () => [...STOPS];
/** The whole journey, seen from afar with the ball on Now. */
export const TIMELINE_NOW = OUT;

function Wheel({ year, place }) {
  // The wheel turns over just after New Year (v - ROLL), not before it.
  const y = useTransform(year, (yr) => {
    const v = yr - ROLL;
    const whole = Math.floor(v);
    const f = v - whole;
    const roll = f > 1 - ROLL ? smooth((f - (1 - ROLL)) / ROLL) : 0;
    const digit = Math.floor(whole / place) % 10;
    const carrying = place === 1 || whole % place === place - 1;
    return `${(-(digit + (carrying ? roll : 0)) * 100) / 11}%`;
  });
  return (
    <span className={styles.wheel}>
      <motion.span className={styles.wheelStrip} style={{ y }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </motion.span>
    </span>
  );
}

/** The chart's geometry for the current viewport: the whole line, as seen
 *  from afar (camera scale 1). The grid behind the journey uses the same
 *  numbers: one cell per year, lines through the year ticks and the ruler. */
export function timelineLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const narrow = vw < 700;
  const gutter = Math.min(56, Math.max(20, vw * 0.036));
  const left = narrow ? 24 : Math.max(72, vw * 0.08);
  const right = vw - left;
  const yearW = (right - left) / (NOW_YEAR - START);
  const x = (yr) => left + (yr - START) * yearW;
  const rulerY = Math.round(vh * (narrow ? 0.46 : 0.5));
  // How close the camera comes: a year is about a fifth of the screen
  // (a third on phones).
  const zoom = Math.max(2, (vw * (narrow ? 0.32 : 0.2)) / yearW);
  // Seen from afar, Now stays in the middle with the ball, and the whole
  // journey lies to its left: the scale that fits it into that half.
  const out = Math.min(1, (vw / 2 - Math.max(48, vw * 0.04)) / (right - left));
  return { vw, vh, narrow, gutter, yearW, left, right, x, rulerY, zoom, out };
}

/** The camera at timeline progress `p`: scale `s` about the ruler, and the
 *  horizontal offset `tx` that puts the ball where it belongs on screen
 *  (in place from afar, dead centre up close). */
export function timelineCamera(g, p, r = 0) {
  const z = zoomAt(p);
  const s = g.out + (g.zoom - g.out) * z;
  const d = driftAt(p);
  // The camera always holds the ball in the middle of the screen; pulling
  // back, the years it has come through spread out to its left.
  const cx = g.x(yearAt(p) + d * DRIFT_FOLLOW);
  const tx = g.vw / 2 - cx * s;
  if (r <= 0) return { s, tx };
  // Rewinding: the line winds into the ball as the ball comes to the middle.
  const bx = g.x(yearAt(p) + d);
  const at = bx * s + tx;
  const to = at + (g.vw / 2 - at) * r;
  const s2 = Math.max(1e-4, s * (1 - r));
  return { s: s2, tx: to - bx * s2 };
}

/** Where the ball sits on screen at timeline progress `p` (camera at rest):
 *  the basketball from the hero hands over to it here. */
export function timelineBallAt(g, p = 0, r = 0) {
  const { s, tx } = timelineCamera(g, p, r);
  return { x: g.x(yearAt(p) + driftAt(p)) * s + tx, y: g.rulerY };
}

/** How far the knob has turned at timeline progress `p` (degrees): it rolls,
 *  so its turn is the ground it has covered over its radius. */
export function timelineSpinAt(g, p = 0) {
  const s = g.out + (g.zoom - g.out) * zoomAt(p);
  return ((g.x(yearAt(p)) * s) / TIP_R) * (180 / Math.PI);
}

/** The grid behind, moved by the same camera: cell size and offsets. */
export function timelineGrid(g, p) {
  const { s, tx } = timelineCamera(g, p);
  const cell = g.yearW * s;
  const mod = (v) => ((v % cell) + cell) % cell;
  return { size: `${cell.toFixed(2)}px ${cell.toFixed(2)}px`, position: `${mod(g.left * s + tx).toFixed(2)}px ${mod(g.rulerY).toFixed(2)}px` };
}

/** Lanes for the notes under the line, seen from afar (the closest they ever
 *  get): each note takes the first lane where it clears the one before. A
 *  note hangs back over its own period, ending where the role ended; one that
 *  would run off the left edge hangs forward instead. `sizes` are the notes'
 *  measured widths. */
function laneOut(g, sizes) {
  const lanes = [];
  // Packed as the notes will lie at the journey's widest view (the overview
  // scale), so none overlap there.
  const at = (yr) => g.left + (g.x(yr) - g.left) * g.out;
  return SEQ.map((r, i) => {
    const x = at(spanOf(r)[1]);
    // Air around each note, so the whole journey reads at a glance.
    const w = (sizes[i] ?? 160) + (g.narrow ? 24 : 48);
    const flip = x - w >= 12;
    const [a, b] = flip ? [x - w, x] : [x, x + w];
    let lane = lanes.findIndex((taken) => taken.every(([c, d]) => b < c || a > d));
    if (lane === -1) lane = lanes.push([]) - 1;
    lanes[lane].push([a, b]);
    return { lane, flip };
  });
}

// The ball on the line (the slider's knob): its radius in px. The logo
// opens from a circle this size.
export const TIP_R = 18;

// The note's type sizes (px): what each line of the big label shrinks to.
const NOTE_PX = { company: 14.5, logo: 30, title: 11.5, when: 11.5 };
const NOTE_PX_NARROW = { company: 12.5, logo: 24, title: 10.5, when: 10.5 };
const NOTE_GAP = 2;
// How faint each line ends up, as a share of its full ink.
const NOTE_INK = [0.6, 0.5, 0.8];

/**
 * `progress` 0..1 runs the camera and the ball; `fade` 0..1 clears the words;
 * `retract` 0..1 then rewinds the line into the ball, at the middle of the
 * ruler (at 1 the ball is gone: the logo has taken its place).
 */
export default function TimelineC({ progress, fade, retract, handoff }) {
  const [g, setG] = useState(timelineLayout);
  useLayoutEffect(() => {
    const on = () => setG(timelineLayout());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  // The camera, written straight to CSS variables every frame: everything
  // places itself from its own spot on the line (--a) with calc().
  const rootRef = useRef(null);
  const parts = useRef([]); // per role: its elements and their measured sizes
  const layout = useRef(null); // ruler, lane spacing and the notes' lanes
  const aim = (p) => {
    const el = rootRef.current;
    if (!el) return;
    const r = retract.get();
    const { s, tx } = timelineCamera(g, p, r);
    el.style.setProperty('--s', s.toFixed(5));
    el.style.setProperty('--tx', `${tx.toFixed(2)}px`);
    // Winding in: the marks along the line (ticks, dots) are taken in before
    // they bunch up at the ball, and its halo goes as it becomes the logo.
    el.style.setProperty('--marks', (1 - within(r, 0.35, 0.75)).toFixed(3));
    el.style.setProperty('--halo', (1 - within(r, 0.6, 1)).toFixed(3));
    // The timeline is not laid out while it is off stage: measure once it is.
    if (!layout.current && !measure()) return;
    SEQ.forEach((r, i) => stage(parts.current[i], p, s, r, i));
  };
  // One role at progress p, camera scale s.
  const stage = (q, p, s, r, i) => {
    const L = layout.current;
    if (!q?.big || !q.m || !L) return;
    const u = within(p, ...ARRIVE[i]);
    const t = within(p, ...LEAVE[i]);
    const { m } = q;
    const [from, to] = spanOf(r);
    const { lane, flip } = L.lanes[i];
    const laneY = L.base + lane * L.step;
    const x0 = (g.x(to) - g.x(from)) * s; // where the role ended, from its dot

    // Rising in, a line at a time out of its own mask: name (or logo) first.
    q.inners.forEach((el, j) => {
      const inK = expoOut(within(u, j * 0.16, j * 0.16 + 0.62));
      el.style.transform = `translate3d(0, ${((1 - inK) * 108).toFixed(2)}%, 0)`;
      el.style.opacity = (inK ** 0.6).toFixed(3);
    });
    q.big.style.visibility = u > 0 ? 'visible' : 'hidden';

    // Leaving: the label travels with the ball (it keeps its place over it),
    // then, as the ball nears the next role, sinks under the line, each line
    // easing down to its size in the note and stacking in order where the
    // role ended. The name leads.
    const ballFrom = (g.x(PATH[i]) - g.x(from)) * s;
    const ballNow = (g.x(yearAt(p)) - g.x(from)) * s;
    const follow = t > 0 ? ballNow - ballFrom : 0;
    let y = L.rulerY + laneY;
    m.lines.forEach((ln, j) => {
      const k = inOutCubic(within(t, 0.42 + j * 0.05, 0.9 + j * 0.03));
      if (!ln.kept) {
        // Phones keep the note to name and years: the title steps back.
        q.wraps[j].style.transform = "";
        q.wraps[j].style.opacity = (1 - within(t, 0, 0.25)).toFixed(3);
        return;
      }
      const w = ln.w * ln.to;
      const h = ln.h * ln.to;
      const cx = flip ? x0 - 9 - w / 2 : x0 + 9 + w / 2;
      const cy = y + h / 2;
      y += h + NOTE_GAP;
      const dx = cx - ln.cx;
      const dy = cy - ln.cy;
      const el = q.wraps[j];
      const tx = follow + (dx - follow) * k;
      el.style.transform = `translate3d(${tx.toFixed(2)}px, ${(dy * k).toFixed(2)}px, 0) scale(${(1 + (ln.to - 1) * k).toFixed(4)})`;
      el.style.opacity = (1 + (NOTE_INK[j] - 1) * k).toFixed(3);
    });
    // What the note leaves out steps back first.
    q.extras.forEach((el) => {
      el.style.opacity = (1 - within(t, 0, 0.25)).toFixed(3);
    });
    // A hairline drops from the line to catch it as it lands.
    const lead = q.leader;
    lead.style.height = `${(laneY + m.noteH - 2).toFixed(1)}px`;
    lead.style.transform = `translate3d(${x0.toFixed(2)}px, 0, 0) scaleY(${inOutCubic(within(t, 0.55, 0.95)).toFixed(4)})`;
  };
  // The sizes the moves are built from (transforms do not change them), and
  // the notes' lanes, packed from their real sizes.
  const measure = () => {
    if (!parts.current[0]?.big?.offsetParent) {
      layout.current = null;
      return false;
    }
    const px = g.narrow ? NOTE_PX_NARROW : NOTE_PX;
    const sizes = [];
    parts.current.forEach((q, i) => {
      if (!q?.big) return;
      const bx = q.big.offsetLeft;
      const by = q.big.offsetTop;
      const lines = q.wraps.map((el, j) => {
        // Each line's key: the logo or name, the title, the years alone (its
        // own text, measured inside the line, which is their offset parent).
        const key = el.querySelector('[data-key]');
        const kx = key.offsetLeft;
        const ky = key.offsetTop;
        const w = key.offsetWidth;
        const h = key.offsetHeight;
        const isLogo = key.tagName === 'IMG';
        const font = parseFloat(getComputedStyle(key).fontSize);
        const target = j === 0 ? (isLogo ? px.logo : px.company) : j === 1 ? px.title : px.when;
        const to = isLogo && j === 0 ? target / h : target / font;
        el.style.transformOrigin = `${(kx + w / 2).toFixed(1)}px ${(ky + h / 2).toFixed(1)}px`;
        // On phones the note is the name and the years only.
        const kept = !(g.narrow && j === 1);
        return { cx: bx + el.offsetLeft + kx + w / 2, cy: by + el.offsetTop + ky + h / 2, w, h, to, kept };
      });
      const shown = lines.filter((l) => l.kept);
      const noteH = shown.reduce((n, l) => n + l.h * l.to, 0) + NOTE_GAP * (shown.length - 1);
      sizes[i] = Math.max(...shown.map((l) => l.w * l.to)) + 9;
      q.m = { lines, noteH };
    });
    const tallest = Math.max(0, ...parts.current.map((q) => q?.m?.noteH ?? 0));
    const lanes = laneOut(g, sizes);
    const base = g.narrow ? 44 : 52;
    // The lanes keep clear of the screen's foot (the corner buttons live
    // there): on a short screen they close up, never tighter than a note.
    const deepest = Math.max(1, ...lanes.map((l) => l.lane));
    const room = g.vh - g.rulerY - base - tallest - (g.narrow ? 96 : 130);
    const step = Math.max(Math.ceil(tallest + 4), Math.min(Math.ceil(tallest + (g.narrow ? 14 : 20)), Math.floor(room / deepest)));
    layout.current = { rulerY: g.rulerY, base, step, lanes };
    aim(progress.get());
    return true;
  };
  useLayoutEffect(() => {
    measure();
    let live = true;
    document.fonts?.ready.then(() => live && measure());
    return () => {
      live = false;
    };
  }, [g]); // eslint-disable-line react-hooks/exhaustive-deps
  useMotionValueEvent(progress, 'change', aim);
  useMotionValueEvent(retract, 'change', () => aim(progress.get()));
  // Arriving (the ball hopping on), the timeline is on stage before its own
  // progress moves: place the camera as soon as it can be measured.
  useMotionValueEvent(handoff, 'change', () => aim(progress.get()));
  useMotionValueEvent(timelineDrift, 'change', () => aim(progress.get()));

  // The drift runs on its own clock, only while the camera is on the roles.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const p = progress.get();
      if (document.hidden || p < STOPS[0] - STEP || p > OUT) return;
      stepDrift(p, dt);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  const year = useTransform([progress, timelineDrift], ([p]) => yearAt(p) + driftAt(p));
  // The words step back before the line winds in; the ball hands over to the
  // logo (the same dot, same place) once it is all wound in.
  const ink = useTransform(fade, (f) => 1 - f);
  // The line slides in under the ball (the panel's own move); the year and
  // the title come up as it settles.
  const headInk = useTransform([fade, handoff], ([f, h]) => (1 - f) * smooth(within(h, 0.4, 1)));
  // The knob is the basketball: it turns as it rolls (distance over radius).

  const [states, setStates] = useState(() => statesAt(progress.get()));
  const [current, setCurrent] = useState(START);
  useMotionValueEvent(progress, 'change', (p) => {
    const next = statesAt(p);
    setStates((cur) => (next.every((s, i) => s === cur[i]) ? cur : next));
    const y = yearOf(yearAt(p));
    setCurrent((c) => (c === y ? c : y));
  });

  const at = (yr) => g.x(yr).toFixed(2);

  return (
    <div ref={rootRef} className={styles.tl} style={{ '--ruler-y': `${g.rulerY}px` }}>
      {/* The year rolls big in the top left; the title answers it top right. */}
      <motion.div className={styles.head} style={{ opacity: headInk }}>
        <div className={styles.odometer} aria-hidden>
          <Wheel year={year} place={1000} />
          <Wheel year={year} place={100} />
          <Wheel year={year} place={10} />
          <Wheel year={year} place={1} />
        </div>
        <h2 className={styles.title}>My career, 2015 to now.</h2>
      </motion.div>

      <div className={styles.chart}>
        <span className={styles.ruler} style={{ '--a': at(START), '--w': g.right - g.left }} aria-hidden />

        {/* Each role's span, drawn in its colour once the ball reaches it
            (work first, so the internships sit on top where they overlap). */}
        {[...SEQ.map((r, i) => [r, i])]
          .sort(([a], [b]) => Number(a.internship ?? false) - Number(b.internship ?? false))
          .map(([r, i]) => {
            const [from, to] = spanOf(r);
            return (
              <span key={keyOf(r)} className={styles.span} style={{ '--a': at(from), '--w': (g.x(to) - g.x(from)).toFixed(2) }} aria-hidden>
                <i className={`${r.internship ? styles.intern : ''} ${states[i] !== 'ahead' ? styles.spanOn : ''}`} />
              </span>
            );
          })}

        {YEARS.map((y) => (
          <span key={y} className={`${styles.tick} ${y <= current ? styles.tickPast : ''} ${y === current ? styles.tickOn : ''}`} style={{ '--a': at(y) }}>
            {(!g.narrow || y % 2 === 1) && <motion.b style={{ opacity: ink }}>{y}</motion.b>}
          </span>
        ))}
        <span className={`${styles.tick} ${styles.tickNow}`} style={{ '--a': at(NOW_YEAR) }}>
          <motion.b style={{ opacity: ink }}>Now</motion.b>
        </span>

        {/* Where each role began: a small dot that fills once reached. */}
        {SEQ.map((r, i) => (
          <span key={keyOf(r)} className={`${styles.start} ${r.internship ? styles.intern : ''} ${states[i] !== 'ahead' ? styles.startOn : ''}`} style={{ '--a': at(r.from) }} aria-hidden />
        ))}

      </div>
      {/* The knob is the journey's own basketball (JourneyC's Cast). */}

      {/* Each role, at its own dot: written out large above the ball while
          the ball is on it, then left behind under the line where it ended,
          as a faint note. */}
      <motion.ol className={styles.roles} style={{ opacity: ink }} aria-label="Career">
        {SEQ.map((r, i) => {
          const [from] = spanOf(r);
          return (
            <Role
              key={keyOf(r)}
              role={r}
              index={i}
              state={states[i]}
              at={at(from)}
              partsRef={(q) => {
                // Keep what was measured: the elements do not change.
                parts.current[i] = Object.assign(parts.current[i] ?? {}, q);
              }}
              onLogo={measure}
            />
          );
        })}
      </motion.ol>
    </div>
  );
}

function Role({ role: r, index, state, at, partsRef, onLogo }) {
  const logo = logoFor(r);
  const title = titleOf(r);
  const big = useRef(null);
  const leader = useRef(null);
  const wraps = useRef([]);
  const inners = useRef([]);
  const extras = useRef([]);
  useLayoutEffect(() => {
    partsRef({ big: big.current, leader: leader.current, wraps: wraps.current.filter(Boolean), inners: inners.current.filter(Boolean), extras: extras.current.filter(Boolean) });
  });
  // One label, placed every frame by TimelineC from the scroll: big above the
  // ball while it is on the role, then the same lines, small, as its note
  // under the line where the role ended.
  const line = (j, cls, children) => (
    <span
      ref={(el) => {
        wraps.current[j] = el;
      }}
      className={styles.line}
    >
      <span
        ref={(el) => {
          inners.current[j] = el;
        }}
        className={cls}
      >
        {children}
      </span>
    </span>
  );
  const extra = (k) => (el) => {
    extras.current[k] = el;
  };
  return (
    <li className={styles.role} style={{ '--a': at }} aria-current={state === 'on' ? 'step' : undefined} aria-hidden={state === 'ahead' || undefined}>
      <div ref={big} className={`${styles.big} ${r.internship ? styles.intern : ''}`}>
        <h3 className={styles.bigHead}>
          {line(0, `${styles.company} ${logo ? styles.hasLogo : ''}`, logo ? <img className={styles.logo} src={logo} alt={r.company} onLoad={onLogo} data-key="" /> : <span data-key="">{r.company}</span>)}
        </h3>
        {line(1, styles.jobTitle, <span data-key="">{logo ? `${title}, ${r.company}` : title}</span>)}
        {line(
          2,
          styles.when,
          <>
            <span data-key="">{years(r)}</span>
            {r.internship && (
              <span ref={extra(0)} className={styles.tag}>
                Internship
              </span>
            )}
            <span ref={extra(1)} className={styles.count}>
              {String(index + 1).padStart(2, '0')} of {String(SEQ.length).padStart(2, '0')}
            </span>
          </>,
        )}
        {/* The brands done there: shown while it is on, not in the note. */}
        {r.clients?.length > 0 && (
          <span ref={extra(2)} className={styles.line}>
            <span
              ref={(el) => {
                inners.current[3] = el;
              }}
              className={styles.clients}
            >
              For {r.clients.join(', ')}
            </span>
          </span>
        )}
      </div>
      <span ref={leader} className={`${styles.leader} ${r.internship ? styles.intern : ''}`} aria-hidden />
    </li>
  );
}
