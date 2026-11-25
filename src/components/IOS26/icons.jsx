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
  // The brands: their real glyphs (Simple Icons, CC0) on their real colours.
  claude: { bg: 'linear-gradient(180deg, #da7b5b 0%, #c4623f 100%)', light: false },
  instagram: { bg: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)', light: false },
  linkedin: { bg: 'linear-gradient(165deg, #2f8fe6 0%, #0a66c2 100%)' },
  whatsapp: { bg: 'linear-gradient(180deg, #61fd7d 0%, #25d366 55%, #1bb956 100%)', light: false },
  spotify: { bg: '#000', light: false },
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
    <path transform="translate(32 32) scale(1.6) translate(-12 -12)" fill="#fbf4ec" d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
  ),
  instagram: (
    <path transform="translate(32 32) scale(1.6) translate(-12 -12)" fill="#fff" d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
  ),
  spotify: (
    <path transform="translate(32 32) scale(2.1) translate(-12 -12)" fill="#1ed760" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  ),
  linkedin: (
    <>
      <circle cx="18.5" cy="19" r="4.2" fill="#fff" />
      <rect x="14.6" y="26.4" width="7.8" height="22.6" rx="1.4" fill="#fff" />
      <path d="M27.6 26.4h7.4v3.2c1.3-2.2 3.7-3.8 7-3.8 6 0 8.6 3.6 8.6 9.6V49h-7.8V37c0-2.8-1-4.4-3.4-4.4-2.5 0-3.8 1.7-3.8 4.4v12h-7.8z" fill="#fff" />
    </>
  ),
  whatsapp: (
    <path transform="translate(32 32) scale(1.6) translate(-12 -12)" fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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
  search: <g {...s}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></g>,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" {...s} />,
  trash: <g {...s}><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" /></g>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" {...s} strokeWidth="2.6" />,
  chevronR: <path d="M9 5l7 7-7 7" {...s} strokeWidth="2.4" />,
  up: <path d="M12 20V5M5.5 11.5L12 5l6.5 6.5" {...s} strokeWidth="2.4" />,
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
