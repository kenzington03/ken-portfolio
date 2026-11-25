/* Icons the Figma kit doesn't have.

   1. CustomIcon: the portfolio's own apps (About, Brief, Resume), drawn as
      iOS 26 app tiles: a colour field with a soft top light, a white glyph.
   2. Glyph: small hand-drawn SF-Symbol-style glyphs for Control Center
      (SF Symbols are Apple's, so these are drawn, not copied). */

const TILE = {
  about: { bg: 'linear-gradient(165deg, #7dd3ff 0%, #2f8bff 55%, #0a63e8 100%)' },
  brief: { bg: 'linear-gradient(165deg, #ffe08a 0%, #ffae3d 52%, #ff7a1a 100%)' },
  resume: { bg: 'linear-gradient(165deg, #a9a6ff 0%, #6f63f2 55%, #4a3fd6 100%)' },
};

const GLYPHS = {
  // a person: head and shoulders
  about: (
    <>
      <circle cx="32" cy="23.5" r="8.5" fill="#fff" />
      <path d="M14.5 50c1.2-9.7 8.4-15 17.5-15s16.3 5.3 17.5 15z" fill="#fff" />
    </>
  ),
  // a page with a pencil: write to me
  brief: (
    <>
      <path d="M17 14.5h22.5l9 9V49a3.5 3.5 0 0 1-3.5 3.5H20.5A3.5 3.5 0 0 1 17 49z" fill="#fff" />
      <path d="M39.5 14.5v6.5a2.5 2.5 0 0 0 2.5 2.5h6.5z" fill="#000" fillOpacity="0.14" />
      <path d="M23 33.5h18M23 40h12" stroke="#ff9a2e" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  // a document with a header block and lines
  resume: (
    <>
      <rect x="16" y="12.5" width="32" height="39" rx="4" fill="#fff" />
      <circle cx="26" cy="24" r="3.6" fill="#6f63f2" />
      <path d="M33 22.5h9M33 27h6" stroke="#6f63f2" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M22 36.5h20M22 42h20M22 47h12" stroke="#a9a6ff" strokeWidth="2.6" strokeLinecap="round" />
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
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 46%)' }} />
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.22))' }} aria-hidden>
        {GLYPHS[kind]}
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
};

export function Glyph({ name, size = 22, style }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block', ...style }} aria-hidden>
      {GLYPH[name]}
    </svg>
  );
}
