// Ten years in one frame, quietly. A hairline ruler spans the screen with a
// small tick per year. The ball visits each role in order (the journey steps
// it: one scroll, one role); the internships came first and are drawn in
// blue, the work in ink. Arriving at a role draws its span along the ruler,
// and adds it to the row of roles along the bottom, where everything passed
// stays. The role the ball is on is written out large: the company above
// the ball, Ken's title and the years below it. The year rolls big in the
// top left. At the end the camera zooms in on Now, dead centre, where the
// ball becomes the Apple logo.

import { useLayoutEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionTemplate, useMotionValueEvent, useTransform } from 'framer-motion';
import { ROLES } from '../../../data/about.js';
import styles from './Timeline.module.css';

const START = 2015;
const NOW_YEAR = 2026.75;
// The order the ball visits: oldest first.
const SEQ = [...ROLES].sort((a, b) => a.from - b.from);
// A role's stretches on the ruler (ABAI ran twice).
const spansOf = (r) => r.spans ?? [[r.from, r.to ?? NOW_YEAR]];
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

// Behind the chart, the plain grid. ?tlbg=glow inks the grid darker around
// the ball instead, for comparing.
const pickBg = () => {
  try {
    return new URLSearchParams(window.location.search).get('tlbg') === 'glow' ? 'glow' : 'grid';
  } catch {
    return 'grid';
  }
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

// The fill runs over most of the scroll, the zoom over the rest.
const FILL_END = 0.8;
const ZOOM = 2.4;
const EASE = [0.16, 1, 0.3, 1];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, a, b) => clamp01((v - a) / (b - a));
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smooth = (t) => t * t * (3 - 2 * t);
const ROLL = 0.22;

/** The year the ball rests on for a role: just past its start, and never
 *  while the year is rolling over, so the wheel reads the year it began. */
const restYear = (r) => {
  const yr = r.from + 0.03;
  const f = yr - Math.floor(yr);
  return f < ROLL + 0.02 ? Math.floor(yr) + ROLL + 0.02 : yr;
};
// One even step of scroll per role; after the last, on to Now.
const STOPS = SEQ.map((_, i) => (i / SEQ.length) * FILL_END);
const PATH = [...SEQ.map(restYear), NOW_YEAR];
const KNOTS = [...STOPS, FILL_END];
const yearAt = (p) => {
  if (p <= 0) return PATH[0];
  for (let i = 0; i < KNOTS.length - 1; i += 1) {
    if (p <= KNOTS[i + 1]) return PATH[i] + (PATH[i + 1] - PATH[i]) * within(p, KNOTS[i], KNOTS[i + 1]);
  }
  return NOW_YEAR;
};
const roleAt = (p) => {
  let n = 0;
  STOPS.forEach((s, i) => {
    if (p >= s - 0.002) n = i;
  });
  return n;
};

/** Where the ball rests, one stop per role, as timeline progress. */
export const timelineStops = () => [...STOPS];

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

/** The chart's geometry for the current viewport. The grid behind the
 *  journey uses the same numbers: one cell per year, lines through the year
 *  ticks and the ruler. */
export function timelineLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const narrow = vw < 700;
  const gutter = Math.min(56, Math.max(20, vw * 0.036));
  const left = narrow ? 24 : Math.max(72, vw * 0.08);
  const right = vw - left;
  const yearW = (right - left) / (NOW_YEAR - START);
  const x = (yr) => left + (yr - START) * yearW;
  const rulerY = Math.round(vh * 0.56);
  const labelW = narrow ? Math.min(300, vw - 48) : Math.min(520, vw * 0.36);
  return { vw, vh, narrow, gutter, yearW, left, right, x, rulerY, labelW };
}

/** Where the camera scales from: Now, on the ruler. */
export const timelineOrigin = (g) => `${g.x(NOW_YEAR)}px ${g.rulerY}px`;

/** The camera at timeline progress `p`: still while the line fills, then a
 *  zoom into Now that slides it to the centre of the screen. */
export function timelineCamera(g, p) {
  const z = inOut(within(p, FILL_END, 1));
  const tx = (g.vw / 2 - g.x(NOW_YEAR)) * z;
  return `translate3d(${tx.toFixed(2)}px, 0, 0) scale(${(1 + (ZOOM - 1) * z).toFixed(4)})`;
}

/**
 * `progress` 0..1 runs the fill, then the zoom into Now; `fade` 0..1 clears
 * the chart as the journey cuts to the dark.
 */
