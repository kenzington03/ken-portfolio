// Journey B, "The Desk". You arrive above Ken's actual work surface: a green
// cutting mat with his real work prints, his card, a receipt of where he has
// worked, logo stickers and a stack of kudos notes, all draggable. The Space
// Grey MacBook sits closed in the middle, seen from above. Scroll (or click
// the Mac, or "Open my Mac") and the desk slides away while the camera swings
// down from overhead to the front: Build / Move / Ship, lid, dive, welcome.
//
// Hiring first: name, role, city and years are on the card's face, readable
// with no interaction. Everything else is play.

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import ContactCard from '../../Intro/ContactCard.jsx';
import { hasWebGL2, maxScroll, prefersReducedMotion, tweenScroll } from '../../Intro/shared.jsx';
import { POSES } from '../../Intro3/timeline.js';
import { playShutter, preloadShutter } from '../../Intro4/sfx.js';
import MacRoom from '../MacRoom.jsx';
import { CAREER, KUDOS, LOGOS, ME, STORY, WORK } from '../content.js';
import styles from './JourneyB.module.css';

// Straight-down would gimbal-flip the rig's lookAt; 1.32 rad is "overhead, a
// touch toward you", which also lets the lid's edge and logo catch light.
const OVERHEAD = { yaw: 0.0, pitch: 1.32, radius: 13.5, target: new THREE.Vector3(0, 0, 0.15) };
const DESK_POSES = { hero: OVERHEAD, front: POSES.front };

// Where things lie on the mat (percent of the desk), and their resting tilt.
const PRINTS = [
  { work: 0, x: 69, y: 9, r: 4, w: 300 },
  { work: 1, x: 3, y: 43, r: -6, w: 280 },
  { work: 2, x: 64, y: 71, r: -3, w: 260 },
  { work: 3, x: 23, y: 73, r: 7, w: 250 },
  { work: 5, x: 48, y: 5, r: -2, w: 220 },
];
// A few on the Mac's lid, like Ken's real one; one loose on the mat.
const STICKERS = [
  { logo: 0, x: 36, y: 44, r: -8 },
  { logo: 2, x: 59, y: 42, r: -14 },
  { logo: 1, x: 61, y: 64, r: 12 },
  { logo: 3, x: 39, y: 63, r: 6 },
];

let zTop = 10;

