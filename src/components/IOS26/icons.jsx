import useClock from '../../hooks/useClock.js';

/* Icons the Figma kit doesn't have.

   1. CustomIcon: tiles for the portfolio's own apps and the brands (Contacts,
      Get a Design, Claude, Instagram, LinkedIn, WhatsApp, Tips), drawn as iOS 26
      app tiles: a colour field, a soft top light, a clean glyph. All SVG in a
      64-unit box, so they stay crisp from 18px (a folder's face) to 64px.
   2. CalendarIcon: Apple's Calendar tile with today's real weekday and date.
   3. Glyph: small hand-drawn SF-Symbol-style glyphs for Control Center
      (SF Symbols are Apple's, so these are drawn, not copied). */

const TILE = {
  // Contacts: pale grey tile, a grey person, the alphabet tabs down the edge.
  contacts: { bg: 'linear-gradient(180deg, #fbfbfc 0%, #d6d6dc 100%)', light: false },
  // Get a Design: a pencil on a warm gradient.
  design: { bg: 'linear-gradient(165deg, #ffa07a 0%, #ff5d8f 48%, #8b5cff 100%)' },
  claude: { bg: 'linear-gradient(165deg, #efa987 0%, #d97757 55%, #c25d3c 100%)' },
  instagram: { bg: 'radial-gradient(circle at 30% 106%, #fdd876 0%, #fa8a23 28%, #e0306b 56%, #8f33c8 82%, #4f5bd5 100%)', light: false },
  linkedin: { bg: 'linear-gradient(165deg, #2f8fe6 0%, #0a66c2 100%)' },
  whatsapp: { bg: 'linear-gradient(165deg, #6af58f 0%, #25d366 50%, #0fa84a 100%)' },
  tips: { bg: 'linear-gradient(165deg, #ffe27a 0%, #ffbf2f 55%, #ff9f0a 100%)' },
};

const GLYPHS = {
  contacts: (
    <>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a9aa1" />
          <stop offset="1" stopColor="#5f5f66" />
        </linearGradient>
      </defs>
      <circle cx="29" cy="24" r="8.6" fill="url(#cg)" />
      <path d="M12.5 51c.9-9.6 8-15.4 16.5-15.4S44.6 41.4 45.5 51z" fill="url(#cg)" />
      {/* the alphabet tabs */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x="52.5" y={11.5 + i * 6.3} width="7.5" height="3.2" rx="1.6" fill={['#ff6b6b', '#ff9f43', '#feca57', '#54d48a', '#48b3ff', '#7d7bff', '#c46bff'][i]} />
      ))}
    </>
  ),
  design: (
    <>
      <g transform="rotate(42 32 32)">
        <rect x="26.5" y="8" width="11" height="34" rx="2.4" fill="#fff" />
        <rect x="26.5" y="8" width="11" height="7" rx="2.4" fill="#ffd1dc" />
        <path d="M26.5 42h11L32 53z" fill="#ffe7d0" />
        <path d="M30 49l2 4 2-4z" fill="#3a2a4a" />
      </g>
      <path d="M13 49.5c4-.5 6 1.3 8.4 2.2" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </>
  ),
  claude: (
    <path d="M32 9l4.4 14.2L50 18.6l-9.4 11 13.9 4.2-14 3.4L43 51 32 41l-11 10 2.5-13.8-14-3.4 13.9-4.2L14 18.6l13.6 4.6z" fill="#fff" />
  ),
  instagram: (
    <>
      <rect x="15" y="15" width="34" height="34" rx="10" fill="none" stroke="#fff" strokeWidth="3.6" />
      <circle cx="32" cy="32" r="8" fill="none" stroke="#fff" strokeWidth="3.6" />
      <circle cx="42.6" cy="21.6" r="2.3" fill="#fff" />
    </>
  ),
  linkedin: (
    <>
      <circle cx="18.5" cy="19" r="4.2" fill="#fff" />
      <rect x="14.6" y="26.4" width="7.8" height="22.6" rx="1.4" fill="#fff" />
      <path d="M27.6 26.4h7.4v3.2c1.3-2.2 3.7-3.8 7-3.8 6 0 8.6 3.6 8.6 9.6V49h-7.8V37c0-2.8-1-4.4-3.4-4.4-2.5 0-3.8 1.7-3.8 4.4v12h-7.8z" fill="#fff" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M32 11.5a20.5 20.5 0 0 0-17.6 31L11.5 52.5l10.3-2.7A20.5 20.5 0 1 0 32 11.5z" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinejoin="round" />
      <path d="M25 22.5c-1.2.5-2.4 2-2.4 4 0 4.6 7 12.2 12.4 13.6 2 .5 3.8-.8 4.4-2.2.2-.6 0-1.2-.5-1.5l-3.6-1.6c-.6-.2-1.2 0-1.5.5l-.9 1.2c-3-.9-6.3-4.2-7.2-7.2l1.2-.9c.5-.3.7-1 .4-1.5l-1.7-3.5c-.3-.6-1-.9-1.6-.7z" fill="#fff" />
    </>
  ),
  tips: (
    <>
      <path d="M32 11a15 15 0 0 0-8.6 27.3c1.4 1 2.2 2.4 2.2 4.1v1.3h12.8v-1.3c0-1.7.8-3.1 2.2-4.1A15 15 0 0 0 32 11z" fill="#fff" />
      <path d="M26.2 48.6h11.6M27.8 53.4h8.4" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
};

