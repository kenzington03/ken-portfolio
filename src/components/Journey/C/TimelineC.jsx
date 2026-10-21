// Ten years as one camera move. The section opens on the whole timeline: a
// hairline ruler with a tick per year and a dot where each role began. Then
// the camera closes in on the ball, dead centre, and follows it (the journey
// steps it: one scroll, one role); the world pans past underneath. The role
// the ball is on is written out large above it. When the ball leaves, that
// role is left behind where it happened: it drops under its own dot as a
// faint note, part of the background. After the last role the camera pulls
// back to the whole journey, every role noted along the line, then closes in
// on Now, where the ball becomes the Apple logo. The internships came first
// and are drawn in blue, the work in ink. The year rolls big in the top left.
//
// Everything is drawn in screen space from one camera (scale s, offset tx),
// so lines stay hairlines and type stays its size at any zoom.

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'framer-motion';
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
const EASE = [0.16, 1, 0.3, 1];

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
//   OUT .. 1    the camera closes in on Now (the logo takes it from there)
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
// How far the camera is in: 0 shows the whole line, 1 is on the ball.
const zoomAt = (p) => {
  if (p <= IN) return within(p, 0, IN);
  if (p <= LAST) return 1;
  if (p <= OUT) return 1 - within(p, LAST, OUT);
  return within(p, OUT, 1);
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
  return { vw, vh, narrow, gutter, yearW, left, right, x, rulerY, zoom };
}

/** The camera at timeline progress `p`: scale `s` about the ruler, and the
 *  horizontal offset `tx` that puts the ball where it belongs on screen
 *  (in place from afar, dead centre up close). */
export function timelineCamera(g, p) {
  const z = zoomAt(p);
  const s = 1 + (g.zoom - 1) * z;
  const bx = g.x(yearAt(p));
  return { s, tx: bx + (g.vw / 2 - bx) * z - bx * s };
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
 *  note that would run off the right edge hangs to the left of its dot. */
function laneOut(g) {
  const lanes = [];
  return SEQ.map((r) => {
    const x = g.x(r.from);
    const w = Math.min(g.narrow ? 129 : 179, Math.max(r.company.length * (g.narrow ? 7 : 7.4), years(r).length * 6.6) + 9) + 14;
    const flip = x + w > g.vw - 12;
    const [a, b] = flip ? [x - w, x] : [x, x + w];
    let lane = lanes.findIndex((taken) => taken.every(([c, d]) => b < c || a > d));
    if (lane === -1) lane = lanes.push([]) - 1;
    lanes[lane].push([a, b]);
    return { lane, flip };
  });
}

/**
 * `progress` 0..1 runs the camera and the ball; `fade` 0..1 clears the chart
 * as the journey cuts to the dark.
 */
export default function TimelineC({ progress, fade }) {
  const [g, setG] = useState(timelineLayout);
  useLayoutEffect(() => {
    const on = () => setG(timelineLayout());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const lanes = useMemo(() => laneOut(g), [g]);

  // The camera, written straight to CSS variables every frame: everything
  // places itself from its own spot on the line (--a) with calc().
  const rootRef = useRef(null);
  const aim = (p) => {
    const el = rootRef.current;
    if (!el) return;
    const { s, tx } = timelineCamera(g, p);
    el.style.setProperty('--s', s.toFixed(5));
    el.style.setProperty('--tx', `${tx.toFixed(2)}px`);
  };
  useLayoutEffect(() => aim(progress.get()));
  useMotionValueEvent(progress, 'change', aim);

  const year = useTransform(progress, yearAt);
  const ballX = useTransform(progress, (p) => {
    const { s, tx } = timelineCamera(g, p);
    return g.x(yearAt(p)) * s + tx;
  });
  // The year, the title and the notes make way as the camera closes in on Now.
  const head = useTransform([progress, fade], ([p, f]) => (1 - within(p, OUT, OUT + (1 - OUT) * 0.6)) * (1 - f));
  const notes = useTransform([progress, fade], ([p, f]) => (1 - within(p, OUT, OUT + (1 - OUT) * 0.5)) * (1 - f));
  const chart = useTransform(fade, (f) => 1 - f);

  const [states, setStates] = useState(() => statesAt(progress.get()));
  const [current, setCurrent] = useState(START);
  useMotionValueEvent(progress, 'change', (p) => {
    const next = statesAt(p);
    setStates((cur) => (next.every((s, i) => s === cur[i]) ? cur : next));
    const y = yearOf(yearAt(p));
    setCurrent((c) => (c === y ? c : y));
  });
  // The ball takes the colour of the role it is on, or last left.
  const onIndex = states.indexOf('on');
  const ballRole = SEQ[onIndex !== -1 ? onIndex : Math.max(0, states.lastIndexOf('past'))];

  const at = (yr) => g.x(yr).toFixed(2);

  return (
    <div ref={rootRef} className={styles.tl} style={{ '--ruler-y': `${g.rulerY}px` }}>
      {/* The year rolls big in the top left; the title answers it top right. */}
      <motion.div className={styles.head} style={{ opacity: head }}>
        <div className={styles.odometer} aria-hidden>
          <Wheel year={year} place={1000} />
          <Wheel year={year} place={100} />
          <Wheel year={year} place={10} />
          <Wheel year={year} place={1} />
        </div>
        <h2 className={styles.title}>My career, 2015 to now.</h2>
      </motion.div>

      <motion.div className={styles.chart} style={{ opacity: chart }}>
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
            {(!g.narrow || y % 2 === 1) && <b>{y}</b>}
          </span>
        ))}
        <span className={`${styles.tick} ${styles.tickNow}`} style={{ '--a': at(NOW_YEAR) }}>
          <b>Now</b>
        </span>

        {/* Where each role began: a small dot that fills once reached. */}
        {SEQ.map((r, i) => (
          <span key={keyOf(r)} className={`${styles.start} ${r.internship ? styles.intern : ''} ${states[i] !== 'ahead' ? styles.startOn : ''}`} style={{ '--a': at(r.from) }} aria-hidden />
        ))}

        <motion.span className={`${styles.tip} ${ballRole.internship ? styles.intern : ''}`} style={{ x: ballX }} aria-hidden />
      </motion.div>

      {/* Each role, at its own dot: written out large above the ball while
          the ball is on it, then left behind under the line as a faint note. */}
      <motion.ol className={styles.roles} style={{ opacity: notes }} aria-label="Career">
        {SEQ.map((r, i) => (
          <Role key={keyOf(r)} role={r} index={i} state={states[i]} lane={lanes[i].lane} flip={lanes[i].flip} at={at(r.from)} narrow={g.narrow} />
        ))}
      </motion.ol>
    </div>
  );
}