function Draggable({ deskRef, x, y, r, className, children, label, onTap, reduced, style, ...rest }) {
  const [z, setZ] = useState(() => (zTop += 1));
  const moved = useRef(false);
  return (
    <motion.div
      className={`${styles.obj} ${className}`}
      style={{ ...style, left: `${x}%`, top: `${y}%`, rotate: r, zIndex: z }}
      drag={!reduced}
      dragConstraints={deskRef}
      dragElastic={0.08}
      dragTransition={{ power: 0.18, timeConstant: 220 }}
      whileDrag={{ scale: 1.04, rotate: r * 0.4 }}
      onDragStart={() => {
        moved.current = true;
        setZ((zTop += 1));
      }}
      onPointerDown={() => {
        moved.current = false;
      }}
      onTap={() => {
        if (!moved.current) onTap?.();
      }}
      tabIndex={onTap ? 0 : -1}
      role={onTap ? 'button' : undefined}
      aria-label={label}
      onKeyDown={(e) => {
        if (onTap && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onTap();
        }
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

function BusinessCard({ deskRef, reduced }) {
  const [back, setBack] = useState(false);
  return (
    <Draggable
      deskRef={deskRef}
      reduced={reduced}
      x={5}
      y={11}
      r={-3}
      className={styles.cardWrap}
      label={back ? 'Business card, back: contact details. Activate to flip.' : 'Business card. Activate to flip for contact details.'}
      onTap={() => setBack((b) => !b)}
    >
      <div className={`${styles.card} ${back ? styles.cardBack : ''}`}>
        <div className={styles.cardFace}>
          <h1 className={styles.hello}>
            {ME.hello}
            <span className={styles.fullName}>{ME.name}</span>
          </h1>
          <p className={styles.cardRole}>
            {ME.role}, {ME.city}. {ME.years}.
          </p>
          <p className={styles.cardLine}>{ME.line}</p>
        </div>
        <div className={`${styles.cardFace} ${styles.cardFaceBack}`} aria-hidden={!back}>
          <p className={styles.cardBackName}>{ME.name}</p>
          <a className={styles.cardMail} href={`mailto:${ME.email}`} tabIndex={back ? 0 : -1}>
            {ME.email}
          </a>
          <p className={styles.cardSmall}>Projects, resume and contact live on my Mac.</p>
        </div>
      </div>
    </Draggable>
  );
}

function Receipt({ deskRef, reduced, onOpen }) {
  return (
    <Draggable deskRef={deskRef} reduced={reduced} x={85} y={44} r={-2} className={styles.receiptWrap} label="Receipt of where Ken has worked">
      <div className={styles.receipt}>
        <p className={styles.rcTitle}>KEN&apos;S CAREER</p>
        <p className={styles.rcSub}>Hyderabad, India</p>
        <ul>
          {CAREER.map((c) => (
            <li key={c.company}>
              <span>{c.company}</span>
              <span>{c.when}</span>
            </li>
          ))}
        </ul>
        <p className={styles.rcTotal}>
          <span>TOTAL</span>
          <span>{ME.years.toUpperCase()}</span>
        </p>
        <button
          type="button"
          className={styles.rcBtn}
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={onOpen}
        >
          Open my Mac
        </button>
        <p className={styles.rcThanks}>THANK YOU. COME AGAIN.</p>
      </div>
    </Draggable>
  );
}

function Kudos({ deskRef, reduced }) {
  const [i, setI] = useState(0);
  const q = KUDOS[i % KUDOS.length];
  const next = KUDOS[(i + 1) % KUDOS.length];
  return (
    <Draggable
      deskRef={deskRef}
      reduced={reduced}
      x={4}
      y={77}
      r={3}
      className={styles.notesWrap}
      label={`Kudos note ${(i % KUDOS.length) + 1} of ${KUDOS.length}. Activate to read the next one.`}
      onTap={() => setI((n) => n + 1)}
    >
      <div className={styles.noteUnder} aria-hidden>
        <p>{next.quote}</p>
      </div>
      <motion.figure
        key={i}
        className={styles.note}
        initial={reduced || i === 0 ? false : { opacity: 0, rotate: -6, y: -10 }}
        animate={{ opacity: 1, rotate: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <blockquote>“{q.quote}”</blockquote>
        <figcaption>
          {q.name}
          <small>{q.role}</small>
        </figcaption>
        <span className={styles.noteCount}>
          {(i % KUDOS.length) + 1}/{KUDOS.length}
        </span>
      </motion.figure>
    </Draggable>
  );
}

export default function JourneyB({ mode = 'open', active = true, onReachScreen, onSkip, onClosed }) {
  const [reduced] = useState(prefersReducedMotion);
  const [use3D, setUse3D] = useState(() => hasWebGL2() && !prefersReducedMotion());
  const [contactOpen, setContactOpen] = useState(false);
  const deskRef = useRef(null);
  const runwayRef = useRef(null);
  const matRef = useRef(null);
  const deskFadeRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    preloadShutter();
    return () => cancelRef.current?.();
  }, []);

  const openMac = useCallback(() => {
    playShutter({ level: 0.5 });
    if (!use3D) {
      onReachScreen?.();
      return;
    }
    cancelRef.current?.();
    cancelRef.current = tweenScroll(maxScroll(), 5200);
  }, [use3D, onReachScreen]);

  // The mat dims to the dark room as the camera leaves overhead.
  const onFrame = useCallback((y, p) => {
    const t = Math.min(1, p / 0.14);
    if (matRef.current) matRef.current.style.opacity = String(1 - t);
    if (deskFadeRef.current) deskFadeRef.current.style.opacity = String(1 - Math.min(1, y / (window.innerHeight * 0.8)));
  }, []);

  const flat = !use3D;

  return (
    <section className={`${styles.journey} ${flat ? styles.flat : ''}`} aria-label="Ken's desk">
      <MacRoom
        runwayRef={runwayRef}
        use3D={use3D}
        setUse3D={setUse3D}
        reduced={reduced}
        active={active}
        mode={mode}
        onReachScreen={onReachScreen}
        onClosed={onClosed}
        poses={DESK_POSES}
        sway={false}
        wordsOnTop
        alwaysLive
        onFrame={onFrame}
      >
        <div ref={matRef} className={styles.mat} />
      </MacRoom>

      <header className={styles.bar}>
        <span className={styles.barName}>Ken Nathanael</span>
        <nav className={styles.barLinks} aria-label="Quick links">
          <button type="button" className={styles.barLink} onClick={() => setContactOpen(true)}>
            Contact
          </button>
          <button type="button" className={styles.barLink} onClick={onSkip}>
            Skip intro
          </button>
          <button type="button" className={styles.barCta} onClick={openMac}>
            Open my Mac
          </button>
        </nav>
      </header>

      <div className={styles.page}>
        <div ref={runwayRef} className={styles.runwayStart} />
        <div ref={deskFadeRef} className={styles.deskFade}>
          <div ref={deskRef} className={styles.desk}>
            {PRINTS.map((p) => {
              const w = WORK[p.work];
              return (
                <Draggable
                  key={w.title}
                  deskRef={deskRef}
                  reduced={reduced}
                  x={p.x}
                  y={p.y}
                  r={p.r}
                  className={styles.printWrap}
                  style={{ width: p.w }}
                  label={`Print: ${w.title}. Activate to take a photo of it.`}
                  onTap={() => playShutter()}
                >
                  <figure className={styles.print}>
                    <img src={w.src} alt={w.title} draggable={false} loading="eager" />
                    <figcaption>{w.title}</figcaption>
                  </figure>
                </Draggable>
              );
            })}

            {STICKERS.map((s) => {
              const l = LOGOS[s.logo];
              return (
                <Draggable key={l.name} deskRef={deskRef} reduced={reduced} x={s.x} y={s.y} r={s.r} className={styles.sticker} label={`Sticker: ${l.name}`}>
                  <img src={l.src} alt={l.name} draggable={false} style={{ width: l.w }} />
                </Draggable>
              );
            })}

            <Draggable deskRef={deskRef} reduced={reduced} x={29} y={9} r={2} className={styles.indexWrap} label="Index card: about Ken">
              <div className={styles.index}>
                {STORY.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
            </Draggable>

            <Receipt deskRef={deskRef} reduced={reduced} onOpen={openMac} />
            <Kudos deskRef={deskRef} reduced={reduced} />
            {/* Last, so the name is never under anything. */}
            <BusinessCard deskRef={deskRef} reduced={reduced} />

            {!flat && (
              <button type="button" className={styles.macHit} onClick={openMac} aria-label="Open Ken's Mac">
                <span>Click to open</span>
              </button>
            )}
            <p className={styles.hint}>Drag anything around. Scroll or click the Mac to open it.</p>
          </div>
        </div>

        {flat ? (
          <div className={styles.flatEnd}>
            <button type="button" className={styles.barCta} onClick={() => onReachScreen?.()}>
              Open my Mac
            </button>
          </div>
        ) : (
          <div className={styles.runway} aria-hidden />
        )}
      </div>

      <ContactCard open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}