export const CUSTOM_BG = Object.fromEntries(Object.entries(TILE).map(([k, v]) => [k, v.bg]));

export function CustomIcon({ kind }) {
  const t = TILE[kind];
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '22.37%',
        background: t.bg,
        overflow: 'hidden',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.35), inset 0 1.5px 2px rgba(255,255,255,0.45)',
      }}
    >
      {/* the soft light along the top edge that iOS 26 tiles have */}
      {t.light !== false && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 46%)' }} />}
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} aria-hidden>
        {GLYPHS[kind]}
      </svg>
    </div>
  );
}

/* ───────── Calendar: today's real weekday and date ───────── */

const weekday = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
const dayOfMonth = (d) => String(d.getDate());

export function CalendarIcon() {
  // useClock re-reads on each minute boundary and when the tab comes back, so
  // the icon turns over at midnight without a reload.
  const wd = useClock(weekday);
  const day = useClock(dayOfMonth);
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '22.37%',
        background: 'linear-gradient(180deg, #ffffff 0%, #f1f1f4 100%)',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
      }}
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} role="img" aria-label={`${wd} ${day}`}>
        <text x="32" y="19.5" textAnchor="middle" fontFamily="-apple-system, 'SF Pro', system-ui, sans-serif" fontSize="11.5" fontWeight="600" fill="#ff3b30">
          {wd}
        </text>
        <text x="32" y="52" textAnchor="middle" fontFamily="-apple-system, 'SF Pro Display', system-ui, sans-serif" fontSize={day.length > 1 ? 36 : 40} fontWeight="300" fill="#1c1c1e" letterSpacing="-1">
          {day}
        </text>
      </svg>
    </div>
  );
}