function Role({ role: r, index, state, lane, flip, at, narrow }) {
  const logo = logoFor(r);
  const title = titleOf(r);
  const laneY = (narrow ? 44 : 50) + lane * (narrow ? 40 : 56);
  // The big version rests above the ball, the note under the line in its
  // lane; on leaving, the one shrinks down into the other's place.
  const big = {
    on: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE, delay: 0.05 } },
    past: { opacity: 0, y: laneY + 60, scale: 0.3, filter: 'blur(4px)', transition: { duration: 0.6, ease: EASE } },
    ahead: { opacity: 0, y: 24, scale: 0.96, filter: 'blur(6px)', transition: { duration: 0.35, ease: 'easeOut' } },
  };
  const note = {
    past: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, ease: EASE, delay: 0.06 } },
    on: { opacity: 0, y: -(laneY + 80), scale: 2.6, transition: { duration: 0.3, ease: 'easeOut' } },
    ahead: { opacity: 0, y: 0, scale: 1, transition: { duration: 0.2 } },
  };
  return (
    <li className={styles.role} style={{ '--a': at }} aria-current={state === 'on' ? 'step' : undefined} aria-hidden={state === 'ahead' || undefined}>
      <motion.div className={styles.big} variants={big} initial={false} animate={state}>
        <h3 className={`${styles.company} ${logo ? styles.hasLogo : ''}`}>{logo ? <img className={styles.logo} src={logo} alt={r.company} /> : r.company}</h3>
        <p className={styles.jobTitle}>{logo ? `${title}, ${r.company}` : title}</p>
        <p className={styles.when}>
          {years(r)}
          {r.internship && <span className={styles.tag}>Internship</span>}
          <span className={styles.count}>
            {String(index + 1).padStart(2, '0')} of {String(SEQ.length).padStart(2, '0')}
          </span>
        </p>
      </motion.div>
      <motion.div className={`${styles.note} ${r.internship ? styles.intern : ''} ${flip ? styles.flip : ''}`} style={{ '--lane': `${laneY}px` }} variants={note} initial={false} animate={state}>
        <span className={styles.noteCo}>{r.company}</span>
        <span className={styles.noteYear}>{years(r)}</span>
      </motion.div>
    </li>
  );
}