export default function TimelineC({ progress, fade }) {
  const [g, setG] = useState(timelineLayout);
  useLayoutEffect(() => {
    const on = () => setG(timelineLayout());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const year = useTransform(progress, yearAt);
  const zoom = useTransform(progress, (p) => inOut(within(p, FILL_END, 1)));
  const camera = useTransform(progress, (p) => timelineCamera(g, p));
  const tipX = useTransform(year, (v) => g.x(v));
  // The words follow the ball, kept on screen.
  const labelX = useTransform(year, (v) => Math.min(Math.max(g.x(v) - 18, g.left - 18), g.right - g.labelW + 18));
  // The ball keeps its size while the camera zooms (it becomes the iris).
  const tipScale = useTransform(zoom, (z) => 1 / (1 + (ZOOM - 1) * z));
  const words = useTransform(zoom, (z) => 1 - within(z, 0.1, 0.5));
  const chart = useTransform(fade, (f) => 1 - f);
  const head = useTransform([zoom, fade], ([z, f]) => (1 - within(z, 0, 0.6)) * (1 - f));

  const [active, setActive] = useState(0);
  const [current, setCurrent] = useState(START);
  useMotionValueEvent(progress, 'change', (p) => {
    const n = roleAt(p);
    setActive((c) => (c === n ? c : n));
    const y = yearOf(yearAt(p));
    setCurrent((c) => (c === y ? c : y));
  });
  const role = SEQ[active];
  const [bg] = useState(pickBg);
  const glowMask = useMotionTemplate`radial-gradient(${g.yearW * 3}px ${g.yearW * 3}px at ${tipX}px ${g.rulerY}px, #000 0%, transparent 100%)`;
  const logo = logoFor(role);

  return (
    <div className={styles.tl} style={{ '--ruler-y': `${g.rulerY}px` }}>
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

      <motion.div className={styles.camera} style={{ transform: camera, transformOrigin: timelineOrigin(g), opacity: chart }}>
        {bg === 'glow' && (
          <motion.span
            className={styles.glow}
            style={{
              backgroundSize: `${g.yearW}px ${g.yearW}px`,
              backgroundPosition: `${g.left % g.yearW}px ${g.rulerY % g.yearW}px`,
              WebkitMaskImage: glowMask,
              maskImage: glowMask,
            }}
            aria-hidden
          />
        )}
        <div className={styles.ruler} style={{ left: g.left, width: g.right - g.left }} />

        {/* Each role's span, drawn in its colour once the ball reaches it
            (work first, so the internships sit on top where they overlap). */}
        {[...SEQ.map((r, i) => [r, i])]
          .sort(([a], [b]) => Number(a.internship ?? false) - Number(b.internship ?? false))
          .flatMap(([r, i]) =>
            spansOf(r).map(([from, to]) => (
              <span
                key={`${keyOf(r)}-${from}`}
                className={`${styles.span} ${r.internship ? styles.intern : ''} ${i <= active ? styles.spanOn : ''}`}
                style={{ left: g.x(from), width: g.x(to) - g.x(from) }}
                aria-hidden
              />
            )),
          )}

        {YEARS.map((y) => (
          <span key={y} className={`${styles.tick} ${y <= current ? styles.tickPast : ''} ${y === current ? styles.tickOn : ''}`} style={{ left: g.x(y) }}>
            {(!g.narrow || y % 2 === 1) && <b>{y}</b>}
          </span>
        ))}
        <span className={`${styles.tick} ${styles.tickNow}`} style={{ left: g.x(NOW_YEAR) }}>
          <b>Now</b>
        </span>

        {/* Where each role began: a small dot that fills once reached. */}
        {SEQ.map((r, i) => (
          <span key={keyOf(r)} className={`${styles.start} ${r.internship ? styles.intern : ''} ${i <= active ? styles.startOn : ''}`} style={{ left: g.x(r.from) }} aria-hidden />
        ))}

        <motion.span className={`${styles.tip} ${role.internship ? styles.intern : ''}`} style={{ left: tipX, scale: tipScale }} aria-hidden />
      </motion.div>

      {/* The job the ball is on: company above the line, title and years below. */}
      <motion.div className={styles.now} style={{ x: labelX, width: g.labelW, opacity: words }} aria-live="polite">
        <div className={styles.above}>
          <AnimatePresence initial={false}>
            <motion.h3
              key={keyOf(role)}
              className={`${styles.company} ${logo ? styles.hasLogo : ''}`}
              initial={{ y: '60%', opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: '-40%', opacity: 0, filter: 'blur(6px)' }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              {logo ? <img className={styles.logo} src={logo} alt={role.company} /> : role.company}
            </motion.h3>
          </AnimatePresence>
        </div>
        <div className={styles.below}>
          <AnimatePresence initial={false}>
            <motion.div
              key={keyOf(role)}
              className={styles.detail}
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE, delay: 0.06 }}
            >
              <p className={styles.jobTitle}>{logo ? `${role.role}, ${role.company}` : role.role}</p>
              {role.full && <p className={styles.full}>{role.full}</p>}
              <p className={styles.when}>
                {years(role)}
                {role.internship && <span className={styles.tag}>Internship</span>}
                <span className={styles.count}>
                  {String(active + 1).padStart(2, '0')} of {String(SEQ.length).padStart(2, '0')}
                </span>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Every role passed stays here, in order: year, company. */}
      <motion.ol className={styles.ledger} style={{ '--left': `${g.left}px`, '--width': `${g.right - g.left}px`, '--n': SEQ.length, opacity: words }} aria-label="Roles so far">
        {SEQ.map((r, i) => (
          <li
            key={keyOf(r)}
            className={`${styles.entry} ${r.internship ? styles.intern : ''} ${i <= active ? styles.entryOn : ''} ${i === active ? styles.entryNow : ''}`}
            aria-hidden={i > active || undefined}
          >
            <span className={styles.entryYear}>{r.spans ? `(${years(r)})` : yearOf(r.from)}</span>
            <span className={styles.entryCo}>{r.company}</span>
          </li>
        ))}
      </motion.ol>
    </div>
  );
}