/* ───────── Control Center glyphs (currentColor, 1em box) ───────── */

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const GLYPH = {
  airplane: (
    <path d="M12 2.8c.9 0 1.6.9 1.6 2v4.6l7.4 4.7v2.1l-7.4-2.3v4.2l2 1.5v1.6L12 20.4l-3.6 1.1v-1.6l2-1.5v-4.2L3 16.2v-2.1l7.4-4.7V4.8c0-1.1.7-2 1.6-2z" fill="currentColor" />
  ),
  airdrop: (
    <g {...s}>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M8.6 15.4a4.8 4.8 0 1 1 6.8 0M5.6 18.4a9 9 0 1 1 12.8 0" />
    </g>
  ),
  wifi: (
    <g {...s}>
      <path d="M2.6 9.2a13.5 13.5 0 0 1 18.8 0M5.9 12.7a8.8 8.8 0 0 1 12.2 0M9.1 16a4.2 4.2 0 0 1 5.8 0" />
      <circle cx="12" cy="19.4" r="1.1" fill="currentColor" stroke="none" />
    </g>
  ),
  bluetooth: <path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9" {...s} />,
  cellular: (
    <g fill="currentColor">
      <rect x="3" y="15" width="3.4" height="5" rx="1" />
      <rect x="8.2" y="11.5" width="3.4" height="8.5" rx="1" />
      <rect x="13.4" y="8" width="3.4" height="12" rx="1" />
      <rect x="18.6" y="4" width="3.4" height="16" rx="1" />
    </g>
  ),
  hotspot: (
    <g {...s}>
      <path d="M9.6 14.4a3.8 3.8 0 1 1 4.8 0M6.4 17.6a8.2 8.2 0 1 1 11.2 0" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </g>
  ),
  globe: (
    <g {...s}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2M12 3.4c2.6 2.4 3.9 5.3 3.9 8.6s-1.3 6.2-3.9 8.6c-2.6-2.4-3.9-5.3-3.9-8.6S9.4 5.8 12 3.4z" />
    </g>
  ),
  camera: (
    <g>
      <path d="M8.4 5.2h7.2l1.5 2.4H20a2 2 0 0 1 2 2v8.2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.6a2 2 0 0 1 2-2h2.9z" fill="currentColor" />
      <circle cx="12" cy="13.6" r="3.7" fill="#000" fillOpacity="0.45" />
    </g>
  ),
  bellSlash: (
    <g {...s}>
      <path d="M6 16.5v-4.8a6 6 0 0 1 9.4-4.9M18 11.7v4.8l1.6 1.8H8.6" />
      <path d="M10.2 20.2a2 2 0 0 0 3.6 0M3.5 3.5l17 17" />
    </g>
  ),
  moon: <path d="M20 14.2A8.6 8.6 0 0 1 9.8 4 8.6 8.6 0 1 0 20 14.2z" fill="currentColor" />,
  sun: (
    <g {...s}>
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.4 5.4l1.8 1.8M16.8 16.8l1.8 1.8M5.4 18.6l1.8-1.8M16.8 7.2l1.8-1.8" />
    </g>
  ),
  speaker: (
    <g>
      <path d="M3 9.4h3.6L11.4 5v14l-4.8-4.4H3z" fill="currentColor" />
      <path d="M14.6 9a4.4 4.4 0 0 1 0 6M17.2 6.6a8 8 0 0 1 0 10.8" {...s} />
    </g>
  ),
  bulb: (
    <g>
      <path d="M12 2.6a6.2 6.2 0 0 0-3.6 11.3c.6.5.9 1.1.9 1.8v.4h5.4v-.4c0-.7.3-1.3.9-1.8A6.2 6.2 0 0 0 12 2.6z" fill="currentColor" />
      <path d="M9.6 18.2h4.8M10.4 20.8h3.2" {...s} />
    </g>
  ),
  rotationLock: (
    <g {...s}>
      <path d="M19.4 9.4A8 8 0 0 0 5 8M4.6 14.6A8 8 0 0 0 19 16" />
      <path d="M5 4v4h4M19 20v-4h-4" />
      <rect x="9.6" y="11.4" width="4.8" height="3.8" rx="1" fill="currentColor" stroke="none" />
      <path d="M10.6 11.4v-.9a1.4 1.4 0 0 1 2.8 0" />
    </g>
  ),
  mirror: (
    <g {...s}>
      <rect x="7.6" y="3.6" width="13" height="9.6" rx="2" />
      <path d="M16.4 16.4v1.2a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2V9.4a2 2 0 0 1 2-2h1" />
    </g>
  ),
  battery: (
    <g>
      <rect x="2.6" y="7.4" width="17" height="9.2" rx="2.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4.4" y="9.2" width="12.6" height="5.6" rx="1.6" fill="currentColor" />
      <path d="M21.4 10.4v3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  play: <path d="M7 4.6v14.8L19.6 12z" fill="currentColor" />,
  forward: <path d="M3.4 6.2v11.6L11.2 12zM12 6.2v11.6L19.8 12z" fill="currentColor" />,
  backward: <path d="M20.6 6.2v11.6L12.8 12zM12 6.2v11.6L4.2 12z" fill="currentColor" />,
  airplay: (
    <g>
      <path d="M6.6 17.4a8.4 8.4 0 1 1 10.8 0" {...s} />
      <path d="M12 14.4l4 5.4H8z" fill="currentColor" />
    </g>
  ),
  heart: <path d="M12 20.6s-8-4.9-8-10.9A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.7c0 6-8 10.9-8 10.9z" fill="currentColor" />,
  home: <path d="M3.5 11.2L12 3.8l8.5 7.4M5.6 9.8V20h4.6v-5.2h3.6V20h4.6V9.8" {...s} />,
  back: <path d="M14.6 4.6L7.2 12l7.4 7.4" {...s} strokeWidth="2.6" />,
  help: (
    <g {...s}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.4a2.7 2.7 0 1 1 3.9 2.4c-.9.5-1.3 1-1.3 2" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </g>
  ),
};

export function Glyph({ name, size = 22, style }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block', ...style }} aria-hidden>
      {GLYPH[name]}
    </svg>
  );
}
